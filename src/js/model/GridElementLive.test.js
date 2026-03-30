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
        generateId: jest.fn(() => 'grid-element-live-1-100')
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
    }
}));

jest.mock('./GridActionCollectElement', () => ({
    GridActionCollectElement: class {
        static getModelName() { return 'GridActionCollectElement'; }
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

import { GridElementLive } from './GridElementLive';

describe('GridElementLive', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('constructor applies defaults', () => {
        const element = new GridElementLive({});
        expect(element.extractMode).toBe(GridElementLive.EXTRACT_JSON);
    });

    test('constructor handles null props', () => {
        const element = new GridElementLive(null);
        expect(element.extractMode).toBe(GridElementLive.EXTRACT_JSON);
    });

    test('constructor handles undefined props', () => {
        const element = new GridElementLive();
        expect(element.extractMode).toBe(GridElementLive.EXTRACT_JSON);
    });

    test('constructor allows overriding extractMode', () => {
        const element = new GridElementLive({ extractMode: GridElementLive.EXTRACT_HTML_SELECTOR });
        expect(element.extractMode).toBe(GridElementLive.EXTRACT_HTML_SELECTOR);
    });

    test('constructor accepts mode property', () => {
        const element = new GridElementLive({ mode: GridElementLive.MODE_DATETIME });
        expect(element.mode).toBe(GridElementLive.MODE_DATETIME);
    });

    test('constructor accepts updateSeconds property', () => {
        const element = new GridElementLive({ updateSeconds: 30 });
        expect(element.updateSeconds).toBe(30);
    });

    test('constructor accepts dateTimeFormat property', () => {
        const element = new GridElementLive({ dateTimeFormat: GridElementLive.DT_FORMAT_TIME });
        expect(element.dateTimeFormat).toBe(GridElementLive.DT_FORMAT_TIME);
    });

    test('static MODE constants are defined', () => {
        expect(GridElementLive.MODE_ACTION_RESULT).toBe('MODE_ACTION_RESULT');
        expect(GridElementLive.MODE_DATETIME).toBe('MODE_DATETIME');
        expect(GridElementLive.MODE_APP_STATE).toBe('MODE_APP_STATE');
        expect(GridElementLive.MODE_RANDOM).toBe('MODE_RANDOM');
    });

    test('MODES array contains all modes', () => {
        expect(GridElementLive.MODES).toContain(GridElementLive.MODE_ACTION_RESULT);
        expect(GridElementLive.MODES).toContain(GridElementLive.MODE_DATETIME);
        expect(GridElementLive.MODES).toContain(GridElementLive.MODE_APP_STATE);
        expect(GridElementLive.MODES).toContain(GridElementLive.MODE_RANDOM);
    });

    test('static DT_FORMAT constants are defined', () => {
        expect(GridElementLive.DT_FORMAT_DATE).toBe('DT_FORMAT_DATE');
        expect(GridElementLive.DT_FORMAT_DATE_LONG).toBe('DT_FORMAT_DATE_LONG');
        expect(GridElementLive.DT_FORMAT_TIME).toBe('DT_FORMAT_TIME');
        expect(GridElementLive.DT_FORMAT_TIME_LONG).toBe('DT_FORMAT_TIME_LONG');
        expect(GridElementLive.DT_FORMAT_DATETIME).toBe('DT_FORMAT_DATETIME');
        expect(GridElementLive.DT_FORMAT_DATETIME_LONG).toBe('DT_FORMAT_DATETIME_LONG');
        expect(GridElementLive.DT_FORMAT_WEEKDAY).toBe('DT_FORMAT_WEEKDAY');
        expect(GridElementLive.DT_FORMAT_MONTH).toBe('DT_FORMAT_MONTH');
        expect(GridElementLive.DT_FORMAT_CUSTOM).toBe('DT_FORMAT_CUSTOM');
    });

    test('DT_FORMATS array contains all formats', () => {
        expect(GridElementLive.DT_FORMATS.length).toBe(9);
        expect(GridElementLive.DT_FORMATS).toContain(GridElementLive.DT_FORMAT_DATE);
        expect(GridElementLive.DT_FORMATS).toContain(GridElementLive.DT_FORMAT_CUSTOM);
    });

    test('static APP_STATE constants are defined', () => {
        expect(GridElementLive.APP_STATE_VOLUME_GLOBAL).toBe('APP_STATE_VOLUME_GLOBAL');
        expect(GridElementLive.APP_STATE_BATTERY_LEVEL).toBe('APP_STATE_BATTERY_LEVEL');
    });

    test('APP_STATES array contains all states', () => {
        expect(GridElementLive.APP_STATES).toContain(GridElementLive.APP_STATE_VOLUME_GLOBAL);
        expect(GridElementLive.APP_STATES).toContain(GridElementLive.APP_STATE_BATTERY_LEVEL);
    });

    test('static EXTRACT constants are defined', () => {
        expect(GridElementLive.EXTRACT_JSON).toBe('EXTRACT_JSON');
        expect(GridElementLive.EXTRACT_HTML_SELECTOR).toBe('EXTRACT_HTML_SELECTOR');
    });

    test('EXTRACT_MODES array contains all modes', () => {
        expect(GridElementLive.EXTRACT_MODES).toContain(GridElementLive.EXTRACT_JSON);
        expect(GridElementLive.EXTRACT_MODES).toContain(GridElementLive.EXTRACT_HTML_SELECTOR);
    });

    test('DEFAULTS has expected values', () => {
        expect(GridElementLive.DEFAULTS.extractMode).toBe(GridElementLive.EXTRACT_JSON);
    });
});
