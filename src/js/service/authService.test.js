/**
 * Tests for authService.js
 * Tests Google OAuth mock authentication service with localStorage persistence.
 */

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

Object.defineProperty(global, 'localStorage', {
    value: localStorageMock,
    writable: true,
});

import { authService } from './authService.js';

describe('authService', () => {
    const AUTH_KEY = 'SMART_LANG_AUTH';

    beforeEach(() => {
        jest.clearAllMocks();
        localStorageMock.clear();
    });

    describe('constants', () => {
        test('ROLE_CAREGIVER is defined correctly', () => {
            expect(authService.ROLE_CAREGIVER).toBe('caregiver');
        });

        test('ROLE_STUDENT is defined correctly', () => {
            expect(authService.ROLE_STUDENT).toBe('student');
        });
    });

    describe('getAuthState', () => {
        test('returns null when no auth state exists', () => {
            expect(authService.getAuthState()).toBeNull();
        });

        test('returns parsed auth state from localStorage', () => {
            const mockState = { role: 'caregiver', name: 'Test User', email: 'test@example.com' };
            localStorageMock.setItem(AUTH_KEY, JSON.stringify(mockState));

            const result = authService.getAuthState();
            expect(result).toEqual(mockState);
        });

        test('returns null when localStorage contains invalid JSON', () => {
            localStorageMock.getItem.mockReturnValueOnce('invalid-json{');

            const result = authService.getAuthState();
            expect(result).toBeNull();
        });

        test('returns null when localStorage throws error', () => {
            localStorageMock.getItem.mockImplementationOnce(() => {
                throw new Error('localStorage error');
            });

            const result = authService.getAuthState();
            expect(result).toBeNull();
        });
    });

    describe('isLoggedIn', () => {
        test('returns false when not logged in', () => {
            expect(authService.isLoggedIn()).toBe(false);
        });

        test('returns true when user is logged in', () => {
            const mockState = { role: 'caregiver', name: 'Test', email: 'test@test.com' };
            localStorageMock.setItem(AUTH_KEY, JSON.stringify(mockState));

            expect(authService.isLoggedIn()).toBe(true);
        });
    });

    describe('getRole', () => {
        test('returns null when not logged in', () => {
            expect(authService.getRole()).toBeNull();
        });

        test('returns caregiver role when logged in as caregiver', () => {
            const mockState = { role: 'caregiver', name: 'Caregiver', email: 'cg@test.com' };
            localStorageMock.setItem(AUTH_KEY, JSON.stringify(mockState));

            expect(authService.getRole()).toBe('caregiver');
        });

        test('returns student role when logged in as student', () => {
            const mockState = { role: 'student', name: 'Student', email: 'st@test.com' };
            localStorageMock.setItem(AUTH_KEY, JSON.stringify(mockState));

            expect(authService.getRole()).toBe('student');
        });
    });

    describe('isCaregiver', () => {
        test('returns false when not logged in', () => {
            expect(authService.isCaregiver()).toBe(false);
        });

        test('returns true when logged in as caregiver', () => {
            const mockState = { role: 'caregiver', name: 'CG', email: 'cg@test.com' };
            localStorageMock.setItem(AUTH_KEY, JSON.stringify(mockState));

            expect(authService.isCaregiver()).toBe(true);
        });

        test('returns false when logged in as student', () => {
            const mockState = { role: 'student', name: 'ST', email: 'st@test.com' };
            localStorageMock.setItem(AUTH_KEY, JSON.stringify(mockState));

            expect(authService.isCaregiver()).toBe(false);
        });
    });

    describe('isStudent', () => {
        test('returns false when not logged in', () => {
            expect(authService.isStudent()).toBe(false);
        });

        test('returns true when logged in as student', () => {
            const mockState = { role: 'student', name: 'ST', email: 'st@test.com' };
            localStorageMock.setItem(AUTH_KEY, JSON.stringify(mockState));

            expect(authService.isStudent()).toBe(true);
        });

        test('returns false when logged in as caregiver', () => {
            const mockState = { role: 'caregiver', name: 'CG', email: 'cg@test.com' };
            localStorageMock.setItem(AUTH_KEY, JSON.stringify(mockState));

            expect(authService.isStudent()).toBe(false);
        });
    });

    describe('getStudentId', () => {
        test('returns null when not logged in', () => {
            expect(authService.getStudentId()).toBeNull();
        });

        test('returns null when logged in but no studentId exists', () => {
            const mockState = { role: 'student', name: 'ST', email: 'st@test.com' };
            localStorageMock.setItem(AUTH_KEY, JSON.stringify(mockState));

            expect(authService.getStudentId()).toBeNull();
        });

        test('returns studentId when logged in as student with studentId', () => {
            const mockState = { role: 'student', name: 'ST', email: 'st@test.com', studentId: 'SL-ABC1' };
            localStorageMock.setItem(AUTH_KEY, JSON.stringify(mockState));

            expect(authService.getStudentId()).toBe('SL-ABC1');
        });

        test('returns null for caregiver (no studentId)', () => {
            const mockState = { role: 'caregiver', name: 'CG', email: 'cg@test.com' };
            localStorageMock.setItem(AUTH_KEY, JSON.stringify(mockState));

            expect(authService.getStudentId()).toBeNull();
        });
    });

    describe('loginWithGoogle', () => {
        test('logs in as caregiver with correct mock data', async () => {
            const result = await authService.loginWithGoogle('caregiver');

            expect(result.role).toBe('caregiver');
            expect(result.name).toBe('Caregiver User');
            expect(result.email).toBe('caregiver@example.com');
            expect(result.studentId).toBeUndefined();
            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                AUTH_KEY,
                expect.stringContaining('caregiver')
            );
        });

        test('logs in as student with correct mock data and generates studentId', async () => {
            const result = await authService.loginWithGoogle('student');

            expect(result.role).toBe('student');
            expect(result.name).toBe('Student User');
            expect(result.email).toBe('student@example.com');
            expect(result.studentId).toMatch(/^SL-[A-Z0-9]{4}$/);
        });

        test('preserves existing studentId on student re-login', async () => {
            const existingState = { role: 'student', name: 'ST', email: 'st@test.com', studentId: 'SL-KEEP' };
            localStorageMock.setItem(AUTH_KEY, JSON.stringify(existingState));

            const result = await authService.loginWithGoogle('student');

            expect(result.studentId).toBe('SL-KEEP');
        });

        test('generates new studentId when no existing studentId', async () => {
            const existingState = { role: 'caregiver', name: 'CG', email: 'cg@test.com' };
            localStorageMock.setItem(AUTH_KEY, JSON.stringify(existingState));

            const result = await authService.loginWithGoogle('student');

            expect(result.studentId).toMatch(/^SL-[A-Z0-9]{4}$/);
        });

        test('stores auth state in localStorage', async () => {
            await authService.loginWithGoogle('caregiver');

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                AUTH_KEY,
                expect.any(String)
            );
        });
    });

    describe('signUpWithGoogle', () => {
        test('behaves identically to loginWithGoogle for caregiver', async () => {
            const result = await authService.signUpWithGoogle('caregiver');

            expect(result.role).toBe('caregiver');
            expect(result.name).toBe('Caregiver User');
            expect(result.email).toBe('caregiver@example.com');
        });

        test('behaves identically to loginWithGoogle for student', async () => {
            const result = await authService.signUpWithGoogle('student');

            expect(result.role).toBe('student');
            expect(result.studentId).toMatch(/^SL-[A-Z0-9]{4}$/);
        });
    });

    describe('logout', () => {
        test('removes auth state from localStorage', () => {
            const mockState = { role: 'caregiver', name: 'CG', email: 'cg@test.com' };
            localStorageMock.setItem(AUTH_KEY, JSON.stringify(mockState));

            authService.logout();

            expect(localStorageMock.removeItem).toHaveBeenCalledWith(AUTH_KEY);
        });

        test('works when not logged in', () => {
            expect(() => authService.logout()).not.toThrow();
            expect(localStorageMock.removeItem).toHaveBeenCalledWith(AUTH_KEY);
        });
    });

    describe('integration scenarios', () => {
        test('full login/check/logout cycle for caregiver', async () => {
            expect(authService.isLoggedIn()).toBe(false);

            await authService.loginWithGoogle('caregiver');

            expect(authService.isLoggedIn()).toBe(true);
            expect(authService.isCaregiver()).toBe(true);
            expect(authService.isStudent()).toBe(false);

            authService.logout();

            expect(authService.isLoggedIn()).toBe(false);
        });

        test('full login/check/logout cycle for student', async () => {
            expect(authService.isLoggedIn()).toBe(false);

            const result = await authService.loginWithGoogle('student');
            const studentId = result.studentId;

            expect(authService.isLoggedIn()).toBe(true);
            expect(authService.isStudent()).toBe(true);
            expect(authService.isCaregiver()).toBe(false);
            expect(authService.getStudentId()).toBe(studentId);

            authService.logout();

            expect(authService.isLoggedIn()).toBe(false);
            expect(authService.getStudentId()).toBeNull();
        });

        test('role switch from caregiver to student preserves no studentId initially', async () => {
            await authService.loginWithGoogle('caregiver');
            expect(authService.getStudentId()).toBeNull();

            const result = await authService.loginWithGoogle('student');
            expect(result.studentId).toMatch(/^SL-[A-Z0-9]{4}$/);
        });
    });
});
