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
        generateId: jest.fn(() => 'grid-action-audio-1-100')
    }
}));

import { GridActionAudio } from './GridActionAudio';
import { constants } from '../util/constants';

describe('GridActionAudio', () => {
    test('returns static model name', () => {
        expect(GridActionAudio.getModelName()).toBe('GridActionAudio');
    });

    test('applies defaults and generates id', () => {
        const action = new GridActionAudio({});
        expect(action.id).toBe('grid-action-audio-1-100');
        expect(action.modelName).toBe('GridActionAudio');
        expect(action.modelVersion).toBe(constants.MODEL_VERSION);
    });

    test('accepts custom fields', () => {
        const action = new GridActionAudio({ id: 'x', mimeType: 'audio/webm', durationMs: 123 });
        expect(action.id).toBe('x');
        expect(action.mimeType).toBe('audio/webm');
        expect(action.durationMs).toBe(123);
    });
});
