// Mock dependencies
jest.mock('./data/dataService.js', () => ({
    dataService: {
        getGrids: jest.fn(),
        getGrid: jest.fn(),
        saveGrid: jest.fn(() => Promise.resolve()),
        getMetadata: jest.fn()
    }
}));

jest.mock('../util/gridUtil.js', () => ({
    gridUtil: {
        getGraphList: jest.fn(),
        getFreeCoordinates: jest.fn(),
        getHeightWithBounds: jest.fn()
    }
}));

jest.mock('../model/GridElement.js', () => ({
    GridElement: class {
        constructor(props) {
            Object.assign(this, props);
            this.id = props?.id || 'generated-elem-id';
        }
        static ELEMENT_TYPE_NORMAL = 'ELEMENT_TYPE_NORMAL';
        static ELEMENT_TYPE_COLLECT = 'ELEMENT_TYPE_COLLECT';
    }
}));

jest.mock('../model/GridData.js', () => ({
    GridData: {
        KEYBOARD_ENABLED: 'KEYBOARD_ENABLED',
        KEYBOARD_DISABLED: 'KEYBOARD_DISABLED'
    }
}));

jest.mock('../model/GridActionNavigate.js', () => ({
    GridActionNavigate: class {
        constructor(props) {
            Object.assign(this, props);
            this.modelName = 'GridActionNavigate';
        }
        static getModelName() { return 'GridActionNavigate'; }
        static NAV_TYPES = { TO_GRID: 'TO_GRID' };
    }
}));

jest.mock('../model/GridImage.js', () => ({
    GridImage: class {
        constructor(props) {
            Object.assign(this, props);
        }
    }
}));

jest.mock('./i18nService.js', () => ({
    i18nService: {
        getTranslation: jest.fn((label) => {
            if (typeof label === 'string') return label;
            if (label && label.en) return label.en;
            return null;
        })
    }
}));

import { tileVisibilityService } from './tileVisibilityService';
import { dataService } from './data/dataService.js';
import { gridUtil } from '../util/gridUtil.js';
import { i18nService } from './i18nService.js';

describe('tileVisibilityService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        global.log = { warn: jest.fn(), debug: jest.fn(), info: jest.fn() };
    });

    describe('getAllTilesGroupedByGrid', () => {
        test('should return tiles grouped by grid', async () => {
            const mockGrids = [
                {
                    id: 'grid1',
                    label: { en: 'Main Grid' },
                    gridElements: [
                        {
                            id: 'elem1',
                            type: 'ELEMENT_TYPE_NORMAL',
                            label: { en: 'Hello' },
                            image: { url: 'hello.png' },
                            hidden: false
                        },
                        {
                            id: 'elem2',
                            type: 'ELEMENT_TYPE_NORMAL',
                            label: { en: 'World' },
                            image: { url: 'world.png' },
                            hidden: true
                        }
                    ]
                }
            ];
            const mockMetadata = { globalGridId: 'global-grid' };

            dataService.getGrids.mockResolvedValue(mockGrids);
            dataService.getMetadata.mockResolvedValue(mockMetadata);

            const result = await tileVisibilityService.getAllTilesGroupedByGrid();

            expect(result).toHaveLength(1);
            expect(result[0].tiles).toHaveLength(2);
            expect(result[0].visibleCount).toBe(1);
            expect(result[0].hiddenCount).toBe(1);
        });

        test('should exclude global grid', async () => {
            const mockGrids = [
                {
                    id: 'global-grid',
                    label: { en: 'Global' },
                    gridElements: [
                        { id: 'elem1', type: 'ELEMENT_TYPE_NORMAL', label: { en: 'Global Elem' }, image: { url: 'x.png' } }
                    ]
                },
                {
                    id: 'grid1',
                    label: { en: 'Regular' },
                    gridElements: [
                        { id: 'elem2', type: 'ELEMENT_TYPE_NORMAL', label: { en: 'Regular Elem' }, image: { url: 'y.png' } }
                    ]
                }
            ];
            const mockMetadata = { globalGridId: 'global-grid' };

            dataService.getGrids.mockResolvedValue(mockGrids);
            dataService.getMetadata.mockResolvedValue(mockMetadata);

            const result = await tileVisibilityService.getAllTilesGroupedByGrid();

            expect(result).toHaveLength(1);
            expect(result[0].grid.id).toBe('grid1');
        });

        test('should exclude keyboard grids', async () => {
            const mockGrids = [
                {
                    id: 'keyboard-grid',
                    keyboardMode: 'KEYBOARD_ENABLED',
                    label: { en: 'Keyboard' },
                    gridElements: [
                        { id: 'elem1', type: 'ELEMENT_TYPE_NORMAL', label: { en: 'A' }, image: { url: 'a.png' } }
                    ]
                },
                {
                    id: 'normal-grid',
                    keyboardMode: 'KEYBOARD_DISABLED',
                    label: { en: 'Normal' },
                    gridElements: [
                        { id: 'elem2', type: 'ELEMENT_TYPE_NORMAL', label: { en: 'Hello' }, image: { url: 'hello.png' } }
                    ]
                }
            ];
            const mockMetadata = { globalGridId: 'global' };

            dataService.getGrids.mockResolvedValue(mockGrids);
            dataService.getMetadata.mockResolvedValue(mockMetadata);

            const result = await tileVisibilityService.getAllTilesGroupedByGrid();

            expect(result).toHaveLength(1);
            expect(result[0].grid.id).toBe('normal-grid');
        });

        test('should exclude empty tiles', async () => {
            const mockGrids = [
                {
                    id: 'grid1',
                    label: { en: 'Grid' },
                    gridElements: [
                        { id: 'elem1', type: 'ELEMENT_TYPE_NORMAL', label: { en: 'Valid' }, image: { url: 'x.png' } },
                        { id: 'elem2', type: 'ELEMENT_TYPE_NORMAL', label: { en: '' }, image: null }, // Empty
                        { id: 'elem3', type: 'ELEMENT_TYPE_NORMAL', label: null, image: null } // Also empty
                    ]
                }
            ];
            const mockMetadata = { globalGridId: 'global' };

            dataService.getGrids.mockResolvedValue(mockGrids);
            dataService.getMetadata.mockResolvedValue(mockMetadata);

            const result = await tileVisibilityService.getAllTilesGroupedByGrid();

            expect(result[0].tiles).toHaveLength(1);
            expect(result[0].tiles[0].id).toBe('elem1');
        });

        test('should exclude non-normal elements', async () => {
            const mockGrids = [
                {
                    id: 'grid1',
                    label: { en: 'Grid' },
                    gridElements: [
                        { id: 'elem1', type: 'ELEMENT_TYPE_NORMAL', label: { en: 'Normal' }, image: { url: 'x.png' } },
                        { id: 'elem2', type: 'ELEMENT_TYPE_COLLECT', label: { en: 'Collect' }, image: { url: 'y.png' } }
                    ]
                }
            ];
            const mockMetadata = { globalGridId: 'global' };

            dataService.getGrids.mockResolvedValue(mockGrids);
            dataService.getMetadata.mockResolvedValue(mockMetadata);

            const result = await tileVisibilityService.getAllTilesGroupedByGrid();

            expect(result[0].tiles).toHaveLength(1);
            expect(result[0].tiles[0].id).toBe('elem1');
        });

        test('should identify folder tiles with navigation actions', async () => {
            const mockGrids = [
                {
                    id: 'parent-grid',
                    label: { en: 'Parent' },
                    gridElements: [
                        {
                            id: 'folder1',
                            type: 'ELEMENT_TYPE_NORMAL',
                            label: { en: 'Folder' },
                            image: { url: 'folder.png' },
                            actions: [
                                { modelName: 'GridActionNavigate', navType: 'TO_GRID', toGridId: 'child-grid' }
                            ]
                        }
                    ]
                },
                {
                    id: 'child-grid',
                    label: { en: 'Child' },
                    gridElements: [
                        { id: 'child1', type: 'ELEMENT_TYPE_NORMAL', label: { en: 'Child Item' }, image: { url: 'item.png' }, hidden: false }
                    ]
                }
            ];
            const mockMetadata = { globalGridId: 'global' };

            dataService.getGrids.mockResolvedValue(mockGrids);
            dataService.getMetadata.mockResolvedValue(mockMetadata);

            const result = await tileVisibilityService.getAllTilesGroupedByGrid();

            const parentResult = result.find(r => r.grid.id === 'parent-grid');
            expect(parentResult.tiles[0].isFolder).toBe(true);
            expect(parentResult.tiles[0].navGridId).toBe('child-grid');
            expect(parentResult.tiles[0].visibleChildCount).toBe(1);
        });

        test('should return empty array when no valid tiles', async () => {
            const mockGrids = [
                {
                    id: 'grid1',
                    label: { en: 'Empty Grid' },
                    gridElements: []
                }
            ];
            const mockMetadata = { globalGridId: 'global' };

            dataService.getGrids.mockResolvedValue(mockGrids);
            dataService.getMetadata.mockResolvedValue(mockMetadata);

            const result = await tileVisibilityService.getAllTilesGroupedByGrid();

            expect(result).toHaveLength(0);
        });

        test('should set allVisible flag correctly', async () => {
            const mockGrids = [
                {
                    id: 'grid1',
                    label: { en: 'All Visible' },
                    gridElements: [
                        { id: 'elem1', type: 'ELEMENT_TYPE_NORMAL', label: { en: 'A' }, image: { url: 'a.png' }, hidden: false },
                        { id: 'elem2', type: 'ELEMENT_TYPE_NORMAL', label: { en: 'B' }, image: { url: 'b.png' }, hidden: false }
                    ]
                }
            ];
            const mockMetadata = { globalGridId: 'global' };

            dataService.getGrids.mockResolvedValue(mockGrids);
            dataService.getMetadata.mockResolvedValue(mockMetadata);

            const result = await tileVisibilityService.getAllTilesGroupedByGrid();

            expect(result[0].allVisible).toBe(true);
            expect(result[0].allHidden).toBe(false);
        });

        test('should set allHidden flag correctly', async () => {
            const mockGrids = [
                {
                    id: 'grid1',
                    label: { en: 'All Hidden' },
                    gridElements: [
                        { id: 'elem1', type: 'ELEMENT_TYPE_NORMAL', label: { en: 'A' }, image: { url: 'a.png' }, hidden: true },
                        { id: 'elem2', type: 'ELEMENT_TYPE_NORMAL', label: { en: 'B' }, image: { url: 'b.png' }, hidden: true }
                    ]
                }
            ];
            const mockMetadata = { globalGridId: 'global' };

            dataService.getGrids.mockResolvedValue(mockGrids);
            dataService.getMetadata.mockResolvedValue(mockMetadata);

            const result = await tileVisibilityService.getAllTilesGroupedByGrid();

            expect(result[0].allVisible).toBe(false);
            expect(result[0].allHidden).toBe(true);
        });
    });

    describe('setTileVisibility', () => {
        test('should set tile as hidden', async () => {
            const mockGrid = {
                id: 'grid1',
                gridElements: [
                    { id: 'elem1', type: 'ELEMENT_TYPE_NORMAL', hidden: false }
                ]
            };

            dataService.getGrid.mockResolvedValue(mockGrid);
            dataService.getGrids.mockResolvedValue([mockGrid]);
            dataService.getMetadata.mockResolvedValue({ globalGridId: 'global' });
            gridUtil.getGraphList.mockReturnValue([]);

            await tileVisibilityService.setTileVisibility('grid1', 'elem1', true);

            expect(mockGrid.gridElements[0].hidden).toBe(true);
            expect(dataService.saveGrid).toHaveBeenCalledWith(mockGrid);
        });

        test('should set tile as visible', async () => {
            const mockGrid = {
                id: 'grid1',
                gridElements: [
                    { id: 'elem1', type: 'ELEMENT_TYPE_NORMAL', hidden: true }
                ]
            };

            dataService.getGrid.mockResolvedValue(mockGrid);
            dataService.getGrids.mockResolvedValue([mockGrid]);
            dataService.getMetadata.mockResolvedValue({ globalGridId: 'global' });

            await tileVisibilityService.setTileVisibility('grid1', 'elem1', false);

            expect(mockGrid.gridElements[0].hidden).toBe(false);
            expect(dataService.saveGrid).toHaveBeenCalledWith(mockGrid);
        });

        test('should return early if grid not found', async () => {
            dataService.getGrid.mockResolvedValue(null);

            await tileVisibilityService.setTileVisibility('nonexistent', 'elem1', true);

            expect(dataService.saveGrid).not.toHaveBeenCalled();
        });

        test('should return early if element not found', async () => {
            const mockGrid = {
                id: 'grid1',
                gridElements: []
            };

            dataService.getGrid.mockResolvedValue(mockGrid);

            await tileVisibilityService.setTileVisibility('grid1', 'nonexistent', true);

            expect(dataService.saveGrid).not.toHaveBeenCalled();
        });

        test('should trigger group dissolution check when hiding', async () => {
            const parentGrid = {
                id: 'parent',
                gridElements: [
                    {
                        id: 'folder',
                        actions: [{ modelName: 'GridActionNavigate', navType: 'TO_GRID', toGridId: 'child' }]
                    }
                ]
            };
            const childGrid = {
                id: 'child',
                gridElements: [
                    { id: 'elem1', type: 'ELEMENT_TYPE_NORMAL', hidden: false },
                    { id: 'elem2', type: 'ELEMENT_TYPE_NORMAL', hidden: false }
                ]
            };

            dataService.getGrid
                .mockResolvedValueOnce(childGrid)  // Initial get for setTileVisibility
                .mockResolvedValueOnce(parentGrid) // For dissolution check
                .mockResolvedValueOnce(childGrid); // For checking visible count

            dataService.getGrids.mockResolvedValue([parentGrid, childGrid]);
            dataService.getMetadata.mockResolvedValue({ globalGridId: 'global' });

            gridUtil.getGraphList.mockReturnValue([
                { grid: { id: 'child' }, parents: [{ grid: { id: 'parent' } }] }
            ]);

            await tileVisibilityService.setTileVisibility('child', 'elem1', true);

            expect(dataService.saveGrid).toHaveBeenCalled();
        });
    });

    describe('setGroupVisibility', () => {
        test('should hide all tiles in a grid', async () => {
            const mockGrid = {
                id: 'grid1',
                gridElements: [
                    { id: 'elem1', type: 'ELEMENT_TYPE_NORMAL', label: { en: 'A' }, image: { url: 'a.png' }, hidden: false },
                    { id: 'elem2', type: 'ELEMENT_TYPE_NORMAL', label: { en: 'B' }, image: { url: 'b.png' }, hidden: false }
                ]
            };

            dataService.getGrid.mockResolvedValue(mockGrid);
            dataService.getGrids.mockResolvedValue([mockGrid]);
            dataService.getMetadata.mockResolvedValue({ globalGridId: 'global' });

            await tileVisibilityService.setGroupVisibility('grid1', true);

            expect(mockGrid.gridElements[0].hidden).toBe(true);
            expect(mockGrid.gridElements[1].hidden).toBe(true);
            expect(dataService.saveGrid).toHaveBeenCalledWith(mockGrid);
        });

        test('should show all tiles in a grid', async () => {
            const mockGrid = {
                id: 'grid1',
                gridElements: [
                    { id: 'elem1', type: 'ELEMENT_TYPE_NORMAL', label: { en: 'A' }, image: { url: 'a.png' }, hidden: true },
                    { id: 'elem2', type: 'ELEMENT_TYPE_NORMAL', label: { en: 'B' }, image: { url: 'b.png' }, hidden: true }
                ]
            };

            dataService.getGrid.mockResolvedValue(mockGrid);
            dataService.getGrids.mockResolvedValue([mockGrid]);
            dataService.getMetadata.mockResolvedValue({ globalGridId: 'global' });

            await tileVisibilityService.setGroupVisibility('grid1', false);

            expect(mockGrid.gridElements[0].hidden).toBe(false);
            expect(mockGrid.gridElements[1].hidden).toBe(false);
            expect(dataService.saveGrid).toHaveBeenCalledWith(mockGrid);
        });

        test('should skip non-normal elements', async () => {
            const mockGrid = {
                id: 'grid1',
                gridElements: [
                    { id: 'elem1', type: 'ELEMENT_TYPE_NORMAL', label: { en: 'A' }, image: { url: 'a.png' }, hidden: false },
                    { id: 'elem2', type: 'ELEMENT_TYPE_COLLECT', label: { en: 'Collect' }, hidden: false }
                ]
            };

            dataService.getGrid.mockResolvedValue(mockGrid);
            dataService.getGrids.mockResolvedValue([mockGrid]);
            dataService.getMetadata.mockResolvedValue({ globalGridId: 'global' });

            await tileVisibilityService.setGroupVisibility('grid1', true);

            expect(mockGrid.gridElements[0].hidden).toBe(true);
            expect(mockGrid.gridElements[1].hidden).toBe(false); // Collect element unchanged
        });

        test('should skip empty tiles', async () => {
            const mockGrid = {
                id: 'grid1',
                gridElements: [
                    { id: 'elem1', type: 'ELEMENT_TYPE_NORMAL', label: { en: 'A' }, image: { url: 'a.png' }, hidden: false },
                    { id: 'elem2', type: 'ELEMENT_TYPE_NORMAL', label: { en: '' }, image: null, hidden: false }
                ]
            };

            dataService.getGrid.mockResolvedValue(mockGrid);
            dataService.getGrids.mockResolvedValue([mockGrid]);
            dataService.getMetadata.mockResolvedValue({ globalGridId: 'global' });

            await tileVisibilityService.setGroupVisibility('grid1', true);

            expect(mockGrid.gridElements[0].hidden).toBe(true);
            expect(mockGrid.gridElements[1].hidden).toBe(false); // Empty tile unchanged
        });

        test('should return early if grid not found', async () => {
            dataService.getGrid.mockResolvedValue(null);

            await tileVisibilityService.setGroupVisibility('nonexistent', true);

            expect(dataService.saveGrid).not.toHaveBeenCalled();
        });

        test('should not save if no changes made', async () => {
            const mockGrid = {
                id: 'grid1',
                gridElements: [
                    { id: 'elem1', type: 'ELEMENT_TYPE_NORMAL', label: { en: 'A' }, image: { url: 'a.png' }, hidden: true }
                ]
            };

            dataService.getGrid.mockResolvedValue(mockGrid);

            await tileVisibilityService.setGroupVisibility('grid1', true);

            // Already hidden, no change needed
            expect(dataService.saveGrid).not.toHaveBeenCalled();
        });
    });

    describe('keyboard grid detection', () => {
        test('should detect keyboard grid by character ratio', async () => {
            const mockGrids = [
                {
                    id: 'keyboard',
                    label: { en: 'Keyboard' },
                    gridElements: [
                        { id: 'a', type: 'ELEMENT_TYPE_NORMAL', label: { en: 'A' }, image: { url: 'a.png' } },
                        { id: 'b', type: 'ELEMENT_TYPE_NORMAL', label: { en: 'B' }, image: { url: 'b.png' } },
                        { id: 'c', type: 'ELEMENT_TYPE_NORMAL', label: { en: 'C' }, image: { url: 'c.png' } },
                        { id: 'd', type: 'ELEMENT_TYPE_NORMAL', label: { en: 'D' }, image: { url: 'd.png' } },
                        { id: 'e', type: 'ELEMENT_TYPE_NORMAL', label: { en: 'E' }, image: { url: 'e.png' } }
                    ]
                }
            ];
            const mockMetadata = { globalGridId: 'global' };

            dataService.getGrids.mockResolvedValue(mockGrids);
            dataService.getMetadata.mockResolvedValue(mockMetadata);

            const result = await tileVisibilityService.getAllTilesGroupedByGrid();

            // All 5 elements are single char, so it's a keyboard grid and should be excluded
            expect(result).toHaveLength(0);
        });

        test('should not exclude grid with mixed character length labels', async () => {
            const mockGrids = [
                {
                    id: 'mixed',
                    label: { en: 'Mixed' },
                    gridElements: [
                        { id: 'a', type: 'ELEMENT_TYPE_NORMAL', label: { en: 'A' }, image: { url: 'a.png' } },
                        { id: 'hello', type: 'ELEMENT_TYPE_NORMAL', label: { en: 'Hello' }, image: { url: 'hello.png' } },
                        { id: 'world', type: 'ELEMENT_TYPE_NORMAL', label: { en: 'World' }, image: { url: 'world.png' } },
                        { id: 'test', type: 'ELEMENT_TYPE_NORMAL', label: { en: 'Testing' }, image: { url: 'test.png' } },
                        { id: 'more', type: 'ELEMENT_TYPE_NORMAL', label: { en: 'More Text' }, image: { url: 'more.png' } }
                    ]
                }
            ];
            const mockMetadata = { globalGridId: 'global' };

            dataService.getGrids.mockResolvedValue(mockGrids);
            dataService.getMetadata.mockResolvedValue(mockMetadata);

            const result = await tileVisibilityService.getAllTilesGroupedByGrid();

            // Only 1/5 is single char (20% < 40%), so not a keyboard
            expect(result).toHaveLength(1);
        });
    });

    describe('tile with image detection', () => {
        test('should recognize tile with url image as non-empty', async () => {
            const mockGrids = [
                {
                    id: 'grid1',
                    label: { en: 'Grid' },
                    gridElements: [
                        { id: 'elem1', type: 'ELEMENT_TYPE_NORMAL', label: { en: '' }, image: { url: 'image.png' } }
                    ]
                }
            ];
            const mockMetadata = { globalGridId: 'global' };

            dataService.getGrids.mockResolvedValue(mockGrids);
            dataService.getMetadata.mockResolvedValue(mockMetadata);

            const result = await tileVisibilityService.getAllTilesGroupedByGrid();

            // Has image, even though label is empty
            expect(result[0].tiles).toHaveLength(1);
        });

        test('should recognize tile with data image as non-empty', async () => {
            const mockGrids = [
                {
                    id: 'grid1',
                    label: { en: 'Grid' },
                    gridElements: [
                        { id: 'elem1', type: 'ELEMENT_TYPE_NORMAL', label: { en: '' }, image: { data: 'data:image/png;base64,...' } }
                    ]
                }
            ];
            const mockMetadata = { globalGridId: 'global' };

            dataService.getGrids.mockResolvedValue(mockGrids);
            dataService.getMetadata.mockResolvedValue(mockMetadata);

            const result = await tileVisibilityService.getAllTilesGroupedByGrid();

            expect(result[0].tiles).toHaveLength(1);
        });

        test('should treat _removed_ data as no image', async () => {
            const mockGrids = [
                {
                    id: 'grid1',
                    label: { en: 'Grid' },
                    gridElements: [
                        { id: 'elem1', type: 'ELEMENT_TYPE_NORMAL', label: { en: '' }, image: { data: '_removed_' } }
                    ]
                }
            ];
            const mockMetadata = { globalGridId: 'global' };

            dataService.getGrids.mockResolvedValue(mockGrids);
            dataService.getMetadata.mockResolvedValue(mockMetadata);

            const result = await tileVisibilityService.getAllTilesGroupedByGrid();

            // Empty label and removed image = empty tile
            expect(result).toHaveLength(0);
        });
    });
});
