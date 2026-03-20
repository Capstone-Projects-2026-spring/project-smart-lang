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
        setDefaults: jest.fn((properties = {}, base = {}, modelClass = {}) => {
            const copy = { ...properties };
            const needed = Object.keys(modelClass.definition || {});
            Object.keys(base || {}).forEach((key) => {
                if (needed.includes(key) && copy[key] === undefined) {
                    copy[key] = base[key];
                }
            });
            return copy;
        }),
        generateId: jest.fn(() => 'grid-action-speak-1-100')
    }
}));

jest.mock('../util/constants', () => ({
    constants: {
        MODEL_VERSION: '{"major": 6, "minor": 0, "patch": 0}'
    }
}));

jest.mock('../service/i18nService', () => ({ i18nService: {} }));

import { GridActionSpeak } from './GridActionSpeak';
import { constants } from '../util/constants';

describe('GridActionSpeak', () => {
    test('exposes model name', () => {
        expect(GridActionSpeak.getModelName()).toBe('GridActionSpeak');
    });

    test('uses defaults and auto-generates id when empty', () => {
        const action = new GridActionSpeak({});

        expect(action.modelName).toBe('GridActionSpeak');
        expect(action.modelVersion).toBe(constants.MODEL_VERSION);
        expect(action.id).toBe('grid-action-speak-1-100');
    });

    test('keeps provided id and custom language', () => {
        const action = new GridActionSpeak({ id: 'my-id', speakLanguage: 'en' });
        expect(action.id).toBe('my-id');
        expect(action.speakLanguage).toBe('en');
    });

    test('copies missing values from elementToCopy through setDefaults', () => {
        const copy = {
            id: 'copied-id',
            speakLanguage: 'de',
            modelVersion: constants.MODEL_VERSION
        };

        const action = new GridActionSpeak({ modelName: GridActionSpeak.getModelName() }, copy);
        expect(action.id).toBe('copied-id');
        expect(action.speakLanguage).toBe('de');
    });
});
