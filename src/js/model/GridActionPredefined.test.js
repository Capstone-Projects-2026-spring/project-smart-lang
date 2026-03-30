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
        generateId: jest.fn(() => 'GridActionPredefined-1-100')
    }
}));

jest.mock('../util/constants', () => ({
    constants: {
        MODEL_VERSION: '{"major": 6, "minor": 0, "patch": 0}'
    }
}));

import { GridActionPredefined } from './GridActionPredefined';
import { constants } from '../util/constants';

describe('GridActionPredefined', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('getModelName returns correct name', () => {
        expect(GridActionPredefined.getModelName()).toBe('GridActionPredefined');
    });

    test('constructor applies defaults and auto-generates id', () => {
        const action = new GridActionPredefined({});
        expect(action.modelName).toBe('GridActionPredefined');
        expect(action.modelVersion).toBe(constants.MODEL_VERSION);
        expect(action.id).toBe('GridActionPredefined-1-100');
    });

    test('constructor keeps provided id', () => {
        const action = new GridActionPredefined({ id: 'my-action-id' });
        expect(action.id).toBe('my-action-id');
    });

    test('constructor accepts groupId property', () => {
        const action = new GridActionPredefined({ groupId: 'Shelly Plus Plug S' });
        expect(action.groupId).toBe('Shelly Plus Plug S');
    });

    test('constructor accepts actionInfo property', () => {
        const actionInfo = { type: 'toggle', defaultValue: true };
        const action = new GridActionPredefined({ actionInfo });
        expect(action.actionInfo).toEqual(actionInfo);
    });

    test('constructor accepts customValues property', () => {
        const customValues = { ip: '192.168.1.100', channel: 1 };
        const action = new GridActionPredefined({ customValues });
        expect(action.customValues).toEqual(customValues);
    });

    test('constructor accepts isLiveAction property', () => {
        const action = new GridActionPredefined({ isLiveAction: true });
        expect(action.isLiveAction).toBe(true);
    });

    test('canBeTested is true', () => {
        expect(GridActionPredefined.canBeTested).toBe(true);
    });

    test('defaults include empty customValues', () => {
        const action = new GridActionPredefined();
        expect(action.customValues).toEqual({});
    });

    test('copies values from elementToCopy through setDefaults', () => {
        const copy = {
            id: 'copied-id',
            groupId: 'copied-group',
            customValues: { key: 'value' },
            modelVersion: constants.MODEL_VERSION
        };
        const action = new GridActionPredefined({ modelName: GridActionPredefined.getModelName() }, copy);
        expect(action.groupId).toBe('copied-group');
        expect(action.customValues).toEqual({ key: 'value' });
    });
});
