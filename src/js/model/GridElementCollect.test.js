jest.mock('../externals/objectmodel', () => {
    class MockModel {
        static definition = {};

        static defaults(defaults) {
            this._defaults = defaults;
        }

        static extend(extension) {
            const BaseClass = this;
            return class extends BaseClass {
                static definition = { ...BaseClass.definition, ...extension };
                
                static extend(ext) {
                    return class extends this {
                        static definition = { ...this.definition, ...ext };
                    };
                }
            };
        }

        constructor(properties = {}) {
            Object.assign(this, this.constructor._defaults || {}, properties);
        }
    }
    
    const ModelFactory = (definition) => {
        return class extends MockModel {
            static definition = definition;
        };
    };
    
    ModelFactory.Array = (itemType) => Array;
    
    return { Model: ModelFactory };
});

jest.mock('../util/modelUtil', () => ({
    modelUtil: {
        setDefaults: jest.fn((properties = {}, base = {}, modelClass = {}) => {
            return { ...properties };
        }),
        generateId: jest.fn(() => 'grid-element-collect-1-100')
    }
}));

jest.mock('../util/constants', () => ({
    constants: {
        MODEL_VERSION: '{"major": 6, "minor": 0, "patch": 0}'
    }
}));

jest.mock('./GridImage', () => ({
    GridImage: class {
        constructor(props = {}) {
            Object.assign(this, props);
        }
    }
}));

jest.mock('./GridActionSpeak', () => ({
    GridActionSpeak: class {
        static getModelName() { return 'GridActionSpeak'; }
        constructor() { this.modelName = 'GridActionSpeak'; }
    }
}));

jest.mock('./GridActionSpeakCustom', () => ({
    GridActionSpeakCustom: class {
        static getModelName() { return 'GridActionSpeakCustom'; }
    }
}));

jest.mock('./GridActionNavigate', () => ({
    GridActionNavigate: class {
        static getModelName() { return 'GridActionNavigate'; }
    }
}));

jest.mock('./GridActionPredict', () => ({
    GridActionPredict: class {
        static getModelName() { return 'GridActionPredict'; }
        static USE_DICTIONARY_CURRENT_LANG = 'USE_DICTIONARY_CURRENT_LANG';
        constructor(props = {}) {
            Object.assign(this, props);
            this.modelName = 'GridActionPredict';
        }
    }
}));

jest.mock('./GridActionCollectElement', () => ({
    GridActionCollectElement: class {
        static getModelName() { return 'GridActionCollectElement'; }
        static COLLECT_ACTION_SPEAK_CONTINUOUS = 'COLLECT_ACTION_SPEAK_CONTINUOUS';
        constructor(props = {}) {
            Object.assign(this, props);
            this.modelName = 'GridActionCollectElement';
        }
    }
}));

jest.mock('./GridActionChangeLang', () => ({
    GridActionChangeLang: class {
        static getModelName() { return 'GridActionChangeLang'; }
    }
}));

jest.mock('./GridActionOpenWebpage', () => ({
    GridActionOpenWebpage: class {
        static getModelName() { return 'GridActionOpenWebpage'; }
    }
}));

jest.mock('./GridActionAudio', () => ({
    GridActionAudio: class {
        static getModelName() { return 'GridActionAudio'; }
    }
}));

jest.mock('./GridActionHTTP', () => ({
    GridActionHTTP: class {
        static getModelName() { return 'GridActionHTTP'; }
    }
}));

jest.mock('./GridActionWordForm', () => ({
    GridActionWordForm: class {
        static getModelName() { return 'GridActionWordForm'; }
    }
}));

jest.mock('./GridActionSystem', () => ({
    GridActionSystem: class {
        static getModelName() { return 'GridActionSystem'; }
    }
}));

jest.mock('./GridActionPredefined', () => ({
    GridActionPredefined: class {
        static getModelName() { return 'GridActionPredefined'; }
    }
}));

jest.mock('./GridActionVocabLevelToggle', () => ({
    GridActionVocabLevelToggle: class {
        static getModelName() { return 'GridActionVocabLevelToggle'; }
    }
}));

import { GridElementCollect } from './GridElementCollect';
import { GridElement } from './GridElement';

describe('GridElementCollect', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('constructor sets default properties', () => {
        const element = new GridElementCollect({});
        expect(element.showLabels).toBe(true);
        expect(element.singleLine).toBe(true);
        expect(element.imageHeightPercentage).toBe(85);
        expect(element.mode).toBe(GridElementCollect.MODE_AUTO);
        expect(element.textElemSizeFactor).toBe(1.5);
    });

    test('constructor sets type to ELEMENT_TYPE_COLLECT', () => {
        const element = new GridElementCollect({});
        expect(element.type).toBe(GridElement.ELEMENT_TYPE_COLLECT);
    });

    test('constructor sets convertToLowercase to false by default', () => {
        const element = new GridElementCollect({});
        expect(element.convertToLowercase).toBe(false);
    });

    test('constructor allows overriding convertToLowercase', () => {
        const element = new GridElementCollect({ convertToLowercase: true });
        expect(element.convertToLowercase).toBe(true);
    });

    test('constructor sets displayUpsideDown to false by default', () => {
        const element = new GridElementCollect({});
        expect(element.displayUpsideDown).toBe(false);
    });

    test('constructor allows overriding displayUpsideDown', () => {
        const element = new GridElementCollect({ displayUpsideDown: true });
        expect(element.displayUpsideDown).toBe(true);
    });

    test('constructor creates default actions with CollectElement and Predict', () => {
        const element = new GridElementCollect({});
        expect(element.actions).toBeDefined();
        expect(Array.isArray(element.actions)).toBe(true);
        expect(element.actions.length).toBe(2);
    });

    test('constructor allows custom actions', () => {
        const customActions = [{ modelName: 'CustomAction' }];
        const element = new GridElementCollect({ actions: customActions });
        expect(element.actions).toBe(customActions);
    });

    test('static MODE constants are defined', () => {
        expect(GridElementCollect.MODE_AUTO).toBe('MODE_AUTO');
        expect(GridElementCollect.MODE_COLLECT_SEPARATED).toBe('MODE_COLLECT_SEPARATED');
        expect(GridElementCollect.MODE_COLLECT_TEXT).toBe('MODE_COLLECT_TEXT');
    });

    test('MODES array contains all modes', () => {
        expect(GridElementCollect.MODES).toContain(GridElementCollect.MODE_AUTO);
        expect(GridElementCollect.MODES).toContain(GridElementCollect.MODE_COLLECT_SEPARATED);
        expect(GridElementCollect.MODES).toContain(GridElementCollect.MODE_COLLECT_TEXT);
    });

    test('constructor handles null props', () => {
        const element = new GridElementCollect(null);
        expect(element.showLabels).toBe(true);
        expect(element.type).toBe(GridElement.ELEMENT_TYPE_COLLECT);
    });

    test('constructor handles undefined props', () => {
        const element = new GridElementCollect();
        expect(element.showLabels).toBe(true);
        expect(element.type).toBe(GridElement.ELEMENT_TYPE_COLLECT);
    });
});
