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
        generateId: jest.fn(() => 'meta-data-1-100')
    }
}));

jest.mock('../util/constants', () => ({
    constants: {
        MODEL_VERSION: '{"major": 6, "minor": 0, "patch": 0}',
        DEFAULT_COLOR_SCHEMES: [
            { name: 'default', categories: ['noun', 'verb'], colors: ['#ff0000', '#00ff00'], mappings: { 'custom': 'noun' } }
        ],
        DEFAULT_ELEMENT_BACKGROUND_COLOR: '#ffffff',
        DEFAULT_ELEMENT_BORDER_COLOR: '#000000',
        DEFAULT_GRID_BACKGROUND_COLOR: '#eeeeee'
    }
}));

jest.mock('./InputConfig', () => ({
    InputConfig: class {
        constructor(props = {}) {
            Object.assign(this, props);
        }
    }
}));

jest.mock('./ColorConfig', () => ({
    ColorConfig: class {
        constructor(props = {}) {
            this.colorSchemesActivated = props.colorSchemesActivated;
            this.activeColorScheme = props.activeColorScheme;
            this.elementBackgroundColor = props.elementBackgroundColor;
            Object.assign(this, props);
        }
    }
}));

jest.mock('./TextConfig', () => ({
    TextConfig: class {
        constructor(props = {}) {
            Object.assign(this, props);
        }
    }
}));

jest.mock('./NotificationConfig', () => ({
    NotificationConfig: class {
        constructor(props = {}) {
            Object.assign(this, props);
        }
    }
}));

jest.mock('./IntegrationConfigSync', () => ({
    IntegrationConfigSync: class {
        constructor(props = {}) {
            this.podcasts = props.podcasts || [];
            Object.assign(this, props);
        }
    }
}));

import { MetaData } from './MetaData';
import { constants } from '../util/constants';
import { modelUtil } from '../util/modelUtil';

describe('MetaData', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('getModelName returns correct name', () => {
        expect(MetaData.getModelName()).toBe('MetaData');
    });

    test('getIdPrefix returns correct prefix', () => {
        expect(MetaData.getIdPrefix()).toBe('meta-data');
    });

    test('constructor applies defaults and auto-generates id', () => {
        const meta = new MetaData({});
        expect(meta.modelName).toBe('MetaData');
        expect(meta.modelVersion).toBe(constants.MODEL_VERSION);
        expect(meta.id).toBe('meta-data-1-100');
    });

    test('constructor keeps provided id', () => {
        const meta = new MetaData({ id: 'my-meta-id' });
        expect(meta.id).toBe('my-meta-id');
    });

    test('constructor creates colorConfig when not provided', () => {
        const meta = new MetaData({});
        expect(meta.colorConfig).toBeDefined();
    });

    test('constructor creates textConfig when not provided', () => {
        const meta = new MetaData({});
        expect(meta.textConfig).toBeDefined();
    });

    test('constructor creates notificationConfig when not provided', () => {
        const meta = new MetaData({});
        expect(meta.notificationConfig).toBeDefined();
    });

    test('constructor sets homeGridId to null when not provided', () => {
        const meta = new MetaData({});
        expect(meta.homeGridId).toBe(null);
    });

    test('constructor keeps provided homeGridId', () => {
        const meta = new MetaData({ homeGridId: 'home-grid-123' });
        expect(meta.homeGridId).toBe('home-grid-123');
    });

    test('constructor sets firstRowHeightFactor to 1 by default', () => {
        const meta = new MetaData({});
        expect(meta.firstRowHeightFactor).toBe(1);
    });

    test('constructor keeps provided firstRowHeightFactor', () => {
        const meta = new MetaData({ firstRowHeightFactor: 1.5 });
        expect(meta.firstRowHeightFactor).toBe(1.5);
    });

    test('isEqual compares two MetaData objects', () => {
        const meta1 = new MetaData({ homeGridId: 'grid1' });
        const meta2 = new MetaData({ homeGridId: 'grid1' });
        expect(meta1.isEqual(meta2)).toBe(true);
    });

    test('isEqual returns false for different objects', () => {
        const meta1 = new MetaData({ homeGridId: 'grid1' });
        const meta2 = new MetaData({ homeGridId: 'grid2' });
        expect(meta1.isEqual(meta2)).toBe(false);
    });

    test('isEqual ignores _rev and _id properties', () => {
        const meta1 = new MetaData({ homeGridId: 'grid1' });
        meta1._rev = 'rev1';
        meta1._id = 'id1';
        const meta2 = new MetaData({ homeGridId: 'grid1' });
        meta2._rev = 'rev2';
        meta2._id = 'id2';
        expect(meta1.isEqual(meta2)).toBe(true);
    });

    test('getUseColorScheme returns null when no metadata', () => {
        expect(MetaData.getUseColorScheme(null)).toBe(null);
    });

    test('getUseColorScheme returns null when colorConfig not activated', () => {
        const meta = new MetaData({
            colorConfig: { colorSchemesActivated: false }
        });
        expect(MetaData.getUseColorScheme(meta)).toBe(null);
    });

    test('getUseColorScheme returns scheme when activated', () => {
        const meta = new MetaData({
            colorConfig: { colorSchemesActivated: true, activeColorScheme: 'default' }
        });
        const scheme = MetaData.getUseColorScheme(meta);
        expect(scheme).toBeDefined();
        expect(scheme.name).toBe('default');
    });

    test('getActiveColorScheme returns first scheme by default', () => {
        const scheme = MetaData.getActiveColorScheme();
        expect(scheme.name).toBe('default');
    });

    test('getActiveColorScheme returns matching scheme', () => {
        const meta = new MetaData({
            colorConfig: { activeColorScheme: 'default' }
        });
        const scheme = MetaData.getActiveColorScheme(meta);
        expect(scheme.name).toBe('default');
    });

    test('getElementColor returns element backgroundColor when set', () => {
        const meta = new MetaData({});
        const element = { backgroundColor: '#123456' };
        expect(MetaData.getElementColor(element, meta)).toBe('#123456');
    });

    test('getElementColor returns fallback color when element has no backgroundColor', () => {
        const meta = new MetaData({});
        const element = {};
        expect(MetaData.getElementColor(element, meta, '#fallback')).toBe('#fallback');
    });

    test('getElementColor uses color scheme when activated', () => {
        const meta = new MetaData({
            colorConfig: { colorSchemesActivated: true, activeColorScheme: 'default' }
        });
        const element = { colorCategory: 'noun' };
        const color = MetaData.getElementColor(element, meta);
        expect(color).toBe('#ff0000');
    });

    test('getElementColor uses mappings for color category', () => {
        const meta = new MetaData({
            colorConfig: { colorSchemesActivated: true, activeColorScheme: 'default' }
        });
        const element = { colorCategory: 'custom' };
        const color = MetaData.getElementColor(element, meta);
        expect(color).toBe('#ff0000');
    });

    test('copies values from elementToCopy through setDefaults', () => {
        const copy = {
            id: 'copied-id',
            homeGridId: 'copied-home-grid',
            modelVersion: constants.MODEL_VERSION
        };
        const meta = new MetaData({ modelName: MetaData.getModelName() }, copy);
        expect(meta.homeGridId).toBe('copied-home-grid');
    });
});
