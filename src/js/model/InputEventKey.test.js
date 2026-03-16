jest.mock('../externals/objectmodel', () => {
    const Model = function (definition) {
        return class BaseModel {
            static definition = definition;

            static defaults(defaults) {
                this._defaults = defaults;
            }

            constructor(properties = {}) {
                Object.assign(this, this.constructor._defaults || {}, properties);
            }
        };
    };
    Model.Array = () => Array;
    return { Model };
});

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
        generateId: jest.fn(() => 'input-event-key-1-100')
    }
}));

import { InputEventKey } from './InputEventKey';
import { constants } from '../util/constants';

describe('InputEventKey', () => {
    test('model name and key constants are defined', () => {
        expect(InputEventKey.getModelName()).toBe('InputEventKey');
        expect(InputEventKey.KEY_MOUSE_PREFIX).toBe('KEY_MOUSE');
        expect(InputEventKey.KEY_MOUSE_LEFT).toBe('KEY_MOUSE0');
        expect(InputEventKey.KEY_MOUSE_MIDDLE).toBe('KEY_MOUSE1');
        expect(InputEventKey.KEY_MOUSE_RIGHT).toBe('KEY_MOUSE2');
        expect(InputEventKey.KEY_TAP).toBe('KEY_TAP');
        expect(InputEventKey.SPECIAL_KEYS).toHaveLength(4);
    });

    test('applies defaults and generated id', () => {
        const key = new InputEventKey({});
        expect(key.id).toBe('input-event-key-1-100');
        expect(key.modelName).toBe('InputEventKey');
        expect(key.modelVersion).toBe(constants.MODEL_VERSION);
        expect(key.repeat).toBe(1);
        expect(key.timeout).toBe(0);
        expect(key.holdDuration).toBe(0);
    });

    test('isValid returns true only when modelName, label and keyCode are present', () => {
        const valid = new InputEventKey({ modelName: 'InputEventKey', label: 'A', keyCode: 65 });
        expect(valid.isValid()).toBeTruthy();

        const invalid = new InputEventKey({ modelName: 'InputEventKey', label: 'A' });
        expect(invalid.isValid()).toBeFalsy();
    });
});
