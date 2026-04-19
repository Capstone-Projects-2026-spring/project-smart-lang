/**
 * firestoreSyncService.js
 *
 * Cloud sync layer using Firestore for caregiver↔student relationships.
 * PouchDB remains the local runtime store for board data.
 * Firestore is used ONLY for:
 *   - Caregiver ↔ Student linking (one-to-many)
 *   - Board assignment push/pull between caregiver and student devices
 *
 * Data flow:
 *   Caregiver: export board JSON → push to Firestore
 *   Student:   listen for updates → pull from Firestore → import into PouchDB
 */

import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  collection,
  query,
  where,
  limit,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { firestore } from "./firebaseConfig.js";
import { authService } from "./authService.js";

let firestoreSyncService = {};

// Collection names
const CAREGIVERS_COL = "caregivers";
const STUDENTS_COL = "students";
const BOARD_ASSIGNMENTS_COL = "boardAssignments";
const STUDENT_ID_REGEX = /^SL-[A-Z0-9]{4}$/;
const STUDENT_ID_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// Active Firestore listener unsubscribe function (to avoid leaking listeners)
let _boardUpdateUnsubscribe = null;

function normalizeStudentId(studentId) {
  return String(studentId || "")
    .trim()
    .toUpperCase();
}

function isValidStudentId(studentId) {
  return STUDENT_ID_REGEX.test(studentId);
}

function getAssignmentSequence(assignment) {
  let version = Number(assignment?.version || 0);
  if (version > 0) {
    return version;
  }
  return assignment?.updatedAt ? assignment.updatedAt.toMillis() : 0;
}

function parseBoardDataField(data, contextLabel) {
  if (!data || !data.boardData) {
    return data;
  }
  try {
    data.boardData = JSON.parse(data.boardData);
  } catch (e) {
    console.error(`Failed to parse board data ${contextLabel}:`, e);
    data.boardData = null;
  }
  return data;
}


// ============================================================================
// Caregiver Profile
// ============================================================================

/**
 * Creates or updates the caregiver profile in Firestore.
 * Called after a caregiver logs in.
 *
 * @returns {Promise<void>}
 */
firestoreSyncService.ensureCaregiverProfile = async function () {
  let authState = authService.getAuthState();
  if (!authState || authState.role !== authService.ROLE_CAREGIVER) {
    return;
  }
  let caregiverRef = doc(firestore, CAREGIVERS_COL, authState.uid);
  let existing = await getDoc(caregiverRef);
  if (!existing.exists()) {
    await setDoc(caregiverRef, {
      name: authState.name,
      email: authState.email,
      students: [],
      createdAt: serverTimestamp(),
    });
  } else {
    // Update name/email in case they changed
    await updateDoc(caregiverRef, {
      name: authState.name,
      email: authState.email,
    });
  }
};

// ============================================================================
// Student Management (Caregiver side)
// ============================================================================

/**
 * Links a student to the current caregiver by student ID.
 * Creates the student document if it doesn't exist yet.
 *
 * @param {string} studentId - The student's ID (e.g. "SL-A3F2")
 * @returns {Promise<{success: boolean, message: string}>}
 */
firestoreSyncService.addStudent = async function (studentId) {
  let authState = authService.getAuthState();
  if (!authState || authState.role !== authService.ROLE_CAREGIVER) {
    return { success: false, message: "Not logged in as caregiver" };
  }

  studentId = normalizeStudentId(studentId);
  if (!isValidStudentId(studentId)) {
    return { success: false, message: "Invalid student ID format." };
  }

  await firestoreSyncService.ensureCaregiverProfile();
  let caregiverUid = authState.uid;

  // Check if the student document already exists
  let studentRef = doc(firestore, STUDENTS_COL, studentId);
  let studentSnap = await getDoc(studentRef);

  if (studentSnap.exists()) {
    let studentData = studentSnap.data();
    // Check if already linked to a different caregiver
    if (studentData.caregiverUid && studentData.caregiverUid !== caregiverUid) {
      return {
        success: false,
        message: "This student is already linked to another caregiver.",
      };
    }
    if (studentData.caregiverUid === caregiverUid) {
      // Already linked to this caregiver — ensure they're in the caregiver's list too
      let caregiverRef2 = doc(firestore, CAREGIVERS_COL, caregiverUid);
      await updateDoc(caregiverRef2, { students: arrayUnion(studentId) });
      return { success: true, message: "Student is already linked to your account." };
    }
    // Student exists but not linked — link them
    await updateDoc(studentRef, {
      caregiverUid: caregiverUid,
      linkedAt: serverTimestamp(),
    });
  } else {
    // Create student document (student hasn't registered yet)
    await setDoc(studentRef, {
      caregiverUid: caregiverUid,
      name: "",
      email: "",
      activeBoardSet: "",
      firebaseUid: "",
      createdAt: serverTimestamp(),
      linkedAt: serverTimestamp(),
    });
  }

  // Add student to caregiver's list
  let caregiverRef = doc(firestore, CAREGIVERS_COL, caregiverUid);
  await updateDoc(caregiverRef, {
    students: arrayUnion(studentId),
  });

  return { success: true, message: "Student linked successfully." };
};

/**
 * Unlinks a student from the current caregiver.
 *
 * @param {string} studentId
 * @returns {Promise<void>}
 */
firestoreSyncService.removeStudent = async function (studentId) {
  let authState = authService.getAuthState();
  if (!authState || authState.role !== authService.ROLE_CAREGIVER) {
    return;
  }
  studentId = normalizeStudentId(studentId);

  let caregiverUid = authState.uid;

  // Remove from caregiver's list
  let caregiverRef = doc(firestore, CAREGIVERS_COL, caregiverUid);
  await updateDoc(caregiverRef, {
    students: arrayRemove(studentId),
  });

  // Clear caregiver link in student document
  let studentRef = doc(firestore, STUDENTS_COL, studentId);
  let studentSnap = await getDoc(studentRef);
  if (
    studentSnap.exists() &&
    studentSnap.data().caregiverUid === caregiverUid
  ) {
    await updateDoc(studentRef, { caregiverUid: "" });
  }

  // Delete any board assignments for this student from this caregiver
  let assignmentsQuery = query(
    collection(firestore, BOARD_ASSIGNMENTS_COL),
    where("caregiverUid", "==", caregiverUid),
    where("studentId", "==", studentId),
  );
  let assignmentSnaps = await getDocs(assignmentsQuery);
  let deletePromises = assignmentSnaps.docs.map((d) => deleteDoc(d.ref));
  await Promise.all(deletePromises);
};

/**
 * Returns a student's info (name, email, activeBoardSet) from Firestore.
 *
 * @param {string} studentId
 * @returns {Promise<{id: string, name: string, email: string, activeBoardSet: string}|null>}
 */
firestoreSyncService.getStudentInfo = async function (studentId) {
  if (!studentId) return null;
  try {
    let ref = doc(firestore, STUDENTS_COL, normalizeStudentId(studentId));
    let snap = await getDoc(ref);
    if (!snap.exists()) return null;
    let d = snap.data();
    return {
      id: snap.id,
      name: d.name || '',
      email: d.email || '',
      activeBoardSet: d.activeBoardSet || '',
    };
  } catch (e) {
    console.warn('getStudentInfo failed for', studentId, e);
    return null;
  }
};

/**
 * Returns the list of student IDs linked to the current caregiver.
 *
 * @returns {Promise<string[]>}
 */
firestoreSyncService.getStudents = async function () {
  let authState = authService.getAuthState();
  if (!authState || authState.role !== authService.ROLE_CAREGIVER) {
    return [];
  }

  let caregiverRef = doc(firestore, CAREGIVERS_COL, authState.uid);
  let caregiverSnap = await getDoc(caregiverRef);
  if (!caregiverSnap.exists()) {
    return [];
  }
  return caregiverSnap.data().students || [];
};

/**
 * Returns detailed info about a specific student.
 *
 * @param {string} studentId
 * @returns {Promise<object|null>}
 */
firestoreSyncService.getStudentInfo = async function (studentId) {
  studentId = normalizeStudentId(studentId);
  let studentRef = doc(firestore, STUDENTS_COL, studentId);
  let studentSnap = await getDoc(studentRef);
  if (!studentSnap.exists()) {
    return null;
  }
  return { id: studentId, ...studentSnap.data() };
};

// ============================================================================
// Board Assignment (Caregiver → Student)
// ============================================================================

/**
 * Pushes tile visibility settings to a student.
 * Sends only { gridId: [hiddenElementId, ...] } — a few hundred bytes.
 * The student already has the default board; this just controls what's shown.
 *
 * @param {string} studentId
 * @param {Object} visibilityConfig - { [gridId]: string[] } map of hidden element IDs per grid
 * @returns {Promise<{success: boolean, message: string}>}
 */
firestoreSyncService.pushVisibilityToStudent = async function (studentId, visibilityConfig) {
  let authState = authService.getAuthState();
  if (!authState || authState.role !== authService.ROLE_CAREGIVER) {
    return { success: false, message: "Not logged in as caregiver." };
  }

  let caregiverUid = authState.uid;
  studentId = normalizeStudentId(studentId);

  let students = await firestoreSyncService.getStudents();
  if (!students.includes(studentId)) {
    return { success: false, message: "Student is not linked to your account." };
  }

  let assignmentId = `${caregiverUid}_${studentId}`;
  let assignmentRef = doc(firestore, BOARD_ASSIGNMENTS_COL, assignmentId);
  let existingSnap = await getDoc(assignmentRef);
  let nextVersion = existingSnap.exists()
    ? Number(existingSnap.data().version || 0) + 1
    : 1;

  await setDoc(assignmentRef, {
    caregiverUid,
    studentId,
    type: "visibility",
    version: nextVersion,
    visibilityConfig,
    updatedAt: serverTimestamp(),
  });

  await updateDoc(doc(firestore, STUDENTS_COL, studentId), {
    lastUpdatedBy: caregiverUid,
    lastUpdatedAt: serverTimestamp(),
  }).catch(() => {});

  return { success: true, message: "Board settings pushed to student." };
};

/**
 * Gets the latest board assignment for a student.
 *
 * @param {string} studentId
 * @returns {Promise<object|null>} The board assignment data, or null
 */
firestoreSyncService.getLatestBoardAssignment = async function (studentId) {
  studentId = normalizeStudentId(studentId);
  // Query for assignments targeting this student
  let assignmentsQuery = query(
    collection(firestore, BOARD_ASSIGNMENTS_COL),
    where("studentId", "==", studentId),
  );
  let assignmentSnaps = await getDocs(assignmentsQuery);

  if (assignmentSnaps.empty) {
    return null;
  }

  // If multiple assignments, pick the most recently updated
  let latestDoc = null;
  let latestSequence = 0;
  assignmentSnaps.forEach((docSnap) => {
    let data = docSnap.data();
    let sequence = getAssignmentSequence(data);
    if (sequence > latestSequence) {
      latestSequence = sequence;
      latestDoc = { id: docSnap.id, ...data };
    }
  });

  return parseBoardDataField(latestDoc, "from getLatestBoardAssignment");
};

// ============================================================================
// Board Update Listener (Student side)
// ============================================================================

/**
 * Sets up a real-time listener for board assignment changes for the given student.
 * When a caregiver pushes a new board, the callback is called with the board data.
 *
 * @param {string} studentId
 * @param {function} callback - Called with (boardAssignment) when a new board is available
 * @returns {function} Unsubscribe function
 */
firestoreSyncService.listenForBoardUpdates = function (studentId, callback) {
  // Clean up any existing listener
  firestoreSyncService.stopListening();
  studentId = normalizeStudentId(studentId);

  let assignmentsQuery = query(
    collection(firestore, BOARD_ASSIGNMENTS_COL),
    where("studentId", "==", studentId),
  );

  _boardUpdateUnsubscribe = onSnapshot(
    assignmentsQuery,
    (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added" || change.type === "modified") {
          let data = parseBoardDataField(change.doc.data(), "from listener");
          if (data.boardData || data.visibilityConfig) {
            callback({ id: change.doc.id, ...data });
          }
        }
      });
    },
    (error) => {
      console.error("Board update listener error:", error);
    },
  );

  return _boardUpdateUnsubscribe;
};

/**
 * Stops listening for board updates (cleans up the Firestore listener).
 */
firestoreSyncService.stopListening = function () {
  if (_boardUpdateUnsubscribe) {
    _boardUpdateUnsubscribe();
    _boardUpdateUnsubscribe = null;
  }
};

// ============================================================================
// Student Profile (Student side)
// ============================================================================

/**
 * Ensures the student profile exists in Firestore.
 * Called after a student logs in.
 *
 * @returns {Promise<string|null>} canonical student ID
 */
firestoreSyncService.ensureStudentProfile = async function () {
  let authState = authService.getAuthState();
  if (!authState || authState.role !== authService.ROLE_STUDENT) {
    return null;
  }

  // The student ID is now derived deterministically from the Firebase UID
  // by authService.loginWithGoogle. It is always the same for a given Google account.
  // We still check Firestore in case there is a legacy random ID from before this fix.
  let studentId = null;

  // 1. Check if a document already exists for this Firebase UID (legacy or existing)
  let existingByUidQuery = query(
    collection(firestore, STUDENTS_COL),
    where("firebaseUid", "==", authState.uid),
    limit(1)
  );
  let existingByUid = await getDocs(existingByUidQuery);

  if (!existingByUid.empty) {
    // Found an existing student document — use its ID as the canonical one.
    studentId = existingByUid.docs[0].id;
  } else {
    // No document found. Use the deterministic ID computed by authService.
    studentId = normalizeStudentId(authState.studentId);
    if (!isValidStudentId(studentId)) {
      throw new Error(
        `ensureStudentProfile: invalid student ID in authState: ${studentId}`
      );
    }
  }

  // Create or update the student document
  let studentRef = doc(firestore, STUDENTS_COL, studentId);
  let existing = await getDoc(studentRef);

  if (!existing.exists()) {
    await setDoc(studentRef, {
      caregiverUid: "",
      name: authState.name,
      email: authState.email,
      activeBoardSet: "",
      firebaseUid: authState.uid,
      createdAt: serverTimestamp(),
    });
  } else {
    // Update name/email and ensure Firebase UID mapping is set
    await updateDoc(studentRef, {
      name: authState.name,
      email: authState.email,
      firebaseUid: authState.uid,
    });
  }

  // Sync the canonical student ID back to localStorage if it differs
  if (authState.studentId !== studentId) {
    authService.setStudentId(studentId);
  }
  return studentId;
};

/**
 * Returns the student ID of the current user from Firestore, confirming it exists.
 *
 * @returns {Promise<string|null>}
 */
firestoreSyncService.getCurrentStudentId = function () {
  let authState = authService.getAuthState();
  if (!authState || authState.role !== authService.ROLE_STUDENT) {
    return null;
  }
  return authState.studentId || null;
};

export { firestoreSyncService };
