// Mock window.localStorage BEFORE module imports
const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
};

// Set up window mock before any imports
global.window = {
    localStorage: mockLocalStorage
};

// Mock global log
global.log = {
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
};

// Mocks first, then imports
jest.mock('../../util/constants', () => ({
    constants: {
        LOCAL_DEMO_USERNAME: 'local-demo-user',
        LOCAL_DEFAULT_USER_PREFIX: 'default-',
        EVENT_APPSETTINGS_UPDATED: 'EVENT_APPSETTINGS_UPDATED',
        EVENT_USERSETTINGS_UPDATED: 'EVENT_USERSETTINGS_UPDATED'
    }
}));

jest.mock('../../model/SettingsApp.js', () => ({
    SettingsApp: jest.fn().mockImplementation((data) => ({
        ...data,
        appLang: data?.appLang || '',
        unlockPasscode: data?.unlockPasscode
    }))
}));

jest.mock('../../model/SettingsUserLocal.js', () => ({
    SettingsUserLocal: jest.fn().mockImplementation((data) => ({
        ...data,
        username: data?.username || '',
        password: data?.password !== undefined ? data.password : '',
        modelVersionDb: data?.modelVersionDb || null
    }))
}));

const mockTrigger = jest.fn();
const mockDocumentObject = { trigger: mockTrigger };

// Create a mock document that can be referenced
const mockDocument = {};
global.document = mockDocument;

const mockJquery = jest.fn((selector) => {
    if (selector === mockDocument) {
        return mockDocumentObject;
    }
    return { trigger: mockTrigger };
});

jest.mock('../../externals/jquery.js', () => ({
    default: mockJquery
}));

import { localStorageService } from './localStorageService';
import { SettingsApp } from '../../model/SettingsApp.js';
import { SettingsUserLocal } from '../../model/SettingsUserLocal.js';

describe('localStorageService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockLocalStorage.getItem.mockReset();
        mockLocalStorage.setItem.mockReset();
        mockLocalStorage.removeItem.mockReset();
        log.error.mockClear();
        log.info.mockClear();
        log.warn.mockClear();
        log.debug.mockClear();
    });

    describe('save', () => {
        test('saves key/value pair to localStorage', () => {
            localStorageService.save('testKey', 'testValue');
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith('testKey', 'testValue');
        });

        test('handles storage errors gracefully', () => {
            mockLocalStorage.setItem.mockImplementation(() => {
                throw new Error('Storage full');
            });
            localStorageService.save('testKey', 'testValue');
            expect(log.error).toHaveBeenCalled();
        });
    });

    describe('get', () => {
        test('retrieves value from localStorage', () => {
            mockLocalStorage.getItem.mockReturnValue('storedValue');
            const result = localStorageService.get('testKey');
            expect(result).toBe('storedValue');
            expect(mockLocalStorage.getItem).toHaveBeenCalledWith('testKey');
        });

        test('returns null for missing key', () => {
            mockLocalStorage.getItem.mockReturnValue(null);
            const result = localStorageService.get('nonExistentKey');
            expect(result).toBeNull();
        });

        test('handles storage errors gracefully', () => {
            mockLocalStorage.getItem.mockImplementation(() => {
                throw new Error('Access denied');
            });
            localStorageService.get('testKey');
            expect(log.error).toHaveBeenCalled();
        });
    });

    describe('remove', () => {
        test('removes key from localStorage', () => {
            localStorageService.remove('testKey');
            expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('testKey');
        });

        test('handles storage errors gracefully', () => {
            mockLocalStorage.removeItem.mockImplementation(() => {
                throw new Error('Access denied');
            });
            localStorageService.remove('testKey');
            expect(log.error).toHaveBeenCalled();
        });
    });

    describe('saveJSON / getJSON', () => {
        test('saves object as JSON string', () => {
            const testObject = { name: 'test', value: 123 };
            localStorageService.saveJSON('jsonKey', testObject);
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith('jsonKey', JSON.stringify(testObject));
        });

        test('retrieves and parses JSON from storage', () => {
            const storedObject = { name: 'test', value: 123 };
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedObject));
            const result = localStorageService.getJSON('jsonKey');
            expect(result).toEqual(storedObject);
        });

        test('handles null JSON gracefully', () => {
            mockLocalStorage.getItem.mockReturnValue(null);
            const result = localStorageService.getJSON('nullKey');
            expect(result).toBeNull();
        });

        test('throws on corrupted JSON data', () => {
            mockLocalStorage.getItem.mockReturnValue('not valid json {');
            expect(() => localStorageService.getJSON('corruptedKey')).toThrow();
        });
    });

    describe('getAppSettings / saveAppSettings', () => {
        test('returns SettingsApp instance', () => {
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify({ appLang: 'de' }));
            const settings = localStorageService.getAppSettings();
            expect(SettingsApp).toHaveBeenCalled();
        });

        test('saves and merges app settings', () => {
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify({ appLang: 'en' }));
            localStorageService.saveAppSettings({ unlockPasscode: '1234' });
            expect(mockLocalStorage.setItem).toHaveBeenCalled();
            expect(mockDocumentObject.trigger).toHaveBeenCalled();
        });

        test('handles null settings', () => {
            mockLocalStorage.getItem.mockReturnValue(null);
            localStorageService.saveAppSettings(null);
            expect(mockLocalStorage.setItem).toHaveBeenCalled();
        });
    });

    describe('getUserSettings / saveUserSettings', () => {
        test('returns SettingsUserLocal for valid user', () => {
            mockLocalStorage.getItem
                .mockReturnValueOnce('testUser')
                .mockReturnValueOnce(JSON.stringify({
                    testUser: { password: 'hashedPw', contentLang: 'en' }
                }));
            const settings = localStorageService.getUserSettings('testUser');
            expect(SettingsUserLocal).toHaveBeenCalled();
        });

        test('returns empty SettingsUserLocal when no user found', () => {
            mockLocalStorage.getItem.mockReturnValue(null);
            const settings = localStorageService.getUserSettings();
            expect(SettingsUserLocal).toHaveBeenCalled();
        });

        test('saves user settings for specified user', () => {
            mockLocalStorage.getItem
                .mockReturnValueOnce('testUser')
                .mockReturnValueOnce(JSON.stringify({}))
                .mockReturnValueOnce(JSON.stringify({}));
            localStorageService.saveUserSettings({ password: 'newHash' }, 'testUser');
            expect(mockLocalStorage.setItem).toHaveBeenCalled();
        });

        test('does not save when no username available', () => {
            mockLocalStorage.getItem.mockReturnValue(null);
            localStorageService.saveUserSettings({ password: 'hash' });
            expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
        });
    });

    describe('getAutoImportedUserSettings', () => {
        test('returns settings for auto-imported users', () => {
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
                'default-1': { password: '' },
                'default-2': { password: '' },
                'normalUser': { password: 'hash' }
            }));
            const result = localStorageService.getAutoImportedUserSettings();
            expect(result).toHaveLength(2);
        });

        test('returns empty array when no auto users exist', () => {
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
                'normalUser': { password: 'hash' }
            }));
            const result = localStorageService.getAutoImportedUserSettings();
            expect(result).toHaveLength(0);
        });
    });

    describe('getNextAutoUserName', () => {
        test('returns first available auto username', () => {
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify({}));
            const result = localStorageService.getNextAutoUserName();
            expect(result).toBe('default-1');
        });

        test('skips existing auto usernames', () => {
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
                'default-1': {},
                'default-2': {}
            }));
            const result = localStorageService.getNextAutoUserName();
            expect(result).toBe('default-3');
        });

        test('returns fallback when all slots taken', () => {
            const allUsers = {};
            for (let i = 1; i < 20; i++) {
                allUsers[`default-${i}`] = {};
            }
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify(allUsers));
            const result = localStorageService.getNextAutoUserName();
            expect(result).toBe('default-fallback');
        });
    });

    describe('isSavedLocalUser', () => {
        test('returns true for local user without password', () => {
            mockLocalStorage.getItem
                .mockReturnValueOnce('localUser')
                .mockReturnValueOnce(JSON.stringify({
                    localUser: { password: '' }
                }));
            expect(localStorageService.isSavedLocalUser('localUser')).toBe(true);
        });

        test('returns false for online user with password', () => {
            mockLocalStorage.getItem
                .mockReturnValueOnce('onlineUser')
                .mockReturnValueOnce(JSON.stringify({
                    onlineUser: { password: 'hashedPassword' }
                }));
            expect(localStorageService.isSavedLocalUser('onlineUser')).toBe(false);
        });
    });

    describe('saveUserPassword', () => {
        test('saves password to user settings', () => {
            mockLocalStorage.getItem
                .mockReturnValueOnce('user1')
                .mockReturnValueOnce(JSON.stringify({}))
                .mockReturnValueOnce(JSON.stringify({}));
            localStorageService.saveUserPassword('user1', 'hashedPw');
            expect(mockLocalStorage.setItem).toHaveBeenCalled();
        });
    });

    describe('removeLocalUser', () => {
        test('removes user from settings and clears autologin if matches', () => {
            mockLocalStorage.getItem
                .mockReturnValueOnce(JSON.stringify(['user1']))
                .mockReturnValueOnce(JSON.stringify({ user1: { password: '' } }))
                .mockReturnValueOnce('user1');
            localStorageService.removeLocalUser('user1');
            expect(mockLocalStorage.setItem).toHaveBeenCalled();
        });
    });

    describe('getSavedUsers / getSavedLocalUsers / getSavedOnlineUsers', () => {
        test('returns combined list of all users', () => {
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
                localUser: { password: '' },
                onlineUser: { password: 'hash' }
            }));
            const result = localStorageService.getSavedUsers();
            expect(result).toContain('localUser');
            expect(result).toContain('onlineUser');
        });

        test('returns logged in user first when specified', () => {
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
                user1: { password: '' },
                user2: { password: 'hash' }
            }));
            const result = localStorageService.getSavedUsers('user2');
            expect(result[0]).toBe('user2');
        });

        test('getSavedLocalUsers returns only users without password', () => {
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
                localUser: { password: '' },
                onlineUser: { password: 'hash' }
            }));
            const result = localStorageService.getSavedLocalUsers();
            expect(result).toContain('localUser');
            expect(result).not.toContain('onlineUser');
        });

        test('getSavedOnlineUsers returns only users with password', () => {
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
                localUser: { password: '' },
                onlineUser: { password: 'hash' }
            }));
            const result = localStorageService.getSavedOnlineUsers();
            expect(result).toContain('onlineUser');
            expect(result).not.toContain('localUser');
        });

        test('sorts local-demo-user to end of list', () => {
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify({
                'local-demo-user': { password: '' },
                aUser: { password: '' }
            }));
            const result = localStorageService.getSavedLocalUsers();
            expect(result[result.length - 1]).toBe('local-demo-user');
        });
    });

    describe('setLastActiveUser / getLastActiveUser', () => {
        test('saves and retrieves last active user', () => {
            localStorageService.setLastActiveUser('activeUser');
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith('LAST_ACTIVEUSER_KEY', 'activeUser');

            mockLocalStorage.getItem.mockReturnValue('activeUser');
            expect(localStorageService.getLastActiveUser()).toBe('activeUser');
        });
    });

    describe('setAutologinUser / getAutologinUser', () => {
        test('saves and retrieves autologin user', () => {
            localStorageService.setAutologinUser('autoUser');
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith('AUTOLOGIN_USER_KEY', 'autoUser');

            mockLocalStorage.getItem.mockReturnValue('autoUser');
            expect(localStorageService.getAutologinUser()).toBe('autoUser');
        });

        test('does not save demo user as autologin', () => {
            localStorageService.setAutologinUser('local-demo-user');
            expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
        });
    });

    describe('getAutologinOrActiveUser', () => {
        test('returns autologin user if available', () => {
            mockLocalStorage.getItem.mockReturnValueOnce('autoUser');
            expect(localStorageService.getAutologinOrActiveUser()).toBe('autoUser');
        });

        test('falls back to last active user', () => {
            mockLocalStorage.getItem
                .mockReturnValueOnce(null)
                .mockReturnValueOnce('activeUser');
            expect(localStorageService.getAutologinOrActiveUser()).toBe('activeUser');
        });
    });

    describe('markSyncedDatabase / isDatabaseSynced / unmarkSyncedDatabase', () => {
        test('marks database as synced', () => {
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify([]));
            localStorageService.markSyncedDatabase('testDb');
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                'SYNCED_DBS_LIST_KEY',
                expect.stringContaining('testDb')
            );
        });

        test('does not duplicate database in synced list', () => {
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify(['testDb']));
            localStorageService.markSyncedDatabase('testDb');
            const savedValue = mockLocalStorage.setItem.mock.calls[0]?.[1];
            if (savedValue) {
                const list = JSON.parse(savedValue);
                expect(list.filter(db => db === 'testDb')).toHaveLength(1);
            }
        });

        test('isDatabaseSynced returns true for synced database', () => {
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify(['testDb']));
            expect(localStorageService.isDatabaseSynced('testDb')).toBe(true);
        });

        test('isDatabaseSynced returns false for unsynced database', () => {
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify(['otherDb']));
            expect(localStorageService.isDatabaseSynced('testDb')).toBe(false);
        });

        test('unmarkSyncedDatabase removes database from list', () => {
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify(['testDb', 'otherDb']));
            localStorageService.unmarkSyncedDatabase('testDb');
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                'SYNCED_DBS_LIST_KEY',
                JSON.stringify(['otherDb'])
            );
        });
    });

    describe('getUserMajorModelVersion / setUserModelVersion', () => {
        test('returns major version from user settings', () => {
            mockLocalStorage.getItem
                .mockReturnValueOnce('testUser')
                .mockReturnValueOnce(JSON.stringify({
                    testUser: { modelVersionDb: '{"major": 5, "minor": 0}' }
                }));
            SettingsUserLocal.mockImplementationOnce((data) => ({
                modelVersionDb: data?.modelVersionDb || null
            }));
            const version = localStorageService.getUserMajorModelVersion('testUser');
            expect(version).toBe(5);
        });

        test('returns 1 when no version stored', () => {
            mockLocalStorage.getItem
                .mockReturnValueOnce('testUser')
                .mockReturnValueOnce(JSON.stringify({}));
            SettingsUserLocal.mockImplementationOnce(() => ({
                modelVersionDb: null
            }));
            const version = localStorageService.getUserMajorModelVersion('testUser');
            expect(version).toBe(1);
        });

        test('setUserModelVersion updates when new version is greater', () => {
            mockLocalStorage.getItem
                .mockReturnValueOnce('testUser')
                .mockReturnValueOnce(JSON.stringify({}))
                .mockReturnValueOnce('testUser')
                .mockReturnValueOnce(JSON.stringify({}))
                .mockReturnValueOnce(JSON.stringify({}));
            SettingsUserLocal.mockImplementation(() => ({
                modelVersionDb: null
            }));
            localStorageService.setUserModelVersion('testUser', '{"major": 6, "minor": 0}');
            expect(mockLocalStorage.setItem).toHaveBeenCalled();
        });
    });

    describe('saveLastGridDimensions / getLastGridDimensions', () => {
        test('saves and retrieves grid dimensions', () => {
            const dimensions = { rows: 5, cols: 8 };
            localStorageService.saveLastGridDimensions(dimensions);
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
                'AG_GRID_DIMENSIONS_KEY',
                JSON.stringify(dimensions)
            );
        });

        test('returns stored dimensions', () => {
            mockLocalStorage.getItem.mockReturnValue(JSON.stringify({ rows: 4, cols: 6 }));
            const result = localStorageService.getLastGridDimensions();
            expect(result).toEqual({ rows: 4, cols: 6 });
        });

        test('returns empty object when no dimensions stored', () => {
            mockLocalStorage.getItem.mockReturnValue(null);
            const result = localStorageService.getLastGridDimensions();
            expect(result).toEqual({});
        });
    });

    describe('getCurrentAppVersion / setCurrentAppVersion', () => {
        test('saves and retrieves current app version', () => {
            localStorageService.setCurrentAppVersion('1.2.3');
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith('AG_CURRENT_VERSION_KEY', '1.2.3');

            mockLocalStorage.getItem.mockReturnValue('1.2.3');
            expect(localStorageService.getCurrentAppVersion()).toBe('1.2.3');
        });
    });

    describe('edge cases', () => {
        test('handles empty objects', () => {
            localStorageService.saveJSON('emptyKey', {});
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith('emptyKey', '{}');
        });

        test('handles arrays', () => {
            localStorageService.saveJSON('arrayKey', [1, 2, 3]);
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith('arrayKey', '[1,2,3]');
        });

        test('handles nested objects', () => {
            const nested = { a: { b: { c: 'deep' } } };
            localStorageService.saveJSON('nestedKey', nested);
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith('nestedKey', JSON.stringify(nested));
        });

        test('handles special characters in keys', () => {
            localStorageService.save('special-key_123', 'value');
            expect(mockLocalStorage.setItem).toHaveBeenCalledWith('special-key_123', 'value');
        });
    });
});
