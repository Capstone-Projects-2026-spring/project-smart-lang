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
        generateId: jest.fn((prefix) => `${prefix}-generated-id`)
    }
}));

import { Dictionary } from './Dictionary';
import { modelUtil } from '../util/modelUtil';
import { constants } from '../util/constants';

describe('Dictionary', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('constructor applies defaults and generated id', () => {
        const dict = new Dictionary({ dictionaryKey: 'abc' });
        expect(modelUtil.setDefaults).toHaveBeenCalledWith({ dictionaryKey: 'abc' }, undefined, Dictionary);
        expect(modelUtil.generateId).toHaveBeenCalledWith('dictionary');
        expect(dict.modelName).toBe('Dictionary');
        expect(dict.modelVersion).toBe(constants.MODEL_VERSION);
        expect(dict.data).toBe(JSON.stringify({}));
        expect(dict.id).toBe('dictionary-generated-id');
    });

    test('clone creates copy with new id and copy suffix', () => {
        const dict = new Dictionary({ id: 'dict-1', dictionaryKey: 'Words' });
        const clone = dict.clone();
        expect(clone.id).toBe('dictionary-generated-id');
        expect(clone.dictionaryKey).toBe('Words (Copy)');
        expect(clone._id).toBeUndefined();
        expect(clone._rev).toBeUndefined();
    });

    test('static getters return expected values', () => {
        expect(Dictionary.getModelName()).toBe('Dictionary');
        expect(Dictionary.getIdPrefix()).toBe('dictionary');
    });
});
