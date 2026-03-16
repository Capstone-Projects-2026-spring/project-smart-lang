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
        generateId: jest.fn(() => 'GridActionOpenWebpage-1-100')
    }
}));

import { GridActionOpenWebpage } from './GridActionOpenWebpage';
import { constants } from '../util/constants';

describe('GridActionOpenWebpage', () => {
    test('returns static model name', () => {
        expect(GridActionOpenWebpage.getModelName()).toBe('GridActionOpenWebpage');
    });

    test('applies defaults and generated id', () => {
        const action = new GridActionOpenWebpage({});
        expect(action.id).toBe('GridActionOpenWebpage-1-100');
        expect(action.modelName).toBe('GridActionOpenWebpage');
        expect(action.modelVersion).toBe(constants.MODEL_VERSION);
        expect(action.timeoutSeconds).toBe(0);
    });

    test('supports custom timeout and id', () => {
        const action = new GridActionOpenWebpage({ id: 'web-1', timeoutSeconds: 12 });
        expect(action.id).toBe('web-1');
        expect(action.timeoutSeconds).toBe(12);
    });
});
