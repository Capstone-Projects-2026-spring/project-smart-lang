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
        generateId: jest.fn(() => 'grid-action-collect-elm-1-100')
    }
}));

jest.mock('../util/constants', () => ({
    constants: {
        MODEL_VERSION: '{"major": 6, "minor": 0, "patch": 0}'
    }
}));

import { GridActionCollectElement } from './GridActionCollectElement';
import { constants } from '../util/constants';

describe('GridActionCollectElement', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('getModelName returns correct name', () => {
        expect(GridActionCollectElement.getModelName()).toBe('GridActionCollectElement');
    });

    test('constructor applies defaults and auto-generates id', () => {
        const action = new GridActionCollectElement({});
        expect(action.modelName).toBe('GridActionCollectElement');
        expect(action.modelVersion).toBe(constants.MODEL_VERSION);
        expect(action.id).toBe('grid-action-collect-elm-1-100');
    });

    test('constructor keeps provided id', () => {
        const action = new GridActionCollectElement({ id: 'my-action-id' });
        expect(action.id).toBe('my-action-id');
    });

    test('constructor accepts action property', () => {
        const action = new GridActionCollectElement({ 
            action: GridActionCollectElement.COLLECT_ACTION_SPEAK 
        });
        expect(action.action).toBe(GridActionCollectElement.COLLECT_ACTION_SPEAK);
    });

    test('canBeTested is false', () => {
        expect(GridActionCollectElement.canBeTested).toBe(false);
    });

    test('isSpeakAction returns true for speak actions', () => {
        expect(GridActionCollectElement.isSpeakAction(GridActionCollectElement.COLLECT_ACTION_SPEAK)).toBe(true);
        expect(GridActionCollectElement.isSpeakAction(GridActionCollectElement.COLLECT_ACTION_SPEAK_CONTINUOUS)).toBe(true);
        expect(GridActionCollectElement.isSpeakAction(GridActionCollectElement.COLLECT_ACTION_SPEAK_CLEAR)).toBe(true);
        expect(GridActionCollectElement.isSpeakAction(GridActionCollectElement.COLLECT_ACTION_SPEAK_CONTINUOUS_CLEAR)).toBe(true);
    });

    test('isSpeakAction returns false for non-speak actions', () => {
        expect(GridActionCollectElement.isSpeakAction(GridActionCollectElement.COLLECT_ACTION_CLEAR)).toBe(false);
        expect(GridActionCollectElement.isSpeakAction(GridActionCollectElement.COLLECT_ACTION_SHARE)).toBe(false);
    });

    test('getActions returns all action types', () => {
        const actions = GridActionCollectElement.getActions();
        expect(Array.isArray(actions)).toBe(true);
        expect(actions).toContain(GridActionCollectElement.COLLECT_ACTION_SPEAK);
        expect(actions).toContain(GridActionCollectElement.COLLECT_ACTION_CLEAR);
        expect(actions).toContain(GridActionCollectElement.COLLECT_ACTION_SHARE);
        expect(actions).toContain(GridActionCollectElement.COLLECT_ACTION_TO_YOUTUBE);
    });

    test('static action constants are defined', () => {
        expect(GridActionCollectElement.COLLECT_ACTION_SPEAK).toBe('COLLECT_ACTION_SPEAK');
        expect(GridActionCollectElement.COLLECT_ACTION_SPEAK_CONTINUOUS).toBe('COLLECT_ACTION_SPEAK_CONTINUOUS');
        expect(GridActionCollectElement.COLLECT_ACTION_SPEAK_CLEAR).toBe('COLLECT_ACTION_SPEAK_CLEAR');
        expect(GridActionCollectElement.COLLECT_ACTION_SPEAK_CONTINUOUS_CLEAR).toBe('COLLECT_ACTION_SPEAK_CONTINUOUS_CLEAR');
        expect(GridActionCollectElement.COLLECT_ACTION_CLEAR).toBe('COLLECT_ACTION_CLEAR');
        expect(GridActionCollectElement.COLLECT_ACTION_REMOVE_WORD).toBe('COLLECT_ACTION_REMOVE_WORD');
        expect(GridActionCollectElement.COLLECT_ACTION_REMOVE_CHAR).toBe('COLLECT_ACTION_REMOVE_CHAR');
        expect(GridActionCollectElement.COLLECT_ACTION_SHARE).toBe('COLLECT_ACTION_SHARE');
        expect(GridActionCollectElement.COLLECT_ACTION_COPY_IMAGE_CLIPBOARD).toBe('COLLECT_ACTION_COPY_IMAGE_CLIPBOARD');
        expect(GridActionCollectElement.COLLECT_ACTION_COPY_CLIPBOARD).toBe('COLLECT_ACTION_COPY_CLIPBOARD');
        expect(GridActionCollectElement.COLLECT_ACTION_APPEND_CLIPBOARD).toBe('COLLECT_ACTION_APPEND_CLIPBOARD');
        expect(GridActionCollectElement.COLLECT_ACTION_CLEAR_CLIPBOARD).toBe('COLLECT_ACTION_CLEAR_CLIPBOARD');
        expect(GridActionCollectElement.COLLECT_ACTION_TO_YOUTUBE).toBe('COLLECT_ACTION_TO_YOUTUBE');
        expect(GridActionCollectElement.COLLECT_ACTION_TOGGLE_TEXT_ROTATION).toBe('COLLECT_ACTION_TOGGLE_TEXT_ROTATION');
    });

    test('copies values from elementToCopy through setDefaults', () => {
        const copy = {
            id: 'copied-id',
            action: GridActionCollectElement.COLLECT_ACTION_CLEAR,
            modelVersion: constants.MODEL_VERSION
        };
        const action = new GridActionCollectElement({ modelName: GridActionCollectElement.getModelName() }, copy);
        expect(action.action).toBe(GridActionCollectElement.COLLECT_ACTION_CLEAR);
    });
});
