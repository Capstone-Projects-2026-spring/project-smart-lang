jest.mock('../externals/objectmodel', () => ({
    Model: (definition) => {
        return class {
            static definition = definition;

            static defaults(defaults) {
                this._defaults = defaults;
            }

            constructor(properties = {}) {
                Object.assign(this, this.constructor._defaults || {}, properties);
            }
        };
    }
}));

jest.mock('../util/modelUtil', () => ({
    modelUtil: {
        setDefaults: jest.fn((props = {}, base = {}, modelClass = {}) => {
            const copy = { ...props };
            const needed = Object.keys(modelClass.definition || {});
            Object.keys(base || {}).forEach((key) => {
                if (needed.includes(key) && copy[key] === undefined) {
                    copy[key] = base[key];
                }
            });
            return copy;
        }),
        generateId: jest.fn(() => 'encryptedobject-generated-id')
    }
}));

import { EncryptedObject } from './EncryptedObject';
import { modelUtil } from '../util/modelUtil';
import { constants } from '../util/constants';

describe('EncryptedObject', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('sets defaults and generates id when missing', () => {
        const obj = new EncryptedObject({});
        expect(modelUtil.setDefaults).toHaveBeenCalledWith({}, undefined, EncryptedObject);
        expect(modelUtil.generateId).toHaveBeenCalledWith('encryptedobject');
        expect(obj.id).toBe('encryptedobject-generated-id');
        expect(obj.modelVersion).toBe(constants.MODEL_VERSION);
    });

    test('keeps provided id and supports elementToCopy', () => {
        const copy = { encryptedDataBase64: 'x' };
        const obj = new EncryptedObject({ id: 'keep-id' }, copy);
        expect(modelUtil.setDefaults).toHaveBeenCalledWith({ id: 'keep-id' }, copy, EncryptedObject);
        expect(obj.id).toBe('keep-id');
    });

    test('returns static model name', () => {
        expect(EncryptedObject.getModelName()).toBe('EncryptedObject');
    });
});
