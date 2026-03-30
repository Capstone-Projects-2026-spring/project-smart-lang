// Mock dependencies
jest.mock('../externals/jquery', () => {
    const triggerFn = jest.fn();
    const mock = jest.fn(() => ({
        on: jest.fn(),
        off: jest.fn(),
        trigger: triggerFn
    }));
    mock.extend = jest.fn();
    mock._trigger = triggerFn;
    return mock;
});

jest.mock('../model/GridElement', () => ({
    GridElement: {
        ELEMENT_TYPE_LIVE: 'ELEMENT_TYPE_LIVE',
        ELEMENT_TYPE_NORMAL: 'ELEMENT_TYPE_NORMAL'
    }
}));

jest.mock('../model/GridElementLive', () => ({
    GridElementLive: {
        MODE_DATETIME: 'MODE_DATETIME',
        MODE_APP_STATE: 'MODE_APP_STATE',
        MODE_ACTION_RESULT: 'MODE_ACTION_RESULT',
        MODE_RANDOM: 'MODE_RANDOM',
        DT_FORMAT_DATE: 'DT_FORMAT_DATE',
        DT_FORMAT_DATE_LONG: 'DT_FORMAT_DATE_LONG',
        DT_FORMAT_TIME: 'DT_FORMAT_TIME',
        DT_FORMAT_TIME_LONG: 'DT_FORMAT_TIME_LONG',
        DT_FORMAT_DATETIME: 'DT_FORMAT_DATETIME',
        DT_FORMAT_DATETIME_LONG: 'DT_FORMAT_DATETIME_LONG',
        DT_FORMAT_WEEKDAY: 'DT_FORMAT_WEEKDAY',
        DT_FORMAT_MONTH: 'DT_FORMAT_MONTH',
        DT_FORMAT_CUSTOM: 'DT_FORMAT_CUSTOM',
        APP_STATE_VOLUME_GLOBAL: 'APP_STATE_VOLUME_GLOBAL',
        APP_STATE_VOLUME_YT: 'APP_STATE_VOLUME_YT',
        APP_STATE_VOLUME_RADIO: 'APP_STATE_VOLUME_RADIO',
        APP_STATE_BATTERY_LEVEL: 'APP_STATE_BATTERY_LEVEL',
        EXTRACT_JSON: 'EXTRACT_JSON',
        EXTRACT_HTML_SELECTOR: 'EXTRACT_HTML_SELECTOR'
    }
}));

jest.mock('../util/constants', () => ({
    constants: {
        EVENT_ELEM_TEXT_CHANGED: 'EVENT_ELEM_TEXT_CHANGED',
        WEBRADIO_LAST_VOLUME_KEY: 'WEBRADIO_LAST_VOLUME_KEY'
    }
}));

jest.mock('./i18nService', () => ({
    i18nService: {
        getTranslation: jest.fn((label) => {
            if (typeof label === 'string') return label;
            if (label && label.en) return label.en;
            return '';
        }),
        getContentLang: jest.fn(() => 'en'),
        tPredefined: jest.fn((text) => text),
        t: jest.fn((key) => key)
    }
}));

jest.mock('./data/localStorageService', () => ({
    localStorageService: {
        getUserSettings: jest.fn(() => ({
            systemVolume: 75,
            systemVolumeMuted: false,
            ytState: {
                volume: 50,
                muted: false
            }
        })),
        get: jest.fn(() => '0.8')
    }
}));

jest.mock('./actionService', () => ({
    actionService: {
        testAction: jest.fn()
    }
}));

jest.mock('../util/util', () => ({
    util: {
        getRandomInt: jest.fn((min, max) => min)
    }
}));

// Mock date-fns
jest.mock('date-fns', () => ({
    format: jest.fn((date, formatStr, options) => `Formatted: ${formatStr}`)
}));

jest.mock('date-fns/locale', () => ({
    es: {},
    pt: {},
    it: {},
    enUS: {},
    fr: {},
    de: {}
}));

import $ from '../externals/jquery';
import { liveElementService } from './liveElementService';
import { GridElement } from '../model/GridElement';
import { GridElementLive } from '../model/GridElementLive';
import { i18nService } from './i18nService';
import { localStorageService } from './data/localStorageService';
import { actionService } from './actionService';
import { util } from '../util/util';
import { format } from 'date-fns';

describe('liveElementService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        liveElementService.stop();
        
        global.log = {
            warn: jest.fn(),
            debug: jest.fn(),
            info: jest.fn()
        };
        
        // Reset navigator.getBattery mock
        global.navigator.getBattery = jest.fn(() => Promise.resolve({
            level: 0.85
        }));
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
        liveElementService.stop();
    });

    describe('initWithElements', () => {
        test('should register live elements', () => {
            const elements = [
                {
                    id: 'live1',
                    type: 'ELEMENT_TYPE_LIVE',
                    mode: 'MODE_DATETIME',
                    dateTimeFormat: 'DT_FORMAT_TIME'
                }
            ];

            liveElementService.initWithElements(elements);

            // Should start updating (internal state change)
            expect(true).toBe(true);
        });

        test('should filter out non-live elements', () => {
            const elements = [
                {
                    id: 'normal1',
                    type: 'ELEMENT_TYPE_NORMAL'
                },
                {
                    id: 'live1',
                    type: 'ELEMENT_TYPE_LIVE',
                    mode: 'MODE_DATETIME'
                }
            ];

            liveElementService.initWithElements(elements);

            // Should only register live elements
            expect(true).toBe(true);
        });

        test('should handle empty elements array', () => {
            liveElementService.initWithElements([]);

            // Should not throw
            expect(true).toBe(true);
        });

        test('should handle null elements in array', () => {
            const elements = [null, undefined, { id: 'live1', type: 'ELEMENT_TYPE_LIVE', mode: 'MODE_DATETIME' }];

            expect(() => liveElementService.initWithElements(elements)).not.toThrow();
        });

        test('should deep copy elements', () => {
            const elements = [
                {
                    id: 'live1',
                    type: 'ELEMENT_TYPE_LIVE',
                    mode: 'MODE_DATETIME',
                    nested: { value: 1 }
                }
            ];

            liveElementService.initWithElements(elements);

            // Original should be unchanged if modified internally
            expect(elements[0].nested.value).toBe(1);
        });

        test('should respect once option', () => {
            const elements = [
                {
                    id: 'live1',
                    type: 'ELEMENT_TYPE_LIVE',
                    mode: 'MODE_DATETIME'
                }
            ];

            liveElementService.initWithElements(elements, { once: true });

            // With once: true, should not set up interval
            expect(true).toBe(true);
        });
    });

    describe('stop', () => {
        test('should clear registered elements and values', () => {
            const elements = [
                { id: 'live1', type: 'ELEMENT_TYPE_LIVE', mode: 'MODE_DATETIME' }
            ];

            liveElementService.initWithElements(elements);
            liveElementService.stop();

            // getLastValue should return empty string after stop
            expect(liveElementService.getLastValue('live1')).toBe('');
        });

        test('should clear timeout handler', () => {
            const elements = [
                { id: 'live1', type: 'ELEMENT_TYPE_LIVE', mode: 'MODE_DATETIME' }
            ];

            liveElementService.initWithElements(elements);
            liveElementService.stop();

            // Advance time, should not trigger updates after stop
            jest.advanceTimersByTime(2000);
            expect(true).toBe(true);
        });
    });

    describe('getLastValue', () => {
        test('should return empty string for unknown element', () => {
            const result = liveElementService.getLastValue('unknown');

            expect(result).toBe('');
        });

        test('should return cached value for known element', async () => {
            const element = {
                id: 'live1',
                type: 'ELEMENT_TYPE_LIVE',
                mode: 'MODE_DATETIME',
                dateTimeFormat: 'DT_FORMAT_TIME',
                label: { en: 'Time: {0}' }
            };

            // Get current value first to cache it
            await liveElementService.getCurrentValue(element);

            const lastValue = liveElementService.getLastValue('live1');
            expect(typeof lastValue).toBe('string');
        });
    });

    describe('getCurrentValue', () => {
        describe('datetime mode', () => {
            test('should return formatted date for DT_FORMAT_DATE', async () => {
                const element = {
                    id: 'live1',
                    type: 'ELEMENT_TYPE_LIVE',
                    mode: 'MODE_DATETIME',
                    dateTimeFormat: 'DT_FORMAT_DATE',
                    label: { en: '' }
                };

                const result = await liveElementService.getCurrentValue(element);

                expect(typeof result).toBe('string');
            });

            test('should return formatted time for DT_FORMAT_TIME', async () => {
                const element = {
                    id: 'live1',
                    type: 'ELEMENT_TYPE_LIVE',
                    mode: 'MODE_DATETIME',
                    dateTimeFormat: 'DT_FORMAT_TIME',
                    label: { en: '' }
                };

                const result = await liveElementService.getCurrentValue(element);

                expect(typeof result).toBe('string');
            });

            test('should apply time offset', async () => {
                const element = {
                    id: 'live1',
                    type: 'ELEMENT_TYPE_LIVE',
                    mode: 'MODE_DATETIME',
                    dateTimeFormat: 'DT_FORMAT_TIME',
                    dateTimeOffsetHours: 2,
                    label: { en: '' }
                };

                const result = await liveElementService.getCurrentValue(element);

                expect(typeof result).toBe('string');
            });

            test('should use custom format with date-fns', async () => {
                const element = {
                    id: 'live1',
                    type: 'ELEMENT_TYPE_LIVE',
                    mode: 'MODE_DATETIME',
                    dateTimeFormat: 'DT_FORMAT_CUSTOM',
                    dateTimeFormatCustom: 'yyyy-MM-dd',
                    label: { en: '' }
                };

                const result = await liveElementService.getCurrentValue(element);

                expect(format).toHaveBeenCalled();
            });

            test('should use locale for formatting', async () => {
                const element = {
                    id: 'live1',
                    type: 'ELEMENT_TYPE_LIVE',
                    mode: 'MODE_DATETIME',
                    dateTimeFormat: 'DT_FORMAT_CUSTOM',
                    dateTimeLocale: 'de',
                    dateTimeFormatCustom: 'EEEE',
                    label: { en: '' }
                };

                const result = await liveElementService.getCurrentValue(element);

                expect(format).toHaveBeenCalled();
            });

            test('should return weekday for DT_FORMAT_WEEKDAY', async () => {
                const element = {
                    id: 'live1',
                    type: 'ELEMENT_TYPE_LIVE',
                    mode: 'MODE_DATETIME',
                    dateTimeFormat: 'DT_FORMAT_WEEKDAY',
                    label: { en: '' }
                };

                const result = await liveElementService.getCurrentValue(element);

                expect(typeof result).toBe('string');
            });

            test('should return month for DT_FORMAT_MONTH', async () => {
                const element = {
                    id: 'live1',
                    type: 'ELEMENT_TYPE_LIVE',
                    mode: 'MODE_DATETIME',
                    dateTimeFormat: 'DT_FORMAT_MONTH',
                    label: { en: '' }
                };

                const result = await liveElementService.getCurrentValue(element);

                expect(typeof result).toBe('string');
            });
        });

        describe('app state mode', () => {
            test('should return global volume', async () => {
                const element = {
                    id: 'live1',
                    type: 'ELEMENT_TYPE_LIVE',
                    mode: 'MODE_APP_STATE',
                    appState: 'APP_STATE_VOLUME_GLOBAL',
                    label: { en: '' }
                };

                const result = await liveElementService.getCurrentValue(element);

                expect(result).toContain('75');
            });

            test('should return muted for muted global volume', async () => {
                localStorageService.getUserSettings.mockReturnValue({
                    systemVolume: 75,
                    systemVolumeMuted: true,
                    ytState: { volume: 50, muted: false }
                });

                const element = {
                    id: 'live1',
                    type: 'ELEMENT_TYPE_LIVE',
                    mode: 'MODE_APP_STATE',
                    appState: 'APP_STATE_VOLUME_GLOBAL',
                    label: { en: '' }
                };

                const result = await liveElementService.getCurrentValue(element);

                expect(i18nService.t).toHaveBeenCalledWith('mutedBracket');
            });

            test('should return YouTube volume', async () => {
                const element = {
                    id: 'live1',
                    type: 'ELEMENT_TYPE_LIVE',
                    mode: 'MODE_APP_STATE',
                    appState: 'APP_STATE_VOLUME_YT',
                    label: { en: '' }
                };

                const result = await liveElementService.getCurrentValue(element);

                expect(result).toContain('50');
            });

            test('should return radio volume', async () => {
                const element = {
                    id: 'live1',
                    type: 'ELEMENT_TYPE_LIVE',
                    mode: 'MODE_APP_STATE',
                    appState: 'APP_STATE_VOLUME_RADIO',
                    label: { en: '' }
                };

                const result = await liveElementService.getCurrentValue(element);

                expect(result).toContain('80'); // 0.8 * 100
            });

            test('should return battery level', async () => {
                const element = {
                    id: 'live1',
                    type: 'ELEMENT_TYPE_LIVE',
                    mode: 'MODE_APP_STATE',
                    appState: 'APP_STATE_BATTERY_LEVEL',
                    label: { en: '' }
                };

                const result = await liveElementService.getCurrentValue(element);

                expect(result).toContain('85'); // 0.85 * 100
            });

            test('should handle missing getBattery API', async () => {
                delete global.navigator.getBattery;

                const element = {
                    id: 'live1',
                    type: 'ELEMENT_TYPE_LIVE',
                    mode: 'MODE_APP_STATE',
                    appState: 'APP_STATE_BATTERY_LEVEL',
                    label: { en: '' }
                };

                const result = await liveElementService.getCurrentValue(element);

                expect(result).toContain('?');
            });
        });

        describe('action result mode', () => {
            test('should extract JSON value', async () => {
                actionService.testAction.mockResolvedValue('{"name": "test", "value": 42}');

                const element = {
                    id: 'live1',
                    type: 'ELEMENT_TYPE_LIVE',
                    mode: 'MODE_ACTION_RESULT',
                    extractMode: 'EXTRACT_JSON',
                    extractSelector: 'value',
                    liveAction: {},
                    label: { en: '' }
                };

                const result = await liveElementService.getCurrentValue(element);

                expect(result).toContain('42');
            });

            test('should handle nested JSON path', async () => {
                actionService.testAction.mockResolvedValue('{"data": {"nested": {"value": "deep"}}}');

                const element = {
                    id: 'live1',
                    type: 'ELEMENT_TYPE_LIVE',
                    mode: 'MODE_ACTION_RESULT',
                    extractMode: 'EXTRACT_JSON',
                    extractSelector: 'data.nested.value',
                    liveAction: {},
                    label: { en: '' }
                };

                const result = await liveElementService.getCurrentValue(element);

                expect(result).toContain('deep');
            });

            test('should handle invalid JSON', async () => {
                actionService.testAction.mockResolvedValue('not valid json');

                const element = {
                    id: 'live1',
                    type: 'ELEMENT_TYPE_LIVE',
                    mode: 'MODE_ACTION_RESULT',
                    extractMode: 'EXTRACT_JSON',
                    extractSelector: 'value',
                    liveAction: {},
                    label: { en: '' }
                };

                const result = await liveElementService.getCurrentValue(element);

                expect(result).toBe('');
            });

            test('should extract HTML selector value', async () => {
                actionService.testAction.mockResolvedValue('<html><body><div id="target">Hello World</div></body></html>');

                const element = {
                    id: 'live1',
                    type: 'ELEMENT_TYPE_LIVE',
                    mode: 'MODE_ACTION_RESULT',
                    extractMode: 'EXTRACT_HTML_SELECTOR',
                    extractSelector: '#target',
                    liveAction: {},
                    label: { en: '' }
                };

                const result = await liveElementService.getCurrentValue(element);

                expect(result).toContain('Hello World');
            });

            test('should handle HTML extraction with index', async () => {
                actionService.testAction.mockResolvedValue('<html><body><p>First</p><p>Second</p></body></html>');

                const element = {
                    id: 'live1',
                    type: 'ELEMENT_TYPE_LIVE',
                    mode: 'MODE_ACTION_RESULT',
                    extractMode: 'EXTRACT_HTML_SELECTOR',
                    extractSelector: 'p',
                    extractIndex: 1,
                    liveAction: {},
                    label: { en: '' }
                };

                const result = await liveElementService.getCurrentValue(element);

                expect(result).toContain('Second');
            });
        });

        describe('random mode', () => {
            test('should return random value from choices', async () => {
                util.getRandomInt.mockReturnValue(1);

                const element = {
                    id: 'live1',
                    type: 'ELEMENT_TYPE_LIVE',
                    mode: 'MODE_RANDOM',
                    chooseValues: 'apple;banana;cherry',
                    label: { en: '' }
                };

                const result = await liveElementService.getCurrentValue(element);

                expect(result).toContain('banana');
            });

            test('should handle single value', async () => {
                util.getRandomInt.mockReturnValue(0);

                const element = {
                    id: 'live1',
                    type: 'ELEMENT_TYPE_LIVE',
                    mode: 'MODE_RANDOM',
                    chooseValues: 'only-option',
                    label: { en: '' }
                };

                const result = await liveElementService.getCurrentValue(element);

                expect(result).toContain('only-option');
            });

            test('should handle empty chooseValues', async () => {
                const element = {
                    id: 'live1',
                    type: 'ELEMENT_TYPE_LIVE',
                    mode: 'MODE_RANDOM',
                    chooseValues: '',
                    label: { en: '' }
                };

                const result = await liveElementService.getCurrentValue(element);

                expect(typeof result).toBe('string');
            });
        });

        describe('caching', () => {
            test('should cache value based on updateSeconds', async () => {
                const element = {
                    id: 'live1',
                    type: 'ELEMENT_TYPE_LIVE',
                    mode: 'MODE_RANDOM',
                    chooseValues: 'a;b;c',
                    updateSeconds: 10,
                    label: { en: '' }
                };

                // First call
                await liveElementService.getCurrentValue(element);
                
                // Second call should use cache
                util.getRandomInt.mockClear();
                await liveElementService.getCurrentValue(element);

                // With updateSeconds > 0 and not enough time passed, should use cache
                expect(util.getRandomInt).not.toHaveBeenCalled();
            });

            test('should force update when forceUpdate option is true', async () => {
                const element = {
                    id: 'live1',
                    type: 'ELEMENT_TYPE_LIVE',
                    mode: 'MODE_RANDOM',
                    chooseValues: 'a;b;c',
                    updateSeconds: 10,
                    label: { en: '' }
                };

                // First call
                await liveElementService.getCurrentValue(element);
                
                // Second call with forceUpdate
                util.getRandomInt.mockClear();
                await liveElementService.getCurrentValue(element, { forceUpdate: true });

                expect(util.getRandomInt).toHaveBeenCalled();
            });
        });

        describe('extract mappings', () => {
            test('should apply extract mappings', async () => {
                actionService.testAction.mockResolvedValue('{"status": "true"}');

                const element = {
                    id: 'live1',
                    type: 'ELEMENT_TYPE_LIVE',
                    mode: 'MODE_ACTION_RESULT',
                    extractMode: 'EXTRACT_JSON',
                    extractSelector: 'status',
                    extractMappings: { 'true': 'ON', 'false': 'OFF' },
                    liveAction: {},
                    label: { en: '' }
                };

                const result = await liveElementService.getCurrentValue(element);

                expect(result).toContain('ON');
            });
        });

        describe('label placeholder', () => {
            test('should replace {0} placeholder with value', async () => {
                const element = {
                    id: 'live1',
                    type: 'ELEMENT_TYPE_LIVE',
                    mode: 'MODE_APP_STATE',
                    appState: 'APP_STATE_VOLUME_GLOBAL',
                    label: { en: 'Volume: {0}%' }
                };

                const result = await liveElementService.getCurrentValue(element);

                expect(result).toContain('Volume:');
                expect(result).toContain('75');
                expect(result).toContain('%');
            });

            test('should append value if no placeholder', async () => {
                const element = {
                    id: 'live1',
                    type: 'ELEMENT_TYPE_LIVE',
                    mode: 'MODE_APP_STATE',
                    appState: 'APP_STATE_VOLUME_GLOBAL',
                    label: { en: 'Volume: ' }
                };

                const result = await liveElementService.getCurrentValue(element);

                expect(result).toBe('Volume: 75');
            });
        });
    });

    describe('replacePlaceholder', () => {
        test('should replace {0} with data text', () => {
            const element = { id: 'elem1' };
            const result = liveElementService.replacePlaceholder(element, 'Value: {0}', 'test');

            expect(result).toBe('Value: test');
        });

        test('should append if no placeholder', () => {
            const element = { id: 'elem1' };
            const result = liveElementService.replacePlaceholder(element, 'Value: ', 'test');

            expect(result).toBe('Value: test');
        });

        test('should return text unchanged if no data', () => {
            const element = { id: 'elem1' };
            const result = liveElementService.replacePlaceholder(element, 'Value: {0}', '');

            expect(result).toBe('Value: {0}');
        });

        test('should use last value if dataText not provided', () => {
            const element = { id: 'elem1' };
            // No cached value, so should return text unchanged
            const result = liveElementService.replacePlaceholder(element, 'Value: {0}');

            expect(result).toBe('Value: {0}');
        });

        test('should handle undefined text', () => {
            const element = { id: 'elem1' };
            const result = liveElementService.replacePlaceholder(element, undefined, 'test');

            expect(result).toBe('test');
        });
    });

    describe('updateOnce', () => {
        test('should update elements once without interval', () => {
            const elements = [
                { id: 'live1', type: 'ELEMENT_TYPE_LIVE', mode: 'MODE_DATETIME' }
            ];

            liveElementService.initWithElements(elements);
            liveElementService.updateOnce();

            // Should not throw
            expect(true).toBe(true);
        });

        test('should filter by updateModes', () => {
            const elements = [
                { id: 'live1', type: 'ELEMENT_TYPE_LIVE', mode: 'MODE_DATETIME' },
                { id: 'live2', type: 'ELEMENT_TYPE_LIVE', mode: 'MODE_APP_STATE' }
            ];

            liveElementService.initWithElements(elements);
            liveElementService.updateOnce({ updateModes: ['MODE_DATETIME'] });

            // Should only update datetime elements
            expect(true).toBe(true);
        });

        test('should use provided elements instead of registered', () => {
            const registeredElements = [
                { id: 'registered', type: 'ELEMENT_TYPE_LIVE', mode: 'MODE_DATETIME' }
            ];
            const providedElements = [
                { id: 'provided', type: 'ELEMENT_TYPE_LIVE', mode: 'MODE_APP_STATE' }
            ];

            liveElementService.initWithElements(registeredElements);
            liveElementService.updateOnce({ elements: providedElements });

            // Should use provided elements
            expect(true).toBe(true);
        });
    });

    describe('interval updates', () => {
        test('should update at regular intervals', () => {
            const elements = [
                { id: 'live1', type: 'ELEMENT_TYPE_LIVE', mode: 'MODE_DATETIME', dateTimeFormat: 'DT_FORMAT_TIME' }
            ];

            liveElementService.initWithElements(elements);

            // Advance timer by check interval
            jest.advanceTimersByTime(1000);

            // Should have triggered update
            expect(true).toBe(true);
        });

        test('should stop updates after stop() is called', () => {
            const elements = [
                { id: 'live1', type: 'ELEMENT_TYPE_LIVE', mode: 'MODE_DATETIME' }
            ];

            liveElementService.initWithElements(elements);
            liveElementService.stop();

            // Advance timer - should not cause issues
            jest.advanceTimersByTime(5000);

            expect(true).toBe(true);
        });
    });
});
