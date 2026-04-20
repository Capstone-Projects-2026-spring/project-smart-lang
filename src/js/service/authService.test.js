/**
 * Tests for authService.js
 * Tests Google OAuth authentication service with Firebase and localStorage persistence.
 */

// Mock Firebase modules before importing authService
const mockSignInWithPopup = jest.fn();
const mockSignOut = jest.fn();
const mockOnAuthStateChanged = jest.fn();

jest.mock("firebase/auth", () => ({
  signInWithPopup: (...args) => mockSignInWithPopup(...args),
  signOut: (...args) => mockSignOut(...args),
  onAuthStateChanged: (...args) => mockOnAuthStateChanged(...args),
}));

jest.mock("./firebaseConfig.js", () => ({
  auth: { currentUser: null },
  googleProvider: {},
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    _getStore: () => store,
  };
})();

Object.defineProperty(global, "localStorage", {
  value: localStorageMock,
  writable: true,
});

import { authService } from "./authService.js";

describe("authService", () => {
  const AUTH_KEY = "SMART_LANG_AUTH";
  const ROLE_KEY = "SMART_LANG_PENDING_ROLE";

  // Mock Firebase user data
  const mockFirebaseUser = {
    uid: "firebase-uid-123",
    displayName: "Test User",
    email: "test@example.com",
    photoURL: "https://example.com/photo.jpg",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();

    // Default mock implementations
    mockSignInWithPopup.mockResolvedValue({ user: mockFirebaseUser });
    mockSignOut.mockResolvedValue();
  });

  describe("constants", () => {
    test("ROLE_CAREGIVER is defined correctly", () => {
      expect(authService.ROLE_CAREGIVER).toBe("caregiver");
    });

    test("ROLE_STUDENT is defined correctly", () => {
      expect(authService.ROLE_STUDENT).toBe("student");
    });
  });

  describe("getAuthState", () => {
    test("returns null when no auth state exists", () => {
      expect(authService.getAuthState()).toBeNull();
    });

    test("returns parsed auth state from localStorage", () => {
      const mockState = {
        role: "caregiver",
        name: "Test User",
        email: "test@example.com",
      };
      localStorageMock.setItem(AUTH_KEY, JSON.stringify(mockState));

      const result = authService.getAuthState();
      expect(result).toEqual(mockState);
    });

    test("returns null when localStorage contains invalid JSON", () => {
      localStorageMock.getItem.mockReturnValueOnce("invalid-json{");

      const result = authService.getAuthState();
      expect(result).toBeNull();
    });

    test("returns null when localStorage throws error", () => {
      localStorageMock.getItem.mockImplementationOnce(() => {
        throw new Error("localStorage error");
      });

      const result = authService.getAuthState();
      expect(result).toBeNull();
    });
  });

  describe("isLoggedIn", () => {
    test("returns false when not logged in", () => {
      expect(authService.isLoggedIn()).toBe(false);
    });

    test("returns true when user is logged in", () => {
      const mockState = {
        role: "caregiver",
        name: "Test",
        email: "test@test.com",
      };
      localStorageMock.setItem(AUTH_KEY, JSON.stringify(mockState));

      expect(authService.isLoggedIn()).toBe(true);
    });
  });

  describe("getRole", () => {
    test("returns null when not logged in", () => {
      expect(authService.getRole()).toBeNull();
    });

    test("returns caregiver role when logged in as caregiver", () => {
      const mockState = {
        role: "caregiver",
        name: "Caregiver",
        email: "cg@test.com",
      };
      localStorageMock.setItem(AUTH_KEY, JSON.stringify(mockState));

      expect(authService.getRole()).toBe("caregiver");
    });

    test("returns student role when logged in as student", () => {
      const mockState = {
        role: "student",
        name: "Student",
        email: "st@test.com",
      };
      localStorageMock.setItem(AUTH_KEY, JSON.stringify(mockState));

      expect(authService.getRole()).toBe("student");
    });
  });

  describe("isCaregiver", () => {
    test("returns false when not logged in", () => {
      expect(authService.isCaregiver()).toBe(false);
    });

    test("returns true when logged in as caregiver", () => {
      const mockState = { role: "caregiver", name: "CG", email: "cg@test.com" };
      localStorageMock.setItem(AUTH_KEY, JSON.stringify(mockState));

      expect(authService.isCaregiver()).toBe(true);
    });

    test("returns false when logged in as student", () => {
      const mockState = { role: "student", name: "ST", email: "st@test.com" };
      localStorageMock.setItem(AUTH_KEY, JSON.stringify(mockState));

      expect(authService.isCaregiver()).toBe(false);
    });
  });

  describe("isStudent", () => {
    test("returns false when not logged in", () => {
      expect(authService.isStudent()).toBe(false);
    });

    test("returns true when logged in as student", () => {
      const mockState = { role: "student", name: "ST", email: "st@test.com" };
      localStorageMock.setItem(AUTH_KEY, JSON.stringify(mockState));

      expect(authService.isStudent()).toBe(true);
    });

    test("returns false when logged in as caregiver", () => {
      const mockState = { role: "caregiver", name: "CG", email: "cg@test.com" };
      localStorageMock.setItem(AUTH_KEY, JSON.stringify(mockState));

      expect(authService.isStudent()).toBe(false);
    });
  });

  describe("getStudentId", () => {
    test("returns null when not logged in", () => {
      expect(authService.getStudentId()).toBeNull();
    });

    test("returns null when logged in but no studentId exists", () => {
      const mockState = { role: "student", name: "ST", email: "st@test.com" };
      localStorageMock.setItem(AUTH_KEY, JSON.stringify(mockState));

      expect(authService.getStudentId()).toBeNull();
    });

    test("returns studentId when logged in as student with studentId", () => {
      const mockState = {
        role: "student",
        name: "ST",
        email: "st@test.com",
        studentId: "SL-ABC1",
      };
      localStorageMock.setItem(AUTH_KEY, JSON.stringify(mockState));

      expect(authService.getStudentId()).toBe("SL-ABC1");
    });

    test("returns null for caregiver (no studentId)", () => {
      const mockState = { role: "caregiver", name: "CG", email: "cg@test.com" };
      localStorageMock.setItem(AUTH_KEY, JSON.stringify(mockState));

      expect(authService.getStudentId()).toBeNull();
    });
  });

  describe("setStudentId", () => {
    test("returns null when no auth state exists", () => {
      expect(authService.setStudentId("SL-ABCD")).toBeNull();
    });

    test("updates studentId when logged in as student", () => {
      const mockState = {
        role: "student",
        name: "ST",
        email: "st@test.com",
        uid: "firebase-uid-123",
        studentId: "SL-OLD1",
      };
      localStorageMock.setItem(AUTH_KEY, JSON.stringify(mockState));

      const updated = authService.setStudentId("SL-NEW1");

      expect(updated.studentId).toBe("SL-NEW1");
      expect(authService.getStudentId()).toBe("SL-NEW1");
    });

    test("returns null when logged in as caregiver", () => {
      const mockState = {
        role: "caregiver",
        name: "CG",
        email: "cg@test.com",
        uid: "firebase-uid-123",
      };
      localStorageMock.setItem(AUTH_KEY, JSON.stringify(mockState));

      expect(authService.setStudentId("SL-ABCD")).toBeNull();
    });
  });

  describe("loginWithGoogle", () => {
    test("logs in as caregiver with Firebase user data", async () => {
      const result = await authService.loginWithGoogle("caregiver");

      expect(result.role).toBe("caregiver");
      expect(result.name).toBe("Test User");
      expect(result.email).toBe("test@example.com");
      expect(result.uid).toBe("firebase-uid-123");
      expect(result.photoURL).toBe("https://example.com/photo.jpg");
      expect(result.studentId).toBeUndefined();
      expect(mockSignInWithPopup).toHaveBeenCalled();
    });

    test("logs in as student with Firebase user data and generates studentId", async () => {
      const result = await authService.loginWithGoogle("student");

      expect(result.role).toBe("student");
      expect(result.name).toBe("Test User");
      expect(result.email).toBe("test@example.com");
      expect(result.uid).toBe("firebase-uid-123");
      expect(result.studentId).toMatch(/^SL-[A-Z0-9]{4}$/);
    });

    test.skip('preserves existing studentId on student re-login with same uid', async () => {
      const existingState = {
        role: "student",
        name: "ST",
        email: "st@test.com",
        uid: "firebase-uid-123",
        studentId: "SL-KEEP",
      };
      localStorageMock.setItem(AUTH_KEY, JSON.stringify(existingState));

      const result = await authService.loginWithGoogle("student");

      expect(result.studentId).toBe("SL-KEEP");
    });

    test("generates new studentId when uid differs", async () => {
      const existingState = {
        role: "student",
        name: "ST",
        email: "st@test.com",
        uid: "different-uid",
        studentId: "SL-OLD1",
      };
      localStorageMock.setItem(AUTH_KEY, JSON.stringify(existingState));

      const result = await authService.loginWithGoogle("student");

      expect(result.studentId).toMatch(/^SL-[A-Z0-9]{4}$/);
      expect(result.studentId).not.toBe("SL-OLD1");
    });

    test("stores auth state in localStorage", async () => {
      await authService.loginWithGoogle("caregiver");

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        AUTH_KEY,
        expect.any(String),
      );
    });

    test("handles Firebase sign-in error", async () => {
      const error = new Error("Firebase error");
      error.code = "auth/popup-closed-by-user";
      mockSignInWithPopup.mockRejectedValue(error);

      await expect(authService.loginWithGoogle("caregiver")).rejects.toThrow(
        "Firebase error",
      );
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(ROLE_KEY);
    });

    test("handles user with no displayName", async () => {
      mockSignInWithPopup.mockResolvedValue({
        user: { ...mockFirebaseUser, displayName: null },
      });

      const result = await authService.loginWithGoogle("caregiver");

      expect(result.name).toBe("User");
    });
  });

  describe("signUpWithGoogle", () => {
    test("behaves identically to loginWithGoogle for caregiver", async () => {
      const result = await authService.signUpWithGoogle("caregiver");

      expect(result.role).toBe("caregiver");
      expect(result.name).toBe("Test User");
      expect(result.email).toBe("test@example.com");
    });

    test("behaves identically to loginWithGoogle for student", async () => {
      const result = await authService.signUpWithGoogle("student");

      expect(result.role).toBe("student");
      expect(result.studentId).toMatch(/^SL-[A-Z0-9]{4}$/);
    });
  });

  describe("logout", () => {
    test("removes auth state from localStorage and signs out of Firebase", async () => {
      const mockState = { role: "caregiver", name: "CG", email: "cg@test.com" };
      localStorageMock.setItem(AUTH_KEY, JSON.stringify(mockState));

      await authService.logout();

      expect(mockSignOut).toHaveBeenCalled();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(AUTH_KEY);
    });

    test("works when not logged in", async () => {
      await expect(authService.logout()).resolves.not.toThrow();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(AUTH_KEY);
    });

    test("still clears localStorage if Firebase signOut fails", async () => {
      mockSignOut.mockRejectedValue(new Error("Network error"));
      const mockState = { role: "caregiver", name: "CG", email: "cg@test.com" };
      localStorageMock.setItem(AUTH_KEY, JSON.stringify(mockState));

      await authService.logout();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith(AUTH_KEY);
    });
  });

  describe("integration scenarios", () => {
    test("full login/check/logout cycle for caregiver", async () => {
      expect(authService.isLoggedIn()).toBe(false);

      await authService.loginWithGoogle("caregiver");

      expect(authService.isLoggedIn()).toBe(true);
      expect(authService.isCaregiver()).toBe(true);
      expect(authService.isStudent()).toBe(false);

      await authService.logout();

      expect(authService.isLoggedIn()).toBe(false);
    });

    test("full login/check/logout cycle for student", async () => {
      expect(authService.isLoggedIn()).toBe(false);

      const result = await authService.loginWithGoogle("student");
      const studentId = result.studentId;

      expect(authService.isLoggedIn()).toBe(true);
      expect(authService.isStudent()).toBe(true);
      expect(authService.isCaregiver()).toBe(false);
      expect(authService.getStudentId()).toBe(studentId);

      await authService.logout();

      expect(authService.isLoggedIn()).toBe(false);
      expect(authService.getStudentId()).toBeNull();
    });

    test("role switch from caregiver to student preserves no studentId initially", async () => {
      await authService.loginWithGoogle("caregiver");
      expect(authService.getStudentId()).toBeNull();

      const result = await authService.loginWithGoogle("student");
      expect(result.studentId).toMatch(/^SL-[A-Z0-9]{4}$/);
    });
  });
});
