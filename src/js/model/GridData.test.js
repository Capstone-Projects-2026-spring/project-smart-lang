jest.mock('../externals/objectmodel', () => {
    class MockModel {
        static definition = {};

        static defaults(defaults) {
            this._defaults = defaults;
        }

        static extend(extension) {
            return class extends MockModel {
                static definition = { ...this.definition, ...extension };
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
            const copy = { ...properties };
            const needed = Object.keys(modelClass.definition || {});
            Object.keys(base || {}).forEach((key) => {
                if (needed.includes(key) && copy[key] === undefined) {
                    copy[key] = base[key];
                }
            });
            return copy;
        }),
        generateId: jest.fn(() => 'grid-data-1-100')
    }
}));

jest.mock('../util/constants', () => ({
    constants: {
        MODEL_VERSION: '{"major": 6, "minor": 0, "patch": 0}'
    }
}));

jest.mock('../util/gridUtil', () => ({
    gridUtil: {
        getWidth: jest.fn(() => 4),
        getHeight: jest.fn(() => 3),
        getWidthWithBounds: jest.fn(() => 4),
        getHeightWithBounds: jest.fn(() => 3),
        getFreeCoordinates: jest.fn(() => [{ x: 0, y: 0 }])
    }
}));

jest.mock('../service/data/localStorageService', () => ({
    localStorageService: {
        getLastGridDimensions: jest.fn(() => ({ minColumnCount: 4, rowCount: 3 }))
    }
}));

jest.mock('./GridElement', () => ({
    GridElement: class {
        constructor(props = {}) {
            this.id = props.id || 'grid-element-mock';
            Object.assign(this, props);
        }
        static ELEMENT_TYPE_NORMAL = 'ELEMENT_TYPE_NORMAL';
        static ELEMENT_TYPE_PREDICTION = 'ELEMENT_TYPE_PREDICTION';
    }
}));

jest.mock('./AdditionalGridFile', () => ({
    AdditionalGridFile: class {
        constructor(props = {}) {
            Object.assign(this, props);
        }
    }
}));

import { GridData } from './GridData';
import { constants } from '../util/constants';
import { gridUtil } from '../util/gridUtil';
import { modelUtil } from '../util/modelUtil';

describe('GridData', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('getModelName returns correct name', () => {
        expect(GridData.getModelName()).toBe('GridData');
    });

    test('getIdPrefix returns correct prefix', () => {
        expect(GridData.getIdPrefix()).toBe('grid-data');
    });

    test('constructor applies defaults and auto-generates id', () => {
        const grid = new GridData({});
        expect(grid.modelName).toBe('GridData');
        expect(grid.modelVersion).toBe(constants.MODEL_VERSION);
        expect(grid.id).toBe('grid-data-1-100');
    });

    test('constructor keeps provided id', () => {
        const grid = new GridData({ id: 'my-grid-id' });
        expect(grid.id).toBe('my-grid-id');
    });

    test('constructor sets minColumnCount and rowCount from gridUtil', () => {
        const grid = new GridData({});
        expect(grid.minColumnCount).toBe(4);
        expect(grid.rowCount).toBe(3);
    });

    test('hasSetPositions returns true when all elements have positions', () => {
        const grid = new GridData({
            gridElements: [
                { hasSetPosition: () => true },
                { hasSetPosition: () => true }
            ]
        });
        expect(grid.hasSetPositions()).toBe(true);
    });

    test('hasSetPositions returns false when any element lacks position', () => {
        const grid = new GridData({
            gridElements: [
                { hasSetPosition: () => true },
                { hasSetPosition: () => false }
            ]
        });
        expect(grid.hasSetPositions()).toBe(false);
    });

    test('getWidth calls gridUtil.getWidth', () => {
        const grid = new GridData({});
        grid.getWidth();
        expect(gridUtil.getWidth).toHaveBeenCalled();
    });

    test('getHeight calls gridUtil.getHeight', () => {
        const grid = new GridData({});
        grid.getHeight();
        expect(gridUtil.getHeight).toHaveBeenCalled();
    });

    test('isFull returns false for empty grid', () => {
        const grid = new GridData({ gridElements: [] });
        expect(grid.isFull()).toBe(false);
    });

    test('isFull returns true when all area is occupied', () => {
        gridUtil.getWidthWithBounds.mockReturnValue(2);
        gridUtil.getHeightWithBounds.mockReturnValue(2);
        const grid = new GridData({
            gridElements: [
                { width: 2, height: 2 }
            ]
        });
        expect(grid.isFull()).toBe(true);
    });

    test('getNewXYPos returns free coordinates from gridUtil', () => {
        gridUtil.getFreeCoordinates.mockReturnValue([{ x: 1, y: 2 }]);
        const grid = new GridData({ gridElements: [] });
        const pos = grid.getNewXYPos();
        expect(pos).toEqual({ x: 1, y: 2 });
    });

    test('getNewXYPos returns new row when no free coordinates', () => {
        gridUtil.getFreeCoordinates.mockReturnValue([]);
        gridUtil.getHeightWithBounds.mockReturnValue(3);
        const grid = new GridData({ gridElements: [] });
        const pos = grid.getNewXYPos();
        expect(pos).toEqual({ x: 0, y: 3 });
    });

    test('getNewXYPos for big element returns position at first row', () => {
        const grid = new GridData({
            gridElements: [
                { x: 0, y: 0, width: 2, height: 2 }
            ]
        });
        const pos = grid.getNewXYPos(true);
        expect(pos.y).toBe(0);
        expect(pos.x).toBe(2);
    });

    test('isEqual compares two GridData objects', () => {
        const grid1 = new GridData({ label: { en: 'Test' } });
        const grid2 = new GridData({ label: { en: 'Test' } });
        expect(grid1.isEqual(grid2)).toBe(true);
    });

    test('isEqual ignores _rev and _id properties', () => {
        const grid1 = new GridData({ label: { en: 'Test' } });
        grid1._rev = 'rev1';
        grid1._id = 'id1';
        const grid2 = new GridData({ label: { en: 'Test' } });
        grid2._rev = 'rev2';
        grid2._id = 'id2';
        expect(grid1.isEqual(grid2)).toBe(true);
    });

    test('getNextElementId returns first element id when current not found', () => {
        const grid = new GridData({
            gridElements: [
                { id: 'el1', x: 0, y: 0, type: 'ELEMENT_TYPE_NORMAL' },
                { id: 'el2', x: 1, y: 0, type: 'ELEMENT_TYPE_NORMAL' }
            ]
        });
        expect(grid.getNextElementId('unknown')).toBe('el1');
    });

    test('getNextElementId returns next element', () => {
        const grid = new GridData({
            gridElements: [
                { id: 'el1', x: 0, y: 0, type: 'ELEMENT_TYPE_NORMAL' },
                { id: 'el2', x: 1, y: 0, type: 'ELEMENT_TYPE_NORMAL' }
            ]
        });
        expect(grid.getNextElementId('el1')).toBe('el2');
    });

    test('getPreviousElementId returns previous element', () => {
        const grid = new GridData({
            gridElements: [
                { id: 'el1', x: 0, y: 0, type: 'ELEMENT_TYPE_NORMAL' },
                { id: 'el2', x: 1, y: 0, type: 'ELEMENT_TYPE_NORMAL' }
            ]
        });
        expect(grid.getPreviousElementId('el2')).toBe('el1');
    });

    test('getAdditionalFile returns file by fileName', () => {
        const file = { fileName: 'test.txt', dataBase64: 'abc' };
        const grid = new GridData({
            additionalFiles: [file]
        });
        expect(grid.getAdditionalFile('test.txt')).toEqual(file);
    });

    test('getAdditionalFile returns null when not found', () => {
        const grid = new GridData({ additionalFiles: [] });
        expect(grid.getAdditionalFile('nonexistent.txt')).toBe(null);
    });

    test('hasPredictionElements returns true when prediction element exists', () => {
        const grid = new GridData({
            gridElements: [
                { type: 'ELEMENT_TYPE_PREDICTION' }
            ]
        });
        expect(grid.hasPredictionElements()).toBe(true);
    });

    test('hasPredictionElements returns false when no prediction element', () => {
        const grid = new GridData({
            gridElements: [
                { type: 'ELEMENT_TYPE_NORMAL' }
            ]
        });
        expect(grid.hasPredictionElements()).toBe(false);
    });

    test('clone creates a copy with new ids and appends (Copy) to labels', () => {
        modelUtil.generateId.mockReturnValue('new-grid-id');
        const grid = new GridData({
            id: 'original-id',
            label: { en: 'Original' },
            gridElements: [{ id: 'el1' }]
        });
        const cloned = grid.clone();
        expect(cloned.id).toBe('new-grid-id');
        expect(cloned.label.en).toBe('Original (Copy)');
    });

    test('static constants are defined', () => {
        expect(GridData.KEYBOARD_ENABLED).toBe('KEYBOARD_ENABLED');
        expect(GridData.KEYBOARD_DISABLED).toBe('KEYBOARD_DISABLED');
        expect(GridData.KEYBOARD_MODES).toContain('KEYBOARD_ENABLED');
        expect(GridData.KEYBOARD_MODES).toContain('KEYBOARD_DISABLED');
    });

    test('copies values from elementToCopy through setDefaults', () => {
        const copy = {
            id: 'copied-id',
            label: { de: 'Kopie' },
            modelVersion: constants.MODEL_VERSION
        };
        const grid = new GridData({ modelName: GridData.getModelName() }, copy);
        expect(grid.label).toEqual({ de: 'Kopie' });
    });
});
