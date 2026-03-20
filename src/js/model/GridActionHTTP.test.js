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
        generateId: jest.fn(() => 'grid-action-http-1-100')
    }
}));

import { GridActionHTTP } from './GridActionHTTP';
import { constants } from '../util/constants';

describe('GridActionHTTP', () => {
    test('returns static model name', () => {
        expect(GridActionHTTP.getModelName()).toBe('GridActionHTTP');
    });

    test('applies defaults including method/contentType', () => {
        const action = new GridActionHTTP({});
        expect(action.id).toBe('grid-action-http-1-100');
        expect(action.modelName).toBe('GridActionHTTP');
        expect(action.modelVersion).toBe(constants.MODEL_VERSION);
        expect(action.method).toBe('POST');
        expect(action.contentType).toBe('text/plain');
    });

    test('accepts override values', () => {
        const action = new GridActionHTTP({ id: 'http-1', method: 'GET', noCorsMode: true });
        expect(action.id).toBe('http-1');
        expect(action.method).toBe('GET');
        expect(action.noCorsMode).toBe(true);
    });
});
