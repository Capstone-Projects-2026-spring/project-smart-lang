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
        generateId: jest.fn(() => 'grid-action-predict-1-100')
    }
}));

import { GridActionPredict } from './GridActionPredict';
import { constants } from '../util/constants';

describe('GridActionPredict', () => {
    test('returns static model name and constants', () => {
        expect(GridActionPredict.getModelName()).toBe('GridActionPredict');
        expect(GridActionPredict.USE_DICTIONARY_CURRENT_LANG).toBe('USE_DICTIONARY_CURRENT_LANG');
        expect(GridActionPredict.canBeTested).toBe(false);
    });

    test('applies defaults and generated id', () => {
        const action = new GridActionPredict({});
        expect(action.id).toBe('grid-action-predict-1-100');
        expect(action.modelName).toBe('GridActionPredict');
        expect(action.modelVersion).toBe(constants.MODEL_VERSION);
        expect(action.dictionaryKey).toBeNull();
        expect(action.suggestOnChange).toBe(false);
    });

    test('accepts custom values', () => {
        const action = new GridActionPredict({ dictionaryKey: 'd1', suggestOnChange: true });
        expect(action.dictionaryKey).toBe('d1');
        expect(action.suggestOnChange).toBe(true);
    });
});
