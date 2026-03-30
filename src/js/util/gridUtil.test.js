// Mock dependencies first
jest.mock('./modelUtil', () => ({
    modelUtil: {
        generateId: jest.fn((prefix) => `${prefix}-generated-id`)
    }
}));

jest.mock('../model/GridElement', () => ({
    GridElement: jest.fn().mockImplementation((data) => ({
        id: data?.id || 'grid-element-generated-id',
        x: data?.x || 0,
        y: data?.y || 0,
        width: data?.width || 1,
        height: data?.height || 1,
        label: data?.label || {},
        actions: data?.actions || [],
        image: data?.image || null,
        type: data?.type || 'ELEMENT_TYPE_NORMAL',
        ...data
    }))
}));

jest.mock('../model/GridData', () => ({
    GridData: jest.fn().mockImplementation((data, extra) => {
        const merged = { ...data, ...extra };
        return {
            id: merged.id || 'grid-data-generated-id',
            label: merged.label || {},
            gridElements: merged.gridElements || [],
            rowCount: merged.rowCount || 1,
            minColumnCount: merged.minColumnCount || 1,
            getWidthWithBounds: jest.fn(() => 5),
            getHeightWithBounds: jest.fn(() => 5),
            DEFAULTS: {},
            ...merged
        };
    })
}));

jest.mock('../model/GridImage', () => ({
    GridImage: jest.fn().mockImplementation((data) => ({
        id: data?.id || 'grid-image-id',
        ...data
    }))
}));

jest.mock('../model/GridActionNavigate', () => ({
    GridActionNavigate: jest.fn().mockImplementation((data) => ({
        modelName: 'GridActionNavigate',
        navType: data?.navType || 'TO_GRID',
        toGridId: data?.toGridId || null,
        ...data
    }))
}));

// Make static properties available
const GridActionNavigateMock = require('../model/GridActionNavigate').GridActionNavigate;
GridActionNavigateMock.getModelName = jest.fn(() => 'GridActionNavigate');
GridActionNavigateMock.NAV_TYPES = {
    TO_GRID: 'TO_GRID',
    TO_HOME: 'TO_HOME',
    TO_LAST: 'TO_LAST'
};

const GridElementMock = require('../model/GridElement').GridElement;
GridElementMock.ELEMENT_TYPE_NORMAL = 'ELEMENT_TYPE_NORMAL';
GridElementMock.ELEMENT_TYPE_DYNAMIC_GRID_PLACEHOLDER = 'ELEMENT_TYPE_DYNAMIC_GRID_PLACEHOLDER';
GridElementMock.ID_PREFIX = 'grid-element';
GridElementMock.DEFAULTS = {};

const GridDataMock = require('../model/GridData').GridData;
GridDataMock.DEFAULTS = {};

jest.mock('../model/GridActionCollectElement', () => ({
    GridActionCollectElement: jest.fn().mockImplementation((data) => ({
        modelName: 'GridActionCollectElement',
        ...data
    }))
}));

const GridActionCollectElementMock = require('../model/GridActionCollectElement').GridActionCollectElement;
GridActionCollectElementMock.COLLECT_ACTION_SPEAK_CONTINUOUS = 'COLLECT_ACTION_SPEAK_CONTINUOUS';
GridActionCollectElementMock.COLLECT_ACTION_REMOVE_WORD = 'COLLECT_ACTION_REMOVE_WORD';
GridActionCollectElementMock.COLLECT_ACTION_CLEAR = 'COLLECT_ACTION_CLEAR';

jest.mock('../model/GridElementCollect.js', () => ({
    GridElementCollect: jest.fn().mockImplementation((data) => ({
        id: 'grid-element-collect-id',
        type: 'ELEMENT_TYPE_COLLECT',
        width: data?.width || 10,
        height: data?.height || 1,
        x: data?.x || 0,
        y: data?.y || 0,
        ...data
    }))
}));

jest.mock('../service/i18nService', () => ({
    i18nService: {
        getTranslation: jest.fn((label) => typeof label === 'string' ? label : (label?.en || '')),
        getTranslationObject: jest.fn((text, locale) => ({ [locale || 'en']: text })),
        t: jest.fn((key) => key),
        getContentLang: jest.fn(() => 'en'),
        getBaseLang: jest.fn((lang) => lang?.split('-')[0] || lang)
    }
}));

jest.mock('../service/data/encryptionService', () => ({
    encryptionService: {
        getStringHash: jest.fn((str) => `hash-${str.substring(0, 10)}`)
    }
}));

jest.mock('../../vue-components/grid-layout/utils/gridLayoutUtil', () => ({
    gridLayoutUtil: {
        getWidth: jest.fn((elements) => {
            if (!elements || elements.length === 0) return 0;
            return Math.max(...elements.map(e => (e.x || 0) + (e.width || 1)));
        }),
        getHeight: jest.fn((elements) => {
            if (!elements || elements.length === 0) return 0;
            return Math.max(...elements.map(e => (e.y || 0) + (e.height || 1)));
        })
    }
}));

jest.mock('./constants.js', () => ({
    constants: {
        ARASAAC_AUTHOR: 'ARASAAC - CC (BY-NC-SA)',
        ARASAAC_LICENSE_URL: 'https://arasaac.org/terms-of-use',
        TRANSFER_PROPS: {
            COLOR_CATEGORY: { path: 'colorCategory' },
            BACKGROUND_COLOR: { path: 'backgroundColor' },
            HIDDEN: { path: 'hidden', category: 'APPEARANCE' }
        },
        PROP_TRANSFER_DONT_CHANGE: 'DONT_CHANGE',
        PROP_TRANSFER_CATEGORIES: {
            APPEARANCE: 'APPEARANCE'
        },
        DEFAULT_GRID_BACKGROUND_COLOR: '#e8e8e8'
    }
}));

jest.mock('./util', () => ({
    util: {
        limitValue: jest.fn((val, min, max, def) => {
            if (isNaN(val)) return def;
            return Math.min(max, Math.max(min, val));
        })
    }
}));

import { gridUtil } from './gridUtil';
import { modelUtil } from './modelUtil';
import { GridElement } from '../model/GridElement';
import { GridData } from '../model/GridData';
import { GridActionNavigate } from '../model/GridActionNavigate';
import { i18nService } from '../service/i18nService';
import { gridLayoutUtil } from '../../vue-components/grid-layout/utils/gridLayoutUtil';

describe('gridUtil', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('regenerateIDs', () => {
        test('generates new IDs for all grids', () => {
            const grids = [
                { id: 'grid1', _id: 'grid1', gridElements: [] },
                { id: 'grid2', _id: 'grid2', gridElements: [] }
            ];
            
            const result = gridUtil.regenerateIDs(grids);
            
            expect(result.grids).toHaveLength(2);
            expect(result.idMapping).toBeDefined();
            expect(modelUtil.generateId).toHaveBeenCalledWith('grid-data');
        });

        test('maintains correct references in navigate actions', () => {
            const grids = [
                {
                    id: 'grid1',
                    _id: 'grid1',
                    gridElements: [{
                        actions: [{ toGridId: 'grid2' }]
                    }]
                },
                { id: 'grid2', _id: 'grid2', gridElements: [] }
            ];
            
            const result = gridUtil.regenerateIDs(grids);
            
            expect(result.idMapping).toHaveProperty('grid1');
            expect(result.idMapping).toHaveProperty('grid2');
        });
    });

    describe('sortGridElements', () => {
        test('returns null/undefined input unchanged', () => {
            expect(gridUtil.sortGridElements(null)).toBeNull();
            expect(gridUtil.sortGridElements(undefined)).toBeUndefined();
        });

        test('sorts elements by y then x', () => {
            const elements = [
                { x: 1, y: 1 },
                { x: 0, y: 0 },
                { x: 1, y: 0 },
                { x: 0, y: 1 }
            ];
            
            const result = gridUtil.sortGridElements(elements);
            
            expect(result[0]).toEqual({ x: 0, y: 0 });
            expect(result[1]).toEqual({ x: 1, y: 0 });
            expect(result[2]).toEqual({ x: 0, y: 1 });
            expect(result[3]).toEqual({ x: 1, y: 1 });
        });
    });

    describe('generateGlobalGrid', () => {
        test('generates global grid with default elements', () => {
            const result = gridUtil.generateGlobalGrid('en');
            
            expect(GridData).toHaveBeenCalled();
            expect(result).toHaveProperty('gridElements');
        });

        test('accepts convertToLowercase option', () => {
            const result = gridUtil.generateGlobalGrid('en', { convertToLowercase: true });
            
            expect(result).toBeDefined();
        });
    });

    describe('getOffset', () => {
        test('calculates offset for global grid', () => {
            const globalGrid = {
                gridElements: [
                    { x: 0, y: 0, width: 2, height: 1 }
                ]
            };
            
            const result = gridUtil.getOffset(globalGrid);
            
            expect(result).toHaveProperty('x');
            expect(result).toHaveProperty('y');
        });
    });

    describe('getFreeCoordinates', () => {
        test('returns free coordinates in grid', () => {
            const gridData = {
                gridElements: [
                    { x: 0, y: 0, width: 1, height: 1 }
                ],
                getWidthWithBounds: () => 2,
                getHeightWithBounds: () => 2
            };
            
            const result = gridUtil.getFreeCoordinates(gridData);
            
            // Should have 3 free coordinates (2x2=4, minus 1 occupied)
            expect(result.length).toBe(3);
        });
    });

    describe('getFillElements', () => {
        test('creates elements to fill free spaces', () => {
            const gridData = {
                gridElements: [
                    { x: 0, y: 0, width: 1, height: 1 }
                ],
                getWidthWithBounds: () => 2,
                getHeightWithBounds: () => 1
            };
            
            const result = gridUtil.getFillElements(gridData);
            
            expect(result.length).toBe(1);
            expect(GridElement).toHaveBeenCalled();
        });
    });

    describe('fillFreeSpaces', () => {
        test('returns null for null input', () => {
            expect(gridUtil.fillFreeSpaces(null)).toBeNull();
        });

        test('fills free spaces with elements', () => {
            const gridData = {
                gridElements: [
                    { x: 0, y: 0, width: 1, height: 1 }
                ],
                getWidthWithBounds: () => 2,
                getHeightWithBounds: () => 1
            };
            
            const result = gridUtil.fillFreeSpaces(gridData);
            
            expect(result.gridElements.length).toBeGreaterThan(1);
        });
    });

    describe('updateOrAddGridElement', () => {
        test('updates existing element', () => {
            const gridData = {
                gridElements: [{ id: 'elem1', label: 'old' }]
            };
            const updatedElement = { id: 'elem1', label: 'new' };
            
            const result = gridUtil.updateOrAddGridElement(gridData, updatedElement);
            
            expect(result.gridElements[0].label).toBe('new');
        });

        test('adds new element if not found', () => {
            const gridData = {
                gridElements: [{ id: 'elem1' }]
            };
            const newElement = { id: 'elem2' };
            
            const result = gridUtil.updateOrAddGridElement(gridData, newElement);
            
            expect(result.gridElements.length).toBe(2);
        });
    });

    describe('getGraphList', () => {
        test('returns empty array for empty grids', () => {
            const result = gridUtil.getGraphList([]);
            expect(result).toEqual([]);
        });

        test('creates graph with parent/child relationships', () => {
            const grids = [
                {
                    id: 'grid1',
                    gridElements: [{
                        actions: [{
                            modelName: 'GridActionNavigate',
                            navType: 'TO_GRID',
                            toGridId: 'grid2'
                        }]
                    }]
                },
                {
                    id: 'grid2',
                    gridElements: []
                }
            ];
            
            const result = gridUtil.getGraphList(grids);
            
            expect(result.length).toBe(2);
        });

        test('filters out specified grid ID', () => {
            const grids = [
                { id: 'grid1', gridElements: [] },
                { id: 'globalGrid', gridElements: [] }
            ];
            
            const result = gridUtil.getGraphList(grids, 'globalGrid');
            
            expect(result.length).toBe(1);
            expect(result[0].grid.id).toBe('grid1');
        });
    });

    describe('getAllPaths', () => {
        test('returns empty array for null start element', () => {
            expect(gridUtil.getAllPaths(null)).toEqual([]);
        });

        test('returns path with single element when no children', () => {
            const startElem = {
                grid: { id: 'grid1' },
                children: []
            };
            
            const result = gridUtil.getAllPaths(startElem);
            
            expect(result.length).toBe(1);
            expect(result[0]).toContain(startElem);
        });
    });

    describe('getIdPathMap', () => {
        test('creates map from grid ID to shortest path', () => {
            const startElem = {
                grid: { id: 'grid1' },
                children: []
            };
            
            const result = gridUtil.getIdPathMap(startElem);
            
            expect(result).toHaveProperty('grid1');
        });
    });

    describe('getGridPath', () => {
        test('returns empty array for invalid input', () => {
            expect(gridUtil.getGridPath(null, 'a', 'b')).toEqual([]);
            expect(gridUtil.getGridPath([], null, 'b')).toEqual([]);
            expect(gridUtil.getGridPath([], 'a', null)).toEqual([]);
        });

        test('returns single grid when from and to are same', () => {
            const graphList = [{
                grid: { id: 'grid1' },
                children: [],
                parents: []
            }];
            
            const result = gridUtil.getGridPath(graphList, 'grid1', 'grid1');
            
            expect(result.length).toBe(1);
        });
    });

    describe('getAllChildrenRecursive', () => {
        test('returns children of grid excluding itself', () => {
            const graphList = [
                {
                    grid: { id: 'parent' },
                    children: [{
                        grid: { id: 'child' },
                        children: []
                    }]
                }
            ];
            
            const result = gridUtil.getAllChildrenRecursive(graphList, 'parent');
            
            // Should return child but not parent
            expect(result.some(g => g.id === 'parent')).toBe(false);
        });
    });

    describe('getGridsContentLang', () => {
        test('returns preferred lang if present in grids', () => {
            const grids = [{
                gridElements: [{ label: { en: 'test', de: 'test' } }]
            }];
            
            const result = gridUtil.getGridsContentLang(grids, 'de');
            
            expect(result).toBe('de');
        });

        test('returns first available lang if preferred not present', () => {
            const grids = [{
                gridElements: [{ label: { fr: 'test' } }]
            }];
            
            const result = gridUtil.getGridsContentLang(grids, 'de');
            
            expect(result).toBe('fr');
        });

        test('returns preferred lang for empty grids', () => {
            expect(gridUtil.getGridsContentLang([], 'en')).toBe('en');
            expect(gridUtil.getGridsContentLang(null, 'en')).toBe('en');
        });
    });

    describe('getGridLangs', () => {
        test('returns empty array for null grid', () => {
            expect(gridUtil.getGridLangs(null)).toEqual([]);
        });

        test('returns unique languages from grid elements', () => {
            const grid = {
                gridElements: [
                    { label: { en: 'a', de: 'b' } },
                    { label: { en: 'c', fr: 'd' } }
                ]
            };
            
            const result = gridUtil.getGridLangs(grid);
            
            expect(result).toContain('en');
            expect(result).toContain('de');
            expect(result).toContain('fr');
        });
    });

    describe('getActionsOfType', () => {
        test('returns empty array for null element', () => {
            expect(gridUtil.getActionsOfType(null, 'GridActionNavigate')).toEqual([]);
        });

        test('filters actions by model name', () => {
            const element = {
                actions: [
                    { modelName: 'GridActionNavigate' },
                    { modelName: 'GridActionSpeak' },
                    { modelName: 'GridActionNavigate' }
                ]
            };
            
            const result = gridUtil.getActionsOfType(element, 'GridActionNavigate');
            
            expect(result.length).toBe(2);
        });
    });

    describe('getWidth and getHeight', () => {
        test('getWidth calculates width from elements', () => {
            const elements = [
                { x: 0, y: 0, width: 2, height: 1 },
                { x: 2, y: 0, width: 1, height: 1 }
            ];
            
            gridUtil.getWidth(elements);
            expect(gridLayoutUtil.getWidth).toHaveBeenCalled();
        });

        test('getHeight calculates height from elements', () => {
            const elements = [
                { x: 0, y: 0, width: 1, height: 2 },
                { x: 0, y: 2, width: 1, height: 1 }
            ];
            
            gridUtil.getHeight(elements);
            expect(gridLayoutUtil.getHeight).toHaveBeenCalled();
        });
    });

    describe('getWidthWithBounds and getHeightWithBounds', () => {
        test('getWidthWithBounds respects minColumnCount', () => {
            const gridData = {
                gridElements: [{ x: 0, y: 0, width: 1, height: 1 }],
                minColumnCount: 5
            };
            
            const result = gridUtil.getWidthWithBounds(gridData);
            
            expect(result).toBeGreaterThanOrEqual(5);
        });

        test('getHeightWithBounds respects rowCount', () => {
            const gridData = {
                gridElements: [{ x: 0, y: 0, width: 1, height: 1 }],
                rowCount: 5
            };
            
            const result = gridUtil.getHeightWithBounds(gridData);
            
            expect(result).toBeGreaterThanOrEqual(5);
        });
    });

    describe('ensureDefaults', () => {
        test('returns undefined for null input', () => {
            expect(gridUtil.ensureDefaults(null)).toBeUndefined();
        });

        test('sets defaults on grid data', () => {
            const gridData = {
                gridElements: [{}]
            };
            
            const result = gridUtil.ensureDefaults(gridData);
            
            expect(result).toBeDefined();
        });
    });

    describe('duplicateElement', () => {
        test('creates duplicate with new ID', () => {
            const element = {
                id: 'elem1',
                label: 'test',
                actions: [
                    { modelName: 'GridActionNavigate' },
                    { modelName: 'GridActionSpeak' }
                ]
            };
            
            const result = gridUtil.duplicateElement(element);
            
            expect(result.id).not.toBe('elem1');
            expect(result.label).toBe('test');
        });

        test('removes navigation actions', () => {
            const element = {
                id: 'elem1',
                actions: [
                    { modelName: 'GridActionNavigate' },
                    { modelName: 'GridActionSpeak' }
                ]
            };
            
            const result = gridUtil.duplicateElement(element);
            
            expect(result.actions.some(a => a.modelName === 'GridActionNavigate')).toBe(false);
        });
    });

    describe('duplicateElements', () => {
        test('duplicates array of elements', () => {
            const elements = [
                { id: 'elem1', label: 'a' },
                { id: 'elem2', label: 'b' }
            ];
            
            const result = gridUtil.duplicateElements(elements);
            
            expect(result.length).toBe(2);
        });

        test('handles empty array', () => {
            expect(gridUtil.duplicateElements([])).toEqual([]);
        });
    });

    describe('ensureUniqueIds', () => {
        test('regenerates duplicate IDs', () => {
            const elements = [
                { id: 'same-id' },
                { id: 'same-id' }
            ];
            
            gridUtil.ensureUniqueIds(elements);
            
            expect(elements[0].id).not.toBe(elements[1].id);
        });
    });

    describe('getOneElementSize', () => {
        test('calculates single element size', () => {
            const containerSize = { width: 1000, height: 500 };
            const gridData = {
                gridElements: [],
                minColumnCount: 10,
                rowCount: 5
            };
            
            gridLayoutUtil.getWidth.mockReturnValue(10);
            gridLayoutUtil.getHeight.mockReturnValue(5);
            
            const result = gridUtil.getOneElementSize(containerSize, gridData);
            
            expect(result.width).toBe(100);
            expect(result.height).toBe(100);
        });
    });

    describe('isWithinElements', () => {
        test('returns false for null elements', () => {
            expect(gridUtil.isWithinElements(null, {}, {})).toBe(false);
            expect(gridUtil.isWithinElements({}, null, {})).toBe(false);
            expect(gridUtil.isWithinElements({}, {}, null)).toBe(false);
        });

        test('returns true when elem3 is within rectangle', () => {
            const elem1 = { x: 0, y: 0 };
            const elem2 = { x: 5, y: 5 };
            const elem3 = { x: 2, y: 2 };
            
            expect(gridUtil.isWithinElements(elem1, elem2, elem3)).toBe(true);
        });

        test('returns false when elem3 is outside rectangle', () => {
            const elem1 = { x: 0, y: 0 };
            const elem2 = { x: 5, y: 5 };
            const elem3 = { x: 10, y: 10 };
            
            expect(gridUtil.isWithinElements(elem1, elem2, elem3)).toBe(false);
        });
    });

    describe('getAllPropTransferPaths', () => {
        test('returns array of property paths', () => {
            const result = gridUtil.getAllPropTransferPaths();
            
            expect(Array.isArray(result)).toBe(true);
            expect(result).toContain('colorCategory');
            expect(result).toContain('backgroundColor');
        });
    });

    describe('getPropTransferObjectBase', () => {
        test('returns object with all paths set to DONT_CHANGE', () => {
            const result = gridUtil.getPropTransferObjectBase();
            
            expect(result.colorCategory).toBe('DONT_CHANGE');
            expect(result.backgroundColor).toBe('DONT_CHANGE');
        });
    });

    describe('getDisplayLabel', () => {
        test('returns translated label', () => {
            const element = {
                label: { en: 'Hello' },
                wordForms: []
            };
            
            const result = gridUtil.getDisplayLabel(element);
            
            expect(i18nService.getTranslation).toHaveBeenCalled();
        });
    });

    describe('hasDynamicGridPlaceholder', () => {
        test('returns false for null grid', () => {
            expect(gridUtil.hasDynamicGridPlaceholder(null)).toBe(false);
        });

        test('returns true when placeholder exists', () => {
            const grid = {
                gridElements: [
                    { type: 'ELEMENT_TYPE_DYNAMIC_GRID_PLACEHOLDER' }
                ]
            };
            
            expect(gridUtil.hasDynamicGridPlaceholder(grid)).toBe(true);
        });

        test('returns false when no placeholder', () => {
            const grid = {
                gridElements: [
                    { type: 'ELEMENT_TYPE_NORMAL' }
                ]
            };
            
            expect(gridUtil.hasDynamicGridPlaceholder(grid)).toBe(false);
        });
    });

    describe('hasOutdatedThumbnail', () => {
        test('returns true when no thumbnail', () => {
            const gridData = { gridElements: [] };
            expect(gridUtil.hasOutdatedThumbnail(gridData)).toBe(true);
        });

        test('returns true when thumbnail has no data', () => {
            const gridData = {
                thumbnail: { hash: 'abc' },
                gridElements: []
            };
            expect(gridUtil.hasOutdatedThumbnail(gridData)).toBe(true);
        });
    });

    describe('getHash', () => {
        test('generates hash from grid elements', () => {
            const gridData = {
                gridElements: [
                    { id: 'elem1', label: { en: 'test' }, backgroundColor: '#fff', colorCategory: 'cat', x: 0, y: 0 }
                ]
            };
            
            const result = gridUtil.getHash(gridData);
            
            expect(result).toMatch(/^hash-/);
        });
    });

    describe('getElementHash', () => {
        test('generates hash for element', () => {
            const element = {
                id: 'elem1',
                label: { en: 'test' },
                backgroundColor: '#fff',
                colorCategory: 'cat',
                x: 0,
                y: 0
            };
            
            const result = gridUtil.getElementHash(element);
            
            expect(result).toMatch(/^hash-/);
        });

        test('returns plain string when dontHash is true', () => {
            const element = {
                id: 'elem1',
                label: { en: 'test' },
                backgroundColor: '#fff',
                colorCategory: 'cat',
                x: 0,
                y: 0
            };
            
            const result = gridUtil.getElementHash(element, { dontHash: true });
            
            expect(result).not.toMatch(/^hash-/);
            expect(result).toContain('elem1');
        });

        test('skips position when skipPosition is true', () => {
            const element = {
                id: 'elem1',
                label: {},
                backgroundColor: '',
                colorCategory: '',
                x: 5,
                y: 10
            };
            
            const withPosition = gridUtil.getElementHash(element, { dontHash: true });
            const withoutPosition = gridUtil.getElementHash(element, { dontHash: true, skipPosition: true });
            
            expect(withPosition).toContain('5:10');
            expect(withoutPosition).not.toContain('5:10');
        });
    });

    describe('getCursorType', () => {
        test('returns default cursor type for null metadata', () => {
            expect(gridUtil.getCursorType(null)).toBe('default');
        });

        test('returns default cursor when hover not hiding cursor', () => {
            const metadata = {
                inputConfig: {
                    hoverEnabled: true,
                    hoverHideCursor: false
                }
            };
            
            expect(gridUtil.getCursorType(metadata)).toBe('default');
        });

        test('returns none when hover hides cursor', () => {
            const metadata = {
                inputConfig: {
                    hoverEnabled: true,
                    hoverHideCursor: true
                }
            };
            
            expect(gridUtil.getCursorType(metadata)).toBe('none');
        });
    });

    describe('getElemBackgroundCss', () => {
        test('returns background color CSS', () => {
            const elem = { id: 'elem1' };
            const childGrid = { backgroundColor: '#ff0000' };
            
            const result = gridUtil.getElemBackgroundCss(elem, childGrid);
            
            expect(result).toContain('background-color');
            expect(result).toContain('#ff0000');
        });

        test('uses global grid background for global elements', () => {
            const elem = { id: 'elem1' };
            const childGrid = { backgroundColor: '#ff0000' };
            const globalGrid = {
                gridElements: [{ id: 'elem1' }],
                backgroundColor: '#00ff00'
            };
            
            const result = gridUtil.getElemBackgroundCss(elem, childGrid, globalGrid);
            
            expect(result).toContain('#00ff00');
        });
    });

    describe('getWordFormsForLang', () => {
        test('returns forms matching language', () => {
            const element = {
                wordForms: [
                    { lang: 'en', value: 'hello' },
                    { lang: 'de', value: 'hallo' }
                ]
            };
            
            const result = gridUtil.getWordFormsForLang(element, 'en');
            
            expect(result.length).toBe(1);
            expect(result[0].value).toBe('hello');
        });

        test('includes forms without language', () => {
            const element = {
                wordForms: [
                    { value: 'universal' },
                    { lang: 'en', value: 'hello' }
                ]
            };
            
            const result = gridUtil.getWordFormsForLang(element, 'en');
            
            expect(result.length).toBe(2);
        });
    });
});
