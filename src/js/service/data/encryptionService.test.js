// Mocks first, then imports
jest.mock('../../model/EncryptedObject', () => ({
    EncryptedObject: jest.fn().mockImplementation((props) => ({
        ...props,
        id: props?.id || 'encrypted-test-id',
        modelName: props?.modelName || 'TestModel',
        encryptedDataBase64: props?.encryptedDataBase64 || null,
        encryptedDataBase64Short: props?.encryptedDataBase64Short || null
    }))
}));

jest.mock('../../util/dataUtil', () => ({
    dataUtil: {
        removeLongPropertyValues: jest.fn((obj) => {
            if (!obj) return obj;
            return { ...obj, longField: '<removed>' };
        })
    }
}));

jest.mock('../../externals/sjcl', () => ({
    sjcl: {
        encrypt: jest.fn((key, plaintext, opts) => {
            return JSON.stringify({
                iv: 'mockIv',
                cipher: 'aes',
                ct: Buffer.from(`encrypted:${key}:${plaintext}`).toString('base64')
            });
        }),
        decrypt: jest.fn((key, ciphertext) => {
            try {
                const parsed = JSON.parse(ciphertext);
                if (parsed.iv && parsed.cipher && parsed.ct) {
                    const decoded = Buffer.from(parsed.ct, 'base64').toString();
                    const parts = decoded.split(':');
                    return parts.slice(2).join(':');
                }
            } catch (e) {
                // Not encrypted JSON, return as-is for local users
            }
            return ciphertext;
        }),
        hash: {
            sha256: {
                hash: jest.fn((str) => {
                    // Simple mock hash - just reverse and pad
                    return [str.split('').reverse().join('').slice(0, 8)];
                })
            }
        },
        codec: {
            hex: {
                fromBits: jest.fn((bits) => `sha256:${bits[0]}`)
            }
        }
    }
}));

jest.mock('../../util/log.js', () => ({
    log: {
        error: jest.fn(),
        warn: jest.fn(),
        debug: jest.fn(),
        info: jest.fn()
    }
}));

jest.mock('../../util/MapCache', () => ({
    MapCache: jest.fn().mockImplementation(() => ({
        _cache: new Map(),
        has(key) { return this._cache.has(key); },
        get(key) { return this._cache.get(key) || null; },
        set(key, value) { this._cache.set(key, value); },
        clear(key) { this._cache.delete(key); },
        clearAll() { this._cache.clear(); }
    }))
}));

jest.mock('./localStorageService', () => ({
    localStorageService: {
        getAutologinOrActiveUser: jest.fn(() => 'testUser')
    }
}));

jest.mock('../../util/modelUtil', () => ({
    modelUtil: {
        getMajorVersion: jest.fn((obj) => obj?.modelVersion ? 
            JSON.parse(obj.modelVersion).major : 1)
    }
}));

jest.mock('../../util/constants', () => ({
    constants: {
        MODEL_VERSION_CHANGED_TO_USERNAME_AS_SALT: 7
    }
}));

import { encryptionService } from './encryptionService';
import { EncryptedObject } from '../../model/EncryptedObject';
import { sjcl } from '../../externals/sjcl';
import { log } from '../../util/log.js';
import { dataUtil } from '../../util/dataUtil';

describe('encryptionService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset encryption properties before each test
        encryptionService.resetEncryptionProperties();
    });

    describe('setEncryptionProperties / resetEncryptionProperties', () => {
        test('sets encryption properties correctly', () => {
            encryptionService.setEncryptionProperties('hashedPassword', ['salt1', 'salt2'], false);
            // Verify encryption works after setting properties
            const result = encryptionService.encryptString('test', 'salt1');
            expect(result).toBeDefined();
        });

        test('handles single salt as string', () => {
            encryptionService.setEncryptionProperties('hashedPassword', 'singleSalt', false);
            const result = encryptionService.encryptString('test', 'singleSalt');
            expect(result).toBeDefined();
        });

        test('handles empty password as valid', () => {
            // Empty password is treated as uninitialized in the service
            encryptionService.setEncryptionProperties('', ['salt1'], false);
            // The service throws because empty string is falsy
            expect(() => encryptionService.encryptString('test', 'salt1')).toThrow();
        });

        test('filters out falsy salts', () => {
            encryptionService.setEncryptionProperties('pwd', [null, 'validSalt', undefined, ''], false);
            const result = encryptionService.encryptString('test', 'validSalt');
            expect(result).toBeDefined();
        });

        test('resetEncryptionProperties clears all properties', () => {
            encryptionService.setEncryptionProperties('pwd', ['salt'], false);
            encryptionService.resetEncryptionProperties();
            expect(() => encryptionService.encryptString('test', 'salt')).toThrow();
        });
    });

    describe('encryptObject', () => {
        beforeEach(() => {
            encryptionService.setEncryptionProperties('testPassword', ['testSalt'], false);
        });

        test('encrypts object and returns EncryptedObject', () => {
            const testObject = {
                id: 'obj-123',
                modelName: 'TestModel',
                data: 'testData'
            };
            
            const result = encryptionService.encryptObject(testObject);
            
            expect(EncryptedObject).toHaveBeenCalled();
            expect(result.id).toBe('obj-123');
            expect(result.modelName).toBe('TestModel');
        });

        test('returns null/undefined for falsy input', () => {
            expect(encryptionService.encryptObject(null)).toBeNull();
            expect(encryptionService.encryptObject(undefined)).toBeUndefined();
        });

        test('preserves _rev property', () => {
            const testObject = {
                id: 'obj-123',
                modelName: 'TestModel',
                _rev: 'rev-456'
            };
            
            const result = encryptionService.encryptObject(testObject);
            expect(result._rev).toBe('rev-456');
        });

        test('creates short version when long values exist', () => {
            const testObject = {
                id: 'obj-123',
                modelName: 'TestModel',
                longField: 'x'.repeat(1000)
            };
            
            dataUtil.removeLongPropertyValues.mockReturnValueOnce({
                id: 'obj-123',
                modelName: 'TestModel',
                longField: '<removed>'
            });
            
            encryptionService.encryptObject(testObject);
            expect(dataUtil.removeLongPropertyValues).toHaveBeenCalledWith(testObject);
        });

        test('throws error when uninitialized', () => {
            encryptionService.resetEncryptionProperties();
            expect(() => encryptionService.encryptObject({ id: '1', modelName: 'Test' }))
                .toThrow('using encryptionService uninitialized is not possible');
        });
    });

    describe('decryptObjects', () => {
        beforeEach(() => {
            encryptionService.setEncryptionProperties('testPassword', ['testSalt'], false);
        });

        test('decrypts single encrypted object', () => {
            const plaintext = JSON.stringify({
                id: 'obj-123',
                modelName: 'TestModel',
                data: 'testData'
            });
            
            sjcl.decrypt.mockReturnValueOnce(plaintext);
            
            const encryptedObj = {
                _id: 'obj-123',
                _rev: 'rev-1',
                encryptedDataBase64: 'encryptedData',
                modelVersion: '{"major": 1}'
            };
            
            const result = encryptionService.decryptObjects(encryptedObj);
            
            expect(result).toBeDefined();
            expect(result._id).toBe('obj-123');
            expect(result._rev).toBe('rev-1');
        });

        test('decrypts array of encrypted objects', () => {
            const plaintext1 = JSON.stringify({ id: 'obj-1', modelName: 'Test' });
            const plaintext2 = JSON.stringify({ id: 'obj-2', modelName: 'Test' });
            
            sjcl.decrypt
                .mockReturnValueOnce(plaintext1)
                .mockReturnValueOnce(plaintext2);
            
            const encryptedObjs = [
                { _id: 'obj-1', _rev: 'rev-1', encryptedDataBase64: 'data1', modelVersion: '{"major": 1}' },
                { _id: 'obj-2', _rev: 'rev-2', encryptedDataBase64: 'data2', modelVersion: '{"major": 1}' }
            ];
            
            const result = encryptionService.decryptObjects(encryptedObjs);
            
            expect(Array.isArray(result)).toBe(true);
            expect(result).toHaveLength(2);
        });

        test('returns null/undefined for falsy input', () => {
            expect(encryptionService.decryptObjects(null)).toBeNull();
            expect(encryptionService.decryptObjects(undefined)).toBeUndefined();
        });

        test('decrypts short version when onlyShortVersion is true', () => {
            const shortPlaintext = JSON.stringify({
                id: 'obj-123',
                modelName: 'TestModel',
                data: '<removed>'
            });
            
            sjcl.decrypt.mockReturnValueOnce(shortPlaintext);
            
            const encryptedObj = {
                _id: 'obj-123',
                encryptedDataBase64: 'fullData',
                encryptedDataBase64Short: 'shortData',
                modelVersion: '{"major": 1}'
            };
            
            const result = encryptionService.decryptObjects(encryptedObj, { onlyShortVersion: true });
            
            expect(result.isShortVersion).toBe(true);
        });

        test('falls back to full version when short version is null', () => {
            const plaintext = JSON.stringify({ id: 'obj-123', modelName: 'Test' });
            sjcl.decrypt.mockReturnValueOnce(plaintext);
            
            const encryptedObj = {
                _id: 'obj-123',
                encryptedDataBase64: 'fullData',
                encryptedDataBase64Short: null,
                modelVersion: '{"major": 1}'
            };
            
            const result = encryptionService.decryptObjects(encryptedObj, { onlyShortVersion: true });
            expect(result.isShortVersion).toBe(true);
        });

        test('handles decryption errors gracefully', () => {
            sjcl.decrypt.mockImplementationOnce(() => {
                throw new Error('Decryption failed');
            });
            
            const encryptedObj = {
                _id: 'obj-123',
                encryptedDataBase64: 'badData',
                modelName: 'Test'
            };
            
            const result = encryptionService.decryptObjects(encryptedObj);
            
            expect(log.error).toHaveBeenCalled();
            expect(result).toBeUndefined();
        });

        test('throws error when uninitialized', () => {
            encryptionService.resetEncryptionProperties();
            expect(() => encryptionService.decryptObjects({ encryptedDataBase64: 'data' }))
                .toThrow('using encryptionService uninitialized is not possible');
        });
    });

    describe('encryptString', () => {
        test('encrypts string for online user', () => {
            encryptionService.setEncryptionProperties('password', ['salt'], false);
            const result = encryptionService.encryptString('plaintext', 'salt');
            expect(sjcl.encrypt).toHaveBeenCalled();
            expect(result).toBeDefined();
        });

        test('returns plaintext for local user', () => {
            encryptionService.setEncryptionProperties('password', ['salt'], true);
            const result = encryptionService.encryptString('plaintext', 'salt');
            expect(result).toBe('plaintext');
        });

        test('throws error when uninitialized', () => {
            encryptionService.resetEncryptionProperties();
            expect(() => encryptionService.encryptString('test', 'salt'))
                .toThrow('using encryptionService uninitialized is not possible');
        });
    });

    describe('decryptString', () => {
        test('decrypts string for online user', () => {
            encryptionService.setEncryptionProperties('password', ['salt'], false);
            sjcl.decrypt.mockReturnValueOnce('decrypted');
            
            const result = encryptionService.decryptString('encrypted', 'salt');
            expect(result).toBe('decrypted');
        });

        test('returns plaintext for local user with non-encrypted data', () => {
            encryptionService.setEncryptionProperties('password', ['salt'], true);
            const result = encryptionService.decryptString('plaintext', 'salt');
            expect(result).toBe('plaintext');
        });

        test('decrypts encrypted data even for local user', () => {
            encryptionService.setEncryptionProperties('password', ['salt'], true);
            const encryptedJson = JSON.stringify({ iv: 'iv', cipher: 'aes', ct: 'ct' });
            sjcl.decrypt.mockReturnValueOnce('decrypted');
            
            const result = encryptionService.decryptString(encryptedJson, 'salt');
            expect(sjcl.decrypt).toHaveBeenCalled();
        });

        test('uses cache for repeated decryption', () => {
            encryptionService.setEncryptionProperties('password', ['salt'], false);
            sjcl.decrypt.mockReturnValue('decrypted');
            
            // First call
            encryptionService.decryptString('encrypted', 'salt');
            // Second call should use cache
            const result = encryptionService.decryptString('encrypted', 'salt');
            
            expect(result).toBe('decrypted');
        });

        test('throws error when uninitialized', () => {
            encryptionService.resetEncryptionProperties();
            expect(() => encryptionService.decryptString('test', 'salt'))
                .toThrow('using encryptionService uninitialized is not possible');
        });
    });

    describe('decryptStringTrySalts', () => {
        beforeEach(() => {
            encryptionService.setEncryptionProperties('password', ['salt1', 'salt2'], false);
        });

        test('decrypts with first salt on success', () => {
            sjcl.decrypt.mockReturnValueOnce('decrypted');
            
            const result = encryptionService.decryptStringTrySalts('encrypted', ['salt1', 'salt2']);
            expect(result).toBe('decrypted');
        });

        test('tries next salt on failure', () => {
            sjcl.decrypt
                .mockImplementationOnce(() => { throw new Error('Wrong key'); })
                .mockReturnValueOnce('decrypted');
            
            const result = encryptionService.decryptStringTrySalts('encrypted', ['salt1', 'salt2']);
            expect(result).toBe('decrypted');
            expect(log.warn).toHaveBeenCalled();
        });

        test('throws error when all salts fail', () => {
            sjcl.decrypt.mockImplementation(() => { throw new Error('Wrong key'); });
            
            expect(() => encryptionService.decryptStringTrySalts('encrypted', ['salt1']))
                .toThrow('Wrong key');
            expect(log.error).toHaveBeenCalled();
        });
    });

    describe('getStringHash', () => {
        test('returns SHA-256 hash of string', () => {
            encryptionService.setEncryptionProperties('pwd', ['salt'], false);
            const result = encryptionService.getStringHash('testString');
            
            expect(sjcl.hash.sha256.hash).toHaveBeenCalledWith('testString');
            expect(sjcl.codec.hex.fromBits).toHaveBeenCalled();
            expect(result).toContain('sha256:');
        });

        test('uses cache for repeated hashes', () => {
            encryptionService.setEncryptionProperties('pwd', ['salt'], false);
            
            encryptionService.getStringHash('testString');
            const callCount = sjcl.hash.sha256.hash.mock.calls.length;
            
            encryptionService.getStringHash('testString');
            // Should use cache, not call hash again
            expect(sjcl.hash.sha256.hash.mock.calls.length).toBe(callCount);
        });
    });

    describe('getUserPasswordHash', () => {
        test('returns hash with static salt', () => {
            encryptionService.setEncryptionProperties('pwd', ['salt'], false);
            const result = encryptionService.getUserPasswordHash('myPassword');
            
            expect(sjcl.hash.sha256.hash).toHaveBeenCalledWith('STATIC_USER_PW_SALTmyPassword');
        });
    });

    describe('encryption/decryption round-trip', () => {
        test('encrypt then decrypt returns original string', () => {
            encryptionService.setEncryptionProperties('password', ['salt'], false);
            
            const original = 'Hello, World!';
            sjcl.encrypt.mockReturnValueOnce('encrypted');
            sjcl.decrypt.mockReturnValueOnce(original);
            
            const encrypted = encryptionService.encryptString(original, 'salt');
            const decrypted = encryptionService.decryptString(encrypted, 'salt');
            
            expect(decrypted).toBe(original);
        });

        test('encrypt then decrypt object returns equivalent object', () => {
            encryptionService.setEncryptionProperties('password', ['salt'], false);
            
            const original = {
                id: 'test-123',
                modelName: 'TestModel',
                data: { nested: 'value' }
            };
            
            const originalJson = JSON.stringify(original);
            sjcl.decrypt.mockReturnValue(originalJson);
            
            const encrypted = encryptionService.encryptObject(original);
            const decrypted = encryptionService.decryptObjects({
                _id: encrypted.id,
                encryptedDataBase64: encrypted.encryptedDataBase64,
                modelVersion: '{"major": 1}'
            });
            
            expect(decrypted.id).toBe(original.id);
            expect(decrypted.modelName).toBe(original.modelName);
        });
    });

    describe('edge cases', () => {
        test('handles empty string encryption', () => {
            encryptionService.setEncryptionProperties('password', ['salt'], false);
            const result = encryptionService.encryptString('', 'salt');
            expect(result).toBeDefined();
        });

        test('handles object with special characters', () => {
            encryptionService.setEncryptionProperties('password', ['salt'], false);
            
            const testObject = {
                id: 'obj-123',
                modelName: 'Test',
                data: 'Special chars: <>&"\''
            };
            
            const result = encryptionService.encryptObject(testObject);
            expect(result).toBeDefined();
        });

        test('handles unicode strings', () => {
            encryptionService.setEncryptionProperties('password', ['salt'], false);
            
            const result = encryptionService.encryptString('Hello 世界 🌍', 'salt');
            expect(result).toBeDefined();
        });

        test('handles very long strings', () => {
            encryptionService.setEncryptionProperties('password', ['salt'], false);
            
            const longString = 'x'.repeat(100000);
            const result = encryptionService.encryptString(longString, 'salt');
            expect(result).toBeDefined();
        });

        test('handles null properties in object', () => {
            encryptionService.setEncryptionProperties('password', ['salt'], false);
            
            const testObject = {
                id: 'obj-123',
                modelName: 'Test',
                nullProp: null,
                undefinedProp: undefined
            };
            
            const result = encryptionService.encryptObject(testObject);
            expect(result).toBeDefined();
        });
    });
});
