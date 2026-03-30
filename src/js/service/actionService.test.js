/**
 * Tests for actionService.js
 * Tests action execution, predefined actions, and metadata fetching.
 */

// Mock all dependencies before imports
jest.mock('./httpService.js', () => ({
    httpService: {
        doAction: jest.fn(() => Promise.resolve({ success: true })),
    },
}));

jest.mock('./data/dataService', () => ({
    dataService: {
        getGrid: jest.fn(() => Promise.resolve({
            id: 'grid-1',
            gridElements: [{ id: 'elem-1', label: { en: 'Test' }, actions: [], type: 'ELEMENT_TYPE_NORMAL' }],
        })),
        getMetadata: jest.fn(() => Promise.resolve({
            toHomeAfterSelect: false,
            inputConfig: { globalMinPauseCollectSpeak: 0 },
        })),
    },
}));

jest.mock('./speechService', () => ({
    speechService: {
        speak: jest.fn(),
    },
}));

jest.mock('./collectElementService', () => ({
    collectElementService: {
        doCollectElementActions: jest.fn(),
        isCurrentGridKeyboard: jest.fn(() => false),
        addWordFormTagsToLast: jest.fn(),
        replaceLast: jest.fn(),
        fixateLastWordForm: jest.fn(),
    },
}));

jest.mock('./predictionService', () => ({
    predictionService: {
        doAction: jest.fn(),
        predict: jest.fn(),
        getLastAppliedPrediction: jest.fn(() => 'predicted'),
    },
}));

jest.mock('./../router', () => ({
    Router: {
        toMain: jest.fn(),
        toLastGrid: jest.fn(),
        toGrid: jest.fn(),
        toEditGrid: jest.fn(),
        isOnEditPage: jest.fn(() => false),
    },
}));

jest.mock('./../model/GridElement', () => ({
    GridElement: {
        ELEMENT_TYPE_PREDICTION: 'ELEMENT_TYPE_PREDICTION',
        ELEMENT_TYPE_NORMAL: 'ELEMENT_TYPE_NORMAL',
        ELEMENT_TYPE_LIVE: 'ELEMENT_TYPE_LIVE',
        getActionTypeModelNames: jest.fn(() => [
            'GridActionSpeak',
            'GridActionNavigate',
            'GridActionHTTP',
            'GridActionCollectElement',
            'GridActionWordForm',
        ]),
        getActionInstance: jest.fn((modelName) => {
            if (modelName === 'GridActionHTTP') {
                return { modelName: 'GridActionHTTP', url: '' };
            }
            return null;
        }),
    },
}));

jest.mock('../util/constants', () => ({
    constants: {
        IS_ENVIRONMENT_PROD: false,
        BOARDS_REPO_BASE_URL: 'https://example.com/',
        ELEMENT_EVENT_ID: 'ELEMENT_EVENT_ID',
        EVENT_USER_CHANGED: 'EVENT_USER_CHANGED',
        EVENT_METADATA_UPDATED: 'EVENT_METADATA_UPDATED',
    },
}));

jest.mock('./i18nService', () => ({
    i18nService: {
        getTranslation: jest.fn((label) => (typeof label === 'object' ? label.en || '' : label || '')),
        getContentLang: jest.fn(() => 'en'),
        setContentLanguage: jest.fn(() => Promise.resolve()),
        t: jest.fn((key) => key),
    },
}));

jest.mock('../model/GridActionNavigate.js', () => ({
    GridActionNavigate: {
        getModelName: jest.fn(() => 'GridActionNavigate'),
        NAV_TYPES: {
            TO_HOME: 'TO_HOME',
            TO_LAST: 'TO_LAST',
            OPEN_SEARCH: 'OPEN_SEARCH',
        },
    },
}));

jest.mock('../model/GridActionChangeLang.js', () => ({
    GridActionChangeLang: {
        getModelName: jest.fn(() => 'GridActionChangeLang'),
        LAST_LANG: 'LAST_LANG',
    },
}));

jest.mock('../externals/jquery.js', () => {
    const mockJQuery = jest.fn(() => mockJQuery);
    mockJQuery.trigger = jest.fn();
    mockJQuery.on = jest.fn();
    return mockJQuery;
});

jest.mock('../model/GridActionAudio.js', () => ({
    GridActionAudio: {
        getModelName: jest.fn(() => 'GridActionAudio'),
    },
}));

jest.mock('../model/GridActionSpeak.js', () => ({
    GridActionSpeak: {
        getModelName: jest.fn(() => 'GridActionSpeak'),
    },
}));

jest.mock('../model/GridActionSpeakCustom.js', () => ({
    GridActionSpeakCustom: {
        getModelName: jest.fn(() => 'GridActionSpeakCustom'),
    },
}));

jest.mock('../util/audioUtil.js', () => ({
    audioUtil: {
        stopAudio: jest.fn(),
        playAudio: jest.fn(),
    },
}));

jest.mock('../vue/mainVue.js', () => ({
    MainVue: {
        showSearchModal: jest.fn(),
    },
}));

jest.mock('./stateService.js', () => ({
    stateService: {
        getSpeakTextAllLangs: jest.fn(() => ({ en: 'Test' })),
        hasGlobalGridElement: jest.fn(() => false),
        resetWordForms: jest.fn(),
        addWordFormTags: jest.fn(),
        resetWordFormIds: jest.fn(),
        resetWordFormTags: jest.fn(),
        nextWordForm: jest.fn(() => 0),
        getWordFormObject: jest.fn(() => ({ value: 'test', tags: ['plural'] })),
    },
}));

jest.mock('../model/GridActionWordForm.js', () => ({
    GridActionWordForm: {
        getModelName: jest.fn(() => 'GridActionWordForm'),
        WORDFORM_MODE_CHANGE_ELEMENTS: 'WORDFORM_MODE_CHANGE_ELEMENTS',
        WORDFORM_MODE_CHANGE_BAR: 'WORDFORM_MODE_CHANGE_BAR',
        WORDFORM_MODE_CHANGE_EVERYWHERE: 'WORDFORM_MODE_CHANGE_EVERYWHERE',
        WORDFORM_MODE_NEXT_FORM: 'WORDFORM_MODE_NEXT_FORM',
        WORDFORM_MODE_RESET_FORMS: 'WORDFORM_MODE_RESET_FORMS',
    },
}));

jest.mock('./data/localStorageService.js', () => ({
    localStorageService: {
        getUserSettings: jest.fn(() => ({
            lastContentLang: 'en',
            voiceConfig: { preferredVoice: null },
        })),
        saveUserSettings: jest.fn(),
        get: jest.fn(),
        saveJSON: jest.fn(),
        remove: jest.fn(),
        KEY_CURRENT_TOGGLE_LEVEL: 'KEY_CURRENT_TOGGLE_LEVEL',
    },
}));

jest.mock('./systemActionService', () => ({
    systemActionService: {
        doAction: jest.fn(),
    },
}));

jest.mock('../model/GridActionSystem', () => ({
    GridActionSystem: {
        getModelName: jest.fn(() => 'GridActionSystem'),
    },
}));

jest.mock('../util/util', () => ({
    util: {
        isString: jest.fn((val) => typeof val === 'string'),
    },
}));

jest.mock('./liveElementService', () => ({
    liveElementService: {
        updateOnce: jest.fn(),
        getLastValue: jest.fn(() => 'liveValue'),
        replacePlaceholder: jest.fn((elem, text) => text),
    },
}));

jest.mock('../model/GridElementLive', () => ({
    GridElementLive: {
        MODE_APP_STATE: 'MODE_APP_STATE',
    },
}));

jest.mock('../model/GridActionVocabLevelToggle', () => ({
    GridActionVocabLevelToggle: {
        getModelName: jest.fn(() => 'GridActionVocabLevelToggle'),
    },
}));

jest.mock('../model/GridActionCollectElement', () => ({
    GridActionCollectElement: {
        getModelName: jest.fn(() => 'GridActionCollectElement'),
    },
}));

// Global mocks
global.log = {
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};

global.fetch = jest.fn();

import { actionService } from './actionService.js';
import { dataService } from './data/dataService';
import { httpService } from './httpService.js';
import { speechService } from './speechService';
import { predictionService } from './predictionService';
import { Router } from './../router';
import { collectElementService } from './collectElementService';
import { stateService } from './stateService.js';
import { audioUtil } from '../util/audioUtil.js';
import { systemActionService } from './systemActionService';
import { MainVue } from '../vue/mainVue.js';
import { localStorageService } from './data/localStorageService.js';
import { i18nService } from './i18nService';

describe('actionService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        global.fetch.mockReset();
        // Reset window.open mock
        global.window = global.window || {};
        global.window.open = jest.fn(() => ({ close: jest.fn() }));
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('doAction', () => {
        test('returns early when gridIdOrObject is null', async () => {
            await actionService.doAction(null, 'elem-1');
            expect(dataService.getGrid).not.toHaveBeenCalled();
        });

        test('returns early when gridElementId is null', async () => {
            await actionService.doAction('grid-1', null);
            expect(dataService.getGrid).not.toHaveBeenCalled();
        });

        test('fetches grid data when given grid ID string', async () => {
            dataService.getGrid.mockResolvedValueOnce({
                id: 'grid-1',
                gridElements: [
                    { id: 'elem-1', label: { en: 'Test' }, actions: [], type: 'ELEMENT_TYPE_NORMAL' },
                ],
            });

            await actionService.doAction('grid-1', 'elem-1');

            expect(dataService.getGrid).toHaveBeenCalledWith('grid-1', false, true);
        });

        test('uses grid object directly when provided', async () => {
            const gridObject = {
                id: 'grid-1',
                gridElements: [
                    { id: 'elem-1', label: { en: 'Test' }, actions: [], type: 'ELEMENT_TYPE_NORMAL' },
                ],
            };

            await actionService.doAction(gridObject, 'elem-1');

            expect(dataService.getGrid).not.toHaveBeenCalled();
        });

        test('handles prediction element type', async () => {
            const gridObject = {
                id: 'grid-1',
                gridElements: [
                    { id: 'elem-pred', label: { en: 'Prediction' }, actions: [], type: 'ELEMENT_TYPE_PREDICTION' },
                ],
            };

            await actionService.doAction(gridObject, 'elem-pred');

            expect(predictionService.doAction).toHaveBeenCalledWith('elem-pred');
        });
    });

    describe('testAction', () => {
        test('executes single action on element', async () => {
            const gridElement = {
                id: 'elem-1',
                label: { en: 'Test' },
                actions: [],
            };
            const action = { modelName: 'GridActionSpeak' };
            const gridData = { id: 'grid-1' };

            await actionService.testAction(gridElement, action, gridData);

            expect(speechService.speak).toHaveBeenCalled();
        });

        test('handles HTTP action', async () => {
            const gridElement = { id: 'elem-1', label: { en: 'Test' } };
            const action = { modelName: 'GridActionHTTP', url: 'https://test.com' };

            await actionService.testAction(gridElement, action, {});

            expect(httpService.doAction).toHaveBeenCalledWith(action);
        });

        test('handles navigate to home action', async () => {
            const gridElement = { id: 'elem-1', label: { en: 'Test' } };
            const action = { modelName: 'GridActionNavigate', navType: 'TO_HOME' };

            await actionService.testAction(gridElement, action, {});

            expect(Router.toMain).toHaveBeenCalled();
        });

        test('handles navigate to last action', async () => {
            const gridElement = { id: 'elem-1', label: { en: 'Test' } };
            const action = { modelName: 'GridActionNavigate', navType: 'TO_LAST' };

            await actionService.testAction(gridElement, action, {});

            expect(Router.toLastGrid).toHaveBeenCalled();
        });

        test('handles navigate to search action', async () => {
            const gridElement = { id: 'elem-1', label: { en: 'Test' } };
            const action = { modelName: 'GridActionNavigate', navType: 'OPEN_SEARCH' };

            await actionService.testAction(gridElement, action, {});

            expect(MainVue.showSearchModal).toHaveBeenCalledWith(action);
        });

        test('handles audio action with base64 data', async () => {
            const gridElement = { id: 'elem-1', label: { en: 'Test' } };
            const action = { modelName: 'GridActionAudio', dataBase64: 'base64audiodata' };

            await actionService.testAction(gridElement, action, {});

            expect(audioUtil.stopAudio).toHaveBeenCalled();
            expect(audioUtil.playAudio).toHaveBeenCalledWith('base64audiodata');
        });

        test('handles predict action', async () => {
            const gridElement = { id: 'elem-1', label: { en: 'Test' } };
            const action = { modelName: 'GridActionPredict', dictionaryKey: 'default' };

            await actionService.testAction(gridElement, action, {});

            expect(predictionService.predict).toHaveBeenCalled();
        });

        test('handles collect element action', async () => {
            const gridElement = { id: 'elem-1', label: { en: 'Test' } };
            const action = { modelName: 'GridActionCollectElement', action: 'COLLECT_ACTION_CLEAR' };

            await actionService.testAction(gridElement, action, {});

            expect(collectElementService.doCollectElementActions).toHaveBeenCalled();
        });

        test('handles change lang action', async () => {
            const gridElement = { id: 'elem-1', label: { en: 'Test' } };
            const action = { modelName: 'GridActionChangeLang', language: 'de', voice: 'default' };

            await actionService.testAction(gridElement, action, {});

            expect(i18nService.setContentLanguage).toHaveBeenCalledWith('de');
        });

        test('handles change lang action with LAST_LANG', async () => {
            const gridElement = { id: 'elem-1', label: { en: 'Test' } };
            const action = { modelName: 'GridActionChangeLang', language: 'LAST_LANG', voice: 'default' };

            await actionService.testAction(gridElement, action, {});

            expect(i18nService.setContentLanguage).toHaveBeenCalled();
        });

        test('handles system action', async () => {
            const gridElement = { id: 'elem-1', label: { en: 'Test' } };
            const action = { modelName: 'GridActionSystem', action: 'SYSTEM_VOLUME_UP' };

            await actionService.testAction(gridElement, action, {});

            expect(systemActionService.doAction).toHaveBeenCalledWith(action);
        });

        test('handles speak custom action', async () => {
            const gridElement = { id: 'elem-1', label: { en: 'Test' } };
            const action = { modelName: 'GridActionSpeakCustom', speakText: { en: 'Custom text' } };

            await actionService.testAction(gridElement, action, {});

            expect(speechService.speak).toHaveBeenCalled();
        });

        test('handles vocab level toggle action', async () => {
            const gridElement = { id: 'elem-1', label: { en: 'Test' } };
            const action = { modelName: 'GridActionVocabLevelToggle' };

            localStorageService.get.mockReturnValueOnce(null);

            await actionService.testAction(gridElement, action, {});

            expect(localStorageService.saveJSON).toHaveBeenCalled();
        });

        test('handles vocab level toggle action when already toggled', async () => {
            const gridElement = { id: 'elem-1', label: { en: 'Test' } };
            const action = { modelName: 'GridActionVocabLevelToggle' };

            localStorageService.get.mockReturnValueOnce(true);

            await actionService.testAction(gridElement, action, {});

            expect(localStorageService.remove).toHaveBeenCalled();
        });
    });

    describe('word form actions', () => {
        test('handles WORDFORM_MODE_CHANGE_ELEMENTS', async () => {
            const gridElement = { id: 'elem-1', label: { en: 'Test' } };
            const action = {
                modelName: 'GridActionWordForm',
                type: 'WORDFORM_MODE_CHANGE_ELEMENTS',
                tags: ['plural'],
                toggle: false,
            };

            await actionService.testAction(gridElement, action, {});

            expect(stateService.resetWordFormIds).toHaveBeenCalled();
            expect(stateService.addWordFormTags).toHaveBeenCalledWith(['plural'], false);
        });

        test('handles WORDFORM_MODE_CHANGE_BAR', async () => {
            const gridElement = { id: 'elem-1', label: { en: 'Test' } };
            const action = {
                modelName: 'GridActionWordForm',
                type: 'WORDFORM_MODE_CHANGE_BAR',
                tags: ['plural'],
                toggle: true,
            };

            await actionService.testAction(gridElement, action, {});

            expect(collectElementService.addWordFormTagsToLast).toHaveBeenCalledWith(['plural'], true, 'elem-1');
        });

        test('handles WORDFORM_MODE_CHANGE_EVERYWHERE', async () => {
            const gridElement = { id: 'elem-1', label: { en: 'Test' } };
            const action = {
                modelName: 'GridActionWordForm',
                type: 'WORDFORM_MODE_CHANGE_EVERYWHERE',
                tags: ['past'],
                toggle: false,
            };

            await actionService.testAction(gridElement, action, {});

            expect(stateService.resetWordFormIds).toHaveBeenCalled();
            expect(stateService.addWordFormTags).toHaveBeenCalled();
            expect(collectElementService.addWordFormTagsToLast).toHaveBeenCalled();
        });

        test('handles WORDFORM_MODE_NEXT_FORM', async () => {
            const gridElement = { id: 'elem-1', label: { en: 'Test' } };
            const action = {
                modelName: 'GridActionWordForm',
                type: 'WORDFORM_MODE_NEXT_FORM',
            };

            await actionService.testAction(gridElement, action, {});

            expect(stateService.nextWordForm).toHaveBeenCalledWith('elem-1');
            expect(collectElementService.replaceLast).toHaveBeenCalled();
        });

        test('handles WORDFORM_MODE_RESET_FORMS', async () => {
            const gridElement = { id: 'elem-1', label: { en: 'Test' } };
            const action = {
                modelName: 'GridActionWordForm',
                type: 'WORDFORM_MODE_RESET_FORMS',
            };

            await actionService.testAction(gridElement, action, {});

            expect(stateService.resetWordForms).toHaveBeenCalled();
            expect(collectElementService.fixateLastWordForm).toHaveBeenCalled();
        });
    });

    describe('getPredefinedActionInfos', () => {
        test('fetches and returns predefined action infos', async () => {
            const mockActions = [
                { name: 'Action B', actionModelName: 'GridActionHTTP' },
                { name: 'Action A', actionModelName: 'GridActionHTTP' },
            ];
            global.fetch.mockResolvedValueOnce({
                json: () => Promise.resolve(mockActions),
            });

            const result = await actionService.getPredefinedActionInfos();

            expect(result).toHaveLength(2);
            // Should be sorted alphabetically
            expect(result[0].name).toBe('Action A');
            expect(result[1].name).toBe('Action B');
        });

        test('returns cached data on subsequent calls', async () => {
            // First call already cached from previous test, 
            // so just verify we can call it again
            const result = await actionService.getPredefinedActionInfos();
            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe('getPredefinedRequestInfos', () => {
        test('fetches and returns predefined request infos', async () => {
            const mockRequests = [{ name: 'Request 1' }];
            global.fetch.mockResolvedValueOnce({
                json: () => Promise.resolve(mockRequests),
            });

            const result = await actionService.getPredefinedRequestInfos();

            expect(result).toHaveLength(1);
        });

        test('returns cached data on subsequent calls', async () => {
            const result = await actionService.getPredefinedRequestInfos();
            expect(Array.isArray(result)).toBe(true);
        });
    });

    describe('action with open webpage', () => {
        test('handles open webpage action', async () => {
            const mockTab = { close: jest.fn() };
            global.window.open = jest.fn(() => mockTab);

            const gridElement = { id: 'elem-1', label: { en: 'Test' } };
            const action = {
                modelName: 'GridActionOpenWebpage',
                openURL: 'https://example.com',
                timeoutSeconds: 0,
            };

            await actionService.testAction(gridElement, action, {});

            expect(global.window.open).toHaveBeenCalledWith('https://example.com', '_blank');
        });

        test('handles open webpage action with timeout', async () => {
            jest.useFakeTimers();
            const mockTab = { close: jest.fn() };
            global.window.open = jest.fn(() => mockTab);

            const gridElement = { id: 'elem-1', label: { en: 'Test' } };
            const action = {
                modelName: 'GridActionOpenWebpage',
                openURL: 'https://example.com',
                timeoutSeconds: 5,
            };

            await actionService.testAction(gridElement, action, {});

            expect(mockTab.close).not.toHaveBeenCalled();

            jest.advanceTimersByTime(5000);

            expect(mockTab.close).toHaveBeenCalled();
        });
    });

    describe('predefined action execution', () => {
        test('handles predefined action with custom values', async () => {
            const gridElement = { id: 'elem-1', label: { en: 'Test' } };
            const action = {
                modelName: 'GridActionPredefined',
                actionInfo: {
                    actionModelName: 'GridActionHTTP',
                    presets: {
                        url: 'https://api.example.com/${param}',
                    },
                    customValues: [{ name: 'param' }],
                },
                customValues: {
                    param: 'test-value',
                },
            };

            await actionService.testAction(gridElement, action, {});

            expect(httpService.doAction).toHaveBeenCalled();
        });
    });

    describe('edge cases', () => {
        test('handles empty actions array', async () => {
            const gridObject = {
                id: 'grid-1',
                gridElements: [{ id: 'elem-1', label: { en: 'Test' }, actions: [], type: 'ELEMENT_TYPE_NORMAL' }],
            };

            // Should complete without error
            await expect(actionService.doAction(gridObject, 'elem-1')).resolves.not.toThrow();
        });

        test('handles gridData without id in testAction', async () => {
            const gridElement = { id: 'elem-1', label: { en: 'Test' } };
            const action = { modelName: 'GridActionSpeak' };

            await actionService.testAction(gridElement, action);

            expect(speechService.speak).toHaveBeenCalled();
        });
    });
});
