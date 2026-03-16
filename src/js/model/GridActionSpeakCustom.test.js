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
        generateId: jest.fn(() => 'grid-action-speak-custom-1-100')
    }
}));

jest.mock('../service/i18nService', () => ({ i18nService: {} }));

import { GridActionSpeakCustom } from './GridActionSpeakCustom';
import { constants } from '../util/constants';

describe('GridActionSpeakCustom', () => {
    test('returns static model name', () => {
        expect(GridActionSpeakCustom.getModelName()).toBe('GridActionSpeakCustom');
    });

    test('applies defaults and generated id', () => {
        const action = new GridActionSpeakCustom({});
        expect(action.id).toBe('grid-action-speak-custom-1-100');
        expect(action.modelName).toBe('GridActionSpeakCustom');
        expect(action.modelVersion).toBe(constants.MODEL_VERSION);
        expect(action.speakText).toEqual({});
    });

    test('supports custom id and text map', () => {
        const action = new GridActionSpeakCustom({ id: 's-1', speakText: { en: 'Hello' }, speakLanguage: 'en' });
        expect(action.id).toBe('s-1');
        expect(action.speakText).toEqual({ en: 'Hello' });
        expect(action.speakLanguage).toBe('en');
    });
});
