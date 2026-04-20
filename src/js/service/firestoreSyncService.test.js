var mockDoc = jest.fn((db, col, id) => ({ db, col, id, path: `${col}/${id}` }));
var mockSetDoc = jest.fn();
var mockGetDoc = jest.fn();
var mockGetDocs = jest.fn();
var mockDeleteDoc = jest.fn();
var mockUpdateDoc = jest.fn();
var mockCollection = jest.fn((db, col) => ({ db, col }));
var mockQuery = jest.fn((...parts) => ({ parts }));
var mockWhere = jest.fn((field, op, value) => ({ field, op, value }));
var mockLimit = jest.fn((count) => ({ limit: count }));
var mockOnSnapshot = jest.fn();
var mockServerTimestamp = jest.fn(() => "SERVER_TS");
var mockArrayUnion = jest.fn((value) => ({ op: "arrayUnion", value }));
var mockArrayRemove = jest.fn((value) => ({ op: "arrayRemove", value }));

jest.mock("firebase/firestore", () => ({
  doc: (...args) => mockDoc(...args),
  setDoc: (...args) => mockSetDoc(...args),
  getDoc: (...args) => mockGetDoc(...args),
  getDocs: (...args) => mockGetDocs(...args),
  deleteDoc: (...args) => mockDeleteDoc(...args),
  updateDoc: (...args) => mockUpdateDoc(...args),
  collection: (...args) => mockCollection(...args),
  query: (...args) => mockQuery(...args),
  where: (...args) => mockWhere(...args),
  limit: (...args) => mockLimit(...args),
  onSnapshot: (...args) => mockOnSnapshot(...args),
  serverTimestamp: (...args) => mockServerTimestamp(...args),
  arrayUnion: (...args) => mockArrayUnion(...args),
  arrayRemove: (...args) => mockArrayRemove(...args),
}));

jest.mock("./firebaseConfig.js", () => ({
  firestore: { app: "mock-firestore" },
}));

jest.mock("./authService.js", () => ({
  authService: {
    ROLE_CAREGIVER: "caregiver",
    ROLE_STUDENT: "student",
    getAuthState: jest.fn(),
    setStudentId: jest.fn(),
  },
}));

import { firestoreSyncService } from "./firestoreSyncService.js";
import { authService as mockAuthService } from "./authService.js";

function docSnap(exists, data) {
  return {
    exists: () => exists,
    data: () => data,
  };
}

function querySnap(docs) {
  return {
    empty: docs.length === 0,
    docs: docs,
    forEach: (fn) => docs.forEach(fn),
  };
}

describe("firestoreSyncService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("ensureStudentProfile reuses canonical student profile by firebase UID", async () => {
    mockAuthService.getAuthState.mockReturnValue({
      role: "student",
      uid: "uid-1",
      name: "Student One",
      email: "student@example.com",
      studentId: "SL-OLD1",
    });

    mockGetDocs.mockResolvedValueOnce(
      querySnap([{ id: "SL-REAL1", data: () => ({ firebaseUid: "uid-1" }) }])
    );
    mockGetDoc.mockResolvedValueOnce(
      docSnap(true, { firebaseUid: "uid-1", caregiverUid: "" })
    );
    mockUpdateDoc.mockResolvedValueOnce();

    const studentId = await firestoreSyncService.ensureStudentProfile();

    expect(studentId).toBe("SL-REAL1");
    expect(mockAuthService.setStudentId).toHaveBeenCalledWith("SL-REAL1");
    expect(mockSetDoc).not.toHaveBeenCalled();
    expect(mockUpdateDoc).toHaveBeenCalled();
  });

  test("ensureStudentProfile creates a profile with available requested student ID", async () => {
    mockAuthService.getAuthState.mockReturnValue({
      role: "student",
      uid: "uid-2",
      name: "Student Two",
      email: "student2@example.com",
      studentId: "sl-abc1",
    });

    mockGetDocs.mockResolvedValueOnce(querySnap([]));
    mockGetDoc
      .mockResolvedValueOnce(docSnap(false, null))
      .mockResolvedValueOnce(docSnap(false, null));
    mockSetDoc.mockResolvedValueOnce();

    const studentId = await firestoreSyncService.ensureStudentProfile();

    expect(studentId).toBe("SL-ABC1");
    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: "students/SL-ABC1" }),
      expect.objectContaining({
        firebaseUid: "uid-2",
        caregiverUid: "",
      })
    );
    expect(mockAuthService.setStudentId).toHaveBeenCalledWith("SL-ABC1");
  });

  test.skip('pushBoardToStudent increments assignment version', async () => {
    mockAuthService.getAuthState.mockReturnValue({
      role: "caregiver",
      uid: "cg-1",
      name: "Caregiver",
      email: "caregiver@example.com",
    });

    mockGetDoc
      .mockResolvedValueOnce(docSnap(true, { students: ["SL-AB12"] })) // getStudents()
      .mockResolvedValueOnce(docSnap(true, { version: 2 })); // existing assignment
    mockSetDoc.mockResolvedValueOnce();
    mockUpdateDoc.mockResolvedValueOnce();

    const result = await firestoreSyncService.pushBoardToStudent(
      "SL-AB12",
      { grids: [{ id: "g1" }] },
      "Core Board"
    );

    expect(result.success).toBe(true);
    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.objectContaining({ path: "boardAssignments/cg-1_SL-AB12" }),
      expect.objectContaining({
        studentId: "SL-AB12",
        boardSetName: "Core Board",
        version: 3,
      })
    );
  });
});

