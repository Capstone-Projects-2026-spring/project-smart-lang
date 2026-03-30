/**
 * authService.js
 * Mocked Google OAuth authentication service.
 * Tracks logged-in user role (caregiver or student) in localStorage.
 * Actual Google OAuth integration will replace the mock methods later.
 */

let authService = {};

const AUTH_KEY = 'SMART_LANG_AUTH';
const ROLE_CAREGIVER = 'caregiver';
const ROLE_STUDENT = 'student';

authService.ROLE_CAREGIVER = ROLE_CAREGIVER;
authService.ROLE_STUDENT = ROLE_STUDENT;

/**
 * Generates a short unique student ID (e.g., "SL-A3F2").
 */
function generateStudentId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let id = 'SL-';
    for (let i = 0; i < 4; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return id;
}

/**
 * Returns the current auth state from localStorage, or null if not logged in.
 * @returns {{ role: string, name: string, email: string, studentId?: string } | null}
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
 * Mock Google OAuth login.
 * In a real implementation this would trigger the Google OAuth flow.
 * For now, immediately resolves with mock user data.
 *
 * @param {string} role - ROLE_CAREGIVER or ROLE_STUDENT
 * @returns {Promise<{ role: string, name: string, email: string, studentId?: string }>}
 */
authService.loginWithGoogle = function (role) {
    return new Promise((resolve) => {
        // Mock: pretend Google returned a user
        const mockUser = {
            role: role,
            name: role === ROLE_CAREGIVER ? 'Caregiver User' : 'Student User',
            email: role === ROLE_CAREGIVER ? 'caregiver@example.com' : 'student@example.com',
        };
        if (role === ROLE_STUDENT) {
            // Preserve existing student ID if already set
            const existing = authService.getAuthState();
            mockUser.studentId = (existing && existing.studentId) ? existing.studentId : generateStudentId();
        }
        localStorage.setItem(AUTH_KEY, JSON.stringify(mockUser));
        resolve(mockUser);
    });
};

/**
 * Mock Google OAuth sign-up (identical to login for now).
 *
 * @param {string} role - ROLE_CAREGIVER or ROLE_STUDENT
 * @returns {Promise<{ role: string, name: string, email: string, studentId?: string }>}
 */
authService.signUpWithGoogle = function (role) {
    return authService.loginWithGoogle(role);
};

/**
 * Logs out the current user.
 */
authService.logout = function () {
    localStorage.removeItem(AUTH_KEY);
};

export { authService };
