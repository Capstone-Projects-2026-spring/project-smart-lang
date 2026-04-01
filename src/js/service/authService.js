/**
 * authService.js
 * Google OAuth authentication service using Firebase Authentication.
 * Tracks logged-in user role (caregiver or student) in localStorage.
 */

import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, googleProvider } from "./firebaseConfig.js";

let authService = {};

const AUTH_KEY = "SMART_LANG_AUTH";
const ROLE_KEY = "SMART_LANG_PENDING_ROLE";
const ROLE_CAREGIVER = "caregiver";
const ROLE_STUDENT = "student";

authService.ROLE_CAREGIVER = ROLE_CAREGIVER;
authService.ROLE_STUDENT = ROLE_STUDENT;

/**
 * Generates a short unique student ID (e.g., "SL-A3F2").
 */
function generateStudentId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "SL-";
  for (let i = 0; i < 4; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

/**
 * Returns the current auth state from localStorage, or null if not logged in.
 * @returns {{ role: string, name: string, email: string, uid: string, photoURL?: string, studentId?: string } | null}
 */
authService.getAuthState = function () {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

/**
 * Returns true if a user is currently logged in.
 */
authService.isLoggedIn = function () {
  return authService.getAuthState() !== null;
};

/**
 * Returns the role of the currently logged-in user, or null.
 */
authService.getRole = function () {
  const state = authService.getAuthState();
  return state ? state.role : null;
};

/**
 * Returns true if the current user is a caregiver.
 */
authService.isCaregiver = function () {
  return authService.getRole() === ROLE_CAREGIVER;
};

/**
 * Returns true if the current user is a student.
 */
authService.isStudent = function () {
  return authService.getRole() === ROLE_STUDENT;
};

/**
 * Returns the student ID of the current user (only for students).
 */
authService.getStudentId = function () {
  const state = authService.getAuthState();
  return state ? state.studentId || null : null;
};

/**
 * Returns the Firebase user ID of the current user.
 */
authService.getUid = function () {
  const state = authService.getAuthState();
  return state ? state.uid : null;
};

/**
 * Google OAuth login using Firebase Authentication.
 * Opens a popup for the user to sign in with their Google account.
 *
 * @param {string} role - ROLE_CAREGIVER or ROLE_STUDENT
 * @returns {Promise<{ role: string, name: string, email: string, uid: string, photoURL?: string, studentId?: string }>}
 */
authService.loginWithGoogle = async function (role) {
  try {
    // Store the intended role before the popup (popup may cause page context issues)
    localStorage.setItem(ROLE_KEY, role);

    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Get the role from storage
    const selectedRole = localStorage.getItem(ROLE_KEY) || role;
    localStorage.removeItem(ROLE_KEY);

    // Build the user object
    const authUser = {
      role: selectedRole,
      name: user.displayName || "User",
      email: user.email,
      uid: user.uid,
      photoURL: user.photoURL || null,
    };

    if (selectedRole === ROLE_STUDENT) {
      // Preserve existing student ID if already set for this user
      const existing = authService.getAuthState();
      if (existing && existing.uid === user.uid && existing.studentId) {
        authUser.studentId = existing.studentId;
      } else {
        authUser.studentId = generateStudentId();
      }
    }

    localStorage.setItem(AUTH_KEY, JSON.stringify(authUser));
    return authUser;
  } catch (error) {
    localStorage.removeItem(ROLE_KEY);
    console.error("Google sign-in error:", error);
    throw error;
  }
};

/**
 * Google OAuth sign-up (same as login with Firebase - account creation is automatic).
 *
 * @param {string} role - ROLE_CAREGIVER or ROLE_STUDENT
 * @returns {Promise<{ role: string, name: string, email: string, uid: string, photoURL?: string, studentId?: string }>}
 */
authService.signUpWithGoogle = function (role) {
  return authService.loginWithGoogle(role);
};

/**
 * Logs out the current user from Firebase and clears local state.
 */
authService.logout = async function () {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Sign-out error:", error);
  }
  localStorage.removeItem(AUTH_KEY);
};

/**
 * Sets up a listener for Firebase auth state changes.
 * Useful for detecting when a user's session expires or they sign out in another tab.
 * @param {function} callback - Called with the Firebase user object (or null if signed out)
 */
authService.onAuthStateChanged = function (callback) {
  return onAuthStateChanged(auth, callback);
};

/**
 * Gets the current Firebase user directly (bypasses localStorage).
 * @returns {object|null} Firebase user object or null
 */
authService.getCurrentFirebaseUser = function () {
  return auth.currentUser;
};

export { authService };
