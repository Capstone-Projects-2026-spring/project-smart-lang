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
        generateId: jest.fn(() => 'additionalgridfile-1-100')
    }
}));

jest.mock('../util/constants', () => ({
    constants: {
        MODEL_VERSION: '{"major": 6, "minor": 0, "patch": 0}'
    }
}));

import { AdditionalGridFile } from './AdditionalGridFile';
import { constants } from '../util/constants';

describe('AdditionalGridFile', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('getModelName returns correct name', () => {
        expect(AdditionalGridFile.getModelName()).toBe('AdditionalGridFile');
    });

    test('constructor applies defaults and auto-generates id', () => {
        const file = new AdditionalGridFile({});
        expect(file.modelName).toBe('AdditionalGridFile');
        expect(file.modelVersion).toBe(constants.MODEL_VERSION);
        expect(file.id).toBe('additionalgridfile-1-100');
    });

    test('constructor keeps provided id', () => {
        const file = new AdditionalGridFile({ id: 'my-file-id' });
        expect(file.id).toBe('my-file-id');
    });

    test('constructor accepts fileName property', () => {
        const file = new AdditionalGridFile({ fileName: 'test.mp3' });
        expect(file.fileName).toBe('test.mp3');
    });

    test('constructor accepts dataBase64 property', () => {
        const file = new AdditionalGridFile({ dataBase64: 'SGVsbG8gV29ybGQ=' });
        expect(file.dataBase64).toBe('SGVsbG8gV29ybGQ=');
    });

    test('copies values from elementToCopy through setDefaults', () => {
        const copy = {
            id: 'copied-id',
            fileName: 'copied.mp3',
            dataBase64: 'Y29waWVk',
            modelVersion: constants.MODEL_VERSION
        };
        const file = new AdditionalGridFile({ modelName: AdditionalGridFile.getModelName() }, copy);
        expect(file.fileName).toBe('copied.mp3');
        expect(file.dataBase64).toBe('Y29waWVk');
    });

    test('defaults are defined correctly', () => {
        const file = new AdditionalGridFile();
        expect(file.modelName).toBe('AdditionalGridFile');
        expect(file.modelVersion).toBe(constants.MODEL_VERSION);
    });
});
