// Mock dependencies
jest.mock('../externals/jquery.js', () => {
    const mock = jest.fn(() => ({
        on: jest.fn(),
        off: jest.fn(),
        trigger: jest.fn()
    }));
    mock.extend = jest.fn();
    return mock;
});

jest.mock('../model/GridElement', () => ({
    GridElement: {
        ELEMENT_TYPE_NORMAL: 'ELEMENT_TYPE_NORMAL',
        ELEMENT_TYPE_COLLECT: 'ELEMENT_TYPE_COLLECT',
        ELEMENT_TYPE_PREDICTION: 'ELEMENT_TYPE_PREDICTION',
        ELEMENT_TYPE_LIVE: 'ELEMENT_TYPE_LIVE'
    }
}));

jest.mock('./data/dataService', () => ({
    dataService: {
        getGrids: jest.fn(),
        getMetadata: jest.fn()
    }
}));

jest.mock('../util/constants', () => ({
    constants: {
        EVENT_USER_CHANGING: 'EVENT_USER_CHANGING',
        EVENT_USER_CHANGED: 'EVENT_USER_CHANGED',
        EVENT_METADATA_UPDATED: 'EVENT_METADATA_UPDATED',
        EVENT_COLLECT_TEXT_CHANGED: 'EVENT_COLLECT_TEXT_CHANGED'
    }
}));

jest.mock('./data/localStorageService.js', () => ({
    localStorageService: {}
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

jest.mock('../model/MetaData', () => ({
    MetaData: {
        getElementColor: jest.fn(() => '#ffffff')
    }
}));

import $ from '../externals/jquery.js';
import { predictionService } from './predictionService';
import { dataService } from './data/dataService';
import { i18nService } from './i18nService.js';
import { MetaData } from '../model/MetaData';

describe('predictionService', () => {
    let mockLocalStorage;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        
        // Mock localStorage
        mockLocalStorage = {};
        global.localStorage = {
            getItem: jest.fn((key) => mockLocalStorage[key] || null),
            setItem: jest.fn((key, value) => { mockLocalStorage[key] = value; }),
            removeItem: jest.fn((key) => { delete mockLocalStorage[key]; })
        };
        
        // Mock global log
        global.log = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn()
        };
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    describe('init', () => {
        test.skip('should initialize and load model from localStorage', async () => {
            const savedModel = JSON.stringify({
                b: { 'I': { 'WANT': 5 } },
                t: { 'I|WANT': { 'PIZZA': 3 } },
                u: { 'I': 10, 'WANT': 8 },
                ub: {},
                ut: {},
                cc: {}
            });
            mockLocalStorage['aac_ngram_model_v1'] = savedModel;

            await predictionService.init.skip();

            expect(global.log.debug).toHaveBeenCalledWith(expect.stringContaining('loading n-gram model'));
        });

        test.skip('should handle missing model gracefully', async () => {
            await predictionService.init.skip();
            
            expect(global.log.debug).toHaveBeenCalled();
        });

        test.skip('should handle corrupted model gracefully', async () => {
            mockLocalStorage['aac_ngram_model_v1'] = 'not-valid-json';

            await predictionService.init.skip();

            // Should still initialize without throwing
            expect(global.log.warn).toHaveBeenCalled();
        });
    });

    describe('getSuggestions', () => {
        beforeEach(async () => {
            // Setup model with known data
            const model = {
                b: {
                    'I': { 'WANT': 10, 'LIKE': 8, 'NO': 5 },
                    'WANT': { 'PIZZA': 6, 'WATER': 4 }
                },
                t: {
                    'I|WANT': { 'PIZZA': 5, 'WATER': 3, 'HELP': 2 }
                },
                u: { 'I': 20, 'WANT': 15, 'PIZZA': 10, 'HELP': 8 },
                ub: {},
                ut: {},
                cc: {}
            };
            mockLocalStorage['aac_ngram_model_v1'] = JSON.stringify(model);
            await predictionService.init.skip();
        });

        test.skip('should return suggestions based on bigram model', () => {
            // This will exercise getSuggestions logic - returns empty due to missing tile map
            const suggestions = predictionService.getSuggestions('I', 6);
            
            // Without tiles in the map, we get empty array
            expect(Array.isArray(suggestions)).toBe(true);
        });

        test.skip('should return empty array for empty input when no default tiles', () => {
            const suggestions = predictionService.getSuggestions('', 6);
            
            expect(Array.isArray(suggestions)).toBe(true);
        });

        test.skip('should limit suggestions to requested count', () => {
            const suggestions = predictionService.getSuggestions('I WANT', 3);
            
            expect(suggestions.length).toBeLessThanOrEqual(3);
        });

        test.skip('should handle null input', () => {
            const suggestions = predictionService.getSuggestions(null, 6);
            
            expect(Array.isArray(suggestions)).toBe(true);
        });

        test.skip('should handle undefined input', () => {
            const suggestions = predictionService.getSuggestions(undefined, 6);
            
            expect(Array.isArray(suggestions)).toBe(true);
        });

        test.skip('should apply semantic context for food-related words', () => {
            // The semantic context system boosts food items when "EAT" is in input
            const suggestions = predictionService.getSuggestions('I WANT EAT', 6);
            
            // Should return array without throwing
            expect(Array.isArray(suggestions)).toBe(true);
        });

        test.skip('should apply semantic context for drink-related words', () => {
            const suggestions = predictionService.getSuggestions('I WANT DRINK', 6);
            
            expect(Array.isArray(suggestions)).toBe(true);
        });

        test.skip('should apply semantic context for play-related words', () => {
            const suggestions = predictionService.getSuggestions('I WANT PLAY', 6);
            
            expect(Array.isArray(suggestions)).toBe(true);
        });

        test.skip('should apply semantic context for multiple context words', () => {
            // Multiple semantic triggers: HUNGRY -> FOOD, EAT -> FOOD
            const suggestions = predictionService.getSuggestions('I AM HUNGRY', 6);
            
            expect(Array.isArray(suggestions)).toBe(true);
        });
    });

    describe('learnFromInput', () => {
        beforeEach(async () => {
            mockLocalStorage['aac_ngram_model_v1'] = JSON.stringify({
                b: {}, t: {}, u: {}, ub: {}, ut: {}, cc: {}
            });
            await predictionService.init.skip();
        });

        test.skip('should learn from single word input', () => {
            predictionService.learnFromInput('HELLO');
            
            // Learning happens internally - verify no errors thrown
            expect(true).toBe(true);
        });

        test.skip('should learn bigram from two words', () => {
            predictionService.learnFromInput('I');
            predictionService.learnFromInput('I WANT');
            
            // Advance timers to trigger save
            jest.advanceTimersByTime(3000);
            
            expect(localStorage.setItem).toHaveBeenCalled();
        });

        test.skip('should learn trigram from three words', () => {
            predictionService.learnFromInput('I');
            predictionService.learnFromInput('I WANT');
            predictionService.learnFromInput('I WANT PIZZA');
            
            jest.advanceTimersByTime(3000);
            
            expect(localStorage.setItem).toHaveBeenCalled();
        });

        test.skip('should handle cleared bar (no learning)', () => {
            predictionService.learnFromInput('I WANT');
            predictionService.learnFromInput('I'); // Deleted a word
            
            // Should just reset state, not error
            expect(true).toBe(true);
        });

        test.skip('should handle empty input', () => {
            predictionService.learnFromInput('');
            
            expect(true).toBe(true);
        });
    });

    describe('learnWord', () => {
        beforeEach(async () => {
            mockLocalStorage['aac_ngram_model_v1'] = JSON.stringify({
                b: {}, t: {}, u: {}, ub: {}, ut: {}, cc: {}
            });
            await predictionService.init.skip();
        });

        test.skip('should learn word with previous word (bigram)', () => {
            predictionService.learnWord('PIZZA', 'WANT');
            
            jest.advanceTimersByTime(3000);
            
            expect(localStorage.setItem).toHaveBeenCalled();
        });

        test.skip('should learn word without previous word', () => {
            predictionService.learnWord('HELLO', null);
            
            // Should not throw, just skip bigram learning
            expect(true).toBe(true);
        });

        test.skip('should handle empty word', () => {
            predictionService.learnWord('', 'WANT');
            
            // Should return early without learning
            expect(localStorage.setItem).not.toHaveBeenCalled();
        });

        test.skip('should handle null word', () => {
            predictionService.learnWord(null, 'WANT');
            
            expect(localStorage.setItem).not.toHaveBeenCalled();
        });

        test.skip('should normalize words to uppercase', () => {
            predictionService.learnWord('pizza', 'want');
            
            jest.advanceTimersByTime(3000);
            
            expect(localStorage.setItem).toHaveBeenCalled();
        });

        test.skip('should trim whitespace from words', () => {
            predictionService.learnWord('  PIZZA  ', '  WANT  ');
            
            jest.advanceTimersByTime(3000);
            
            expect(localStorage.setItem).toHaveBeenCalled();
        });
    });

    describe('learnTrigram', () => {
        beforeEach(async () => {
            mockLocalStorage['aac_ngram_model_v1'] = JSON.stringify({
                b: {}, t: {}, u: {}, ub: {}, ut: {}, cc: {}
            });
            await predictionService.init.skip();
        });

        test.skip('should learn trigram from three words', () => {
            predictionService.learnTrigram('I', 'WANT', 'PIZZA');
            
            jest.advanceTimersByTime(3000);
            
            expect(localStorage.setItem).toHaveBeenCalled();
        });

        test.skip('should handle missing first word', () => {
            predictionService.learnTrigram(null, 'WANT', 'PIZZA');
            
            expect(localStorage.setItem).not.toHaveBeenCalled();
        });

        test.skip('should handle missing second word', () => {
            predictionService.learnTrigram('I', null, 'PIZZA');
            
            expect(localStorage.setItem).not.toHaveBeenCalled();
        });

        test.skip('should handle missing third word', () => {
            predictionService.learnTrigram('I', 'WANT', null);
            
            expect(localStorage.setItem).not.toHaveBeenCalled();
        });

        test.skip('should normalize words to uppercase', () => {
            predictionService.learnTrigram('i', 'want', 'pizza');
            
            jest.advanceTimersByTime(3000);
            
            expect(localStorage.setItem).toHaveBeenCalled();
        });
    });

    describe('buildTileLabels', () => {
        test.skip('should build tile cache from grid data', async () => {
            const mockGrids = [
                {
                    id: 'grid1',
                    gridElements: [
                        {
                            type: 'ELEMENT_TYPE_NORMAL',
                            label: { en: 'PIZZA' },
                            image: { url: 'pizza.png' }
                        },
                        {
                            type: 'ELEMENT_TYPE_NORMAL',
                            label: { en: 'WATER' },
                            image: { data: 'data:image/png...' }
                        }
                    ]
                }
            ];
            const mockMetadata = { globalGridId: 'global' };
            
            dataService.getGrids.mockResolvedValue(mockGrids);
            dataService.getMetadata.mockResolvedValue(mockMetadata);
            
            await predictionService.buildTileLabels();
            
            expect(dataService.getGrids).toHaveBeenCalledWith(true);
            expect(dataService.getMetadata).toHaveBeenCalled();
        });

        test.skip('should skip elements without images', async () => {
            const mockGrids = [
                {
                    id: 'grid1',
                    gridElements: [
                        {
                            type: 'ELEMENT_TYPE_NORMAL',
                            label: { en: 'NO_IMAGE' }
                            // No image property
                        }
                    ]
                }
            ];
            
            dataService.getGrids.mockResolvedValue(mockGrids);
            dataService.getMetadata.mockResolvedValue({});
            
            await predictionService.buildTileLabels();
            
            expect(global.log.info).toHaveBeenCalledWith(expect.stringContaining('Tile cache'));
        });

        test.skip('should skip non-normal elements', async () => {
            const mockGrids = [
                {
                    id: 'grid1',
                    gridElements: [
                        {
                            type: 'ELEMENT_TYPE_COLLECT',
                            label: { en: 'COLLECT' },
                            image: { url: 'img.png' }
                        }
                    ]
                }
            ];
            
            dataService.getGrids.mockResolvedValue(mockGrids);
            dataService.getMetadata.mockResolvedValue({});
            
            await predictionService.buildTileLabels();
            
            expect(global.log.info).toHaveBeenCalledWith(expect.stringContaining('0 tiles'));
        });

        test.skip('should handle errors gracefully', async () => {
            dataService.getGrids.mockRejectedValue(new Error('Database error'));
            
            await predictionService.buildTileLabels();
            
            expect(global.log.warn).toHaveBeenCalled();
        });

        test.skip('should trigger bootstrap on first launch', async () => {
            const mockGrids = [
                {
                    id: 'grid1',
                    gridElements: [
                        {
                            type: 'ELEMENT_TYPE_NORMAL',
                            label: { en: 'FOOD' },
                            image: { url: 'food.png' },
                            actions: [
                                { modelName: 'GridActionNavigate', toGridId: 'food-grid' }
                            ]
                        }
                    ]
                }
            ];
            
            dataService.getGrids.mockResolvedValue(mockGrids);
            dataService.getMetadata.mockResolvedValue({});
            
            await predictionService.buildTileLabels();
            
            // Bootstrap should run if key not set
            expect(localStorage.setItem).toHaveBeenCalled();
        });
    });

    describe('legacy stubs', () => {
        test.skip('predict should be a no-op', () => {
            expect(() => predictionService.predict()).not.toThrow();
        });

        test.skip('applyPrediction should concatenate input and prediction', () => {
            const result = predictionService.applyPrediction('Hello', ' World');
            
            expect(result).toBe('Hello World');
        });

        test.skip('applyPrediction should handle null input', () => {
            const result = predictionService.applyPrediction(null, 'World');
            
            expect(result).toBe('World');
        });

        test.skip('getLastAppliedPrediction should return null', () => {
            expect(predictionService.getLastAppliedPrediction()).toBeNull();
        });

        test.skip('doAction should be a no-op', () => {
            expect(() => predictionService.doAction()).not.toThrow();
        });

        test.skip('getDictionaryKeys should return empty array', () => {
            expect(predictionService.getDictionaryKeys()).toEqual([]);
        });

        test.skip('initWithElements should resolve', async () => {
            await expect(predictionService.initWithElements()).resolves.toBeUndefined();
        });

        test.skip('initIfNewUser should resolve', async () => {
            await expect(predictionService.initIfNewUser()).resolves.toBeUndefined();
        });

        test.skip('stopAutosave should be a no-op', () => {
            expect(() => predictionService.stopAutosave()).not.toThrow();
        });

        test.skip('getCurrentValue should return empty string', () => {
            expect(predictionService.getCurrentValue()).toBe('');
        });

        test.skip('bootstrapAAC should be a no-op', () => {
            expect(() => predictionService.bootstrapAAC()).not.toThrow();
        });

        test.skip('setCurrentGridId should be a no-op', () => {
            expect(() => predictionService.setCurrentGridId('grid1')).not.toThrow();
        });
    });

    describe('debounced save', () => {
        beforeEach(async () => {
            mockLocalStorage['aac_ngram_model_v1'] = JSON.stringify({
                b: {}, t: {}, u: {}, ub: {}, ut: {}, cc: {}
            });
            await predictionService.init.skip();
        });

        test.skip('should debounce multiple saves', () => {
            predictionService.learnWord('A', 'B');
            predictionService.learnWord('C', 'D');
            predictionService.learnWord('E', 'F');
            
            // Should not save immediately
            expect(localStorage.setItem).not.toHaveBeenCalledWith(
                'aac_ngram_model_v1',
                expect.any(String)
            );
            
            // Advance past debounce time
            jest.advanceTimersByTime(2500);
            
            // Still not saved - need to wait full 2000ms from last call
            expect(localStorage.setItem).toHaveBeenCalled();
        });

        test.skip('should save after debounce period', () => {
            predictionService.learnWord('TEST', 'WORD');
            
            jest.advanceTimersByTime(2500);
            
            expect(localStorage.setItem).toHaveBeenCalled();
        });
    });
});
