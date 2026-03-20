jest.mock('../service/data/localStorageService', () => ({
    localStorageService: {
        getUserMajorModelVersion: jest.fn()
    }
}));

import { modelUtil } from './modelUtil';
import { localStorageService } from '../service/data/localStorageService';
import { constants } from './constants';

describe('modelUtil', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('generateId includes prefix', () => {
        expect(modelUtil.generateId('x')).toMatch(/^x-\d+-\d+$/);
    });

    test('getAsObject parses strings and passes through objects', () => {
        expect(modelUtil.getAsObject('{"a":1}')).toEqual({ a: 1 });
        const obj = { b: 2 };
        expect(modelUtil.getAsObject(obj)).toBe(obj);
    });

    test('getNewName increments when conflicts exist', () => {
        expect(modelUtil.getNewName('grid', ['grid', 'grid (1)'])).toBe('grid (2)');
    });

    test('setDefaults copies only missing defined fields', () => {
        const modelClass = { definition: { a: Number, b: Number } };
        const result = modelUtil.setDefaults({ a: 1 }, { a: 2, b: 3, c: 4 }, modelClass);
        expect(result).toEqual({ a: 1, b: 3 });
    });

    test('hashCode ignores id fields', () => {
        const a = { value: 1 };
        const b = { value: 1, id: 'x', _id: 'y', _rev: 'z' };
        expect(modelUtil.hashCode(a)).toBe(modelUtil.hashCode(b));
    });

    test('model version helpers parse and expose versions', () => {
        expect(modelUtil.getModelVersionString()).toBe(constants.MODEL_VERSION);
        expect(modelUtil.getModelVersionObject(constants.MODEL_VERSION).major).toBeTruthy();
        expect(modelUtil.getModelVersionObject(null)).toEqual({ major: null, minor: null, patch: null });
    });

    test('major version and validation checks', () => {
        const user = { id: 'u1' };
        localStorageService.getUserMajorModelVersion.mockReturnValue(modelUtil.getLatestModelVersion().major);
        expect(modelUtil.hasValidMajorModelVersion(user)).toBe(true);

        localStorageService.getUserMajorModelVersion.mockReturnValue(modelUtil.getLatestModelVersion().major + 10);
        expect(modelUtil.hasValidMajorModelVersion(user)).toBe(false);
    });

    test('convertObjects applies conversion functions and preserves input shape', () => {
        const getFns = jest.fn(() => [
            (obj) => ({ ...obj, a: 1 }),
            (obj) => (obj.remove ? null : obj)
        ]);

        const single = { modelVersion: constants.MODEL_VERSION };
        expect(modelUtil.convertObjects(single, getFns, {})).toEqual({ modelVersion: constants.MODEL_VERSION, a: 1 });

        const arr = [
            { modelVersion: constants.MODEL_VERSION },
            { modelVersion: constants.MODEL_VERSION, remove: true }
        ];
        expect(modelUtil.convertObjects(arr, getFns, {})).toEqual([{ modelVersion: constants.MODEL_VERSION, a: 1 }]);

        expect(modelUtil.convertObjects(null, getFns, {})).toBeNull();
    });
});
