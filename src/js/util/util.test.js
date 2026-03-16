jest.mock('../model/TextConfig.js', () => ({
    TextConfig: {
        CONVERT_MODE_LOWERCASE: 'CONVERT_MODE_LOWERCASE',
        CONVERT_MODE_UPPERCASE: 'CONVERT_MODE_UPPERCASE'
    }
}));

jest.mock('../model/GridElement', () => ({
    GridElement: class {
        constructor() {
            this.id = 'generated-grid-id';
        }

        static getModelName() {
            return 'GridElement';
        }
    }
}));

jest.mock('./imageUtil', () => ({
    imageUtil: {
        getScreenshot: jest.fn(),
        canvasToBlob: jest.fn(),
        mimeTypeToFileSuffix: jest.fn(() => 'png')
    }
}));

import { util } from './util';
import { TextConfig } from '../model/TextConfig.js';
import { imageUtil } from './imageUtil';
import { TextEncoder, TextDecoder } from 'util';

describe('util', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        global.log = { warn: jest.fn(), debug: jest.fn() };
        global.fetch = jest.fn();
        global.TextEncoder = TextEncoder;
        global.TextDecoder = TextDecoder;
        if (!global.window.atob) {
            global.window.atob = (str) => Buffer.from(str, 'base64').toString('binary');
        }
        if (!global.window.btoa) {
            global.window.btoa = (str) => Buffer.from(str, 'binary').toString('base64');
        }
        document.execCommand = jest.fn(() => true);
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
        jest.clearAllMocks();
    });

    test('debounce schedules execution and clearDebounce cancels', () => {
        const fn = jest.fn();
        util.debounce(fn, 100, 'k1');
        util.clearDebounce('k1');
        jest.advanceTimersByTime(120);
        expect(fn).not.toHaveBeenCalled();
    });

    test('debounce warns when missing params', () => {
        util.debounce(null, null);
        expect(global.log.warn).toHaveBeenCalled();
    });

    test('throttle respects pause window', () => {
        const fn = jest.fn();
        util.throttle(fn, ['a'], 500, 'tk');
        util.throttle(fn, ['b'], 500, 'tk');
        expect(fn).toHaveBeenCalledTimes(1);
    });

    test('copyToClipboard and appendToClipboard use document command', () => {
        util.copyToClipboard('a');
        util.appendToClipboard('b');
        expect(document.execCommand).toHaveBeenCalledWith('copy');
    });

    test('copyBlobToClipboard handles unsupported API', async () => {
        const oldClipboardItem = global.ClipboardItem;
        delete global.ClipboardItem;
        await util.copyBlobToClipboard(new Blob(['x'], { type: 'text/plain' }));
        expect(global.log.warn).toHaveBeenCalledWith('copy blob to clipboard is not supported');
        global.ClipboardItem = oldClipboardItem;
    });

    test('getCollectContentBlob returns null if screenshot is missing', async () => {
        imageUtil.getScreenshot.mockResolvedValue(null);
        await expect(util.getCollectContentBlob()).resolves.toBeNull();
    });

    test('getCollectContentBlob converts canvas to blob', async () => {
        const canvas = { id: 'c1' };
        const blob = { size: 5 };
        imageUtil.getScreenshot.mockResolvedValue(canvas);
        imageUtil.canvasToBlob.mockResolvedValue(blob);
        await expect(util.getCollectContentBlob(3)).resolves.toBe(blob);
    });

    test('getClipboardContent uses fallback when navigator clipboard missing', async () => {
        const original = navigator.clipboard;
        delete navigator.clipboard;
        util.copyToClipboard('saved');
        await expect(util.getClipboardContent()).resolves.toBe('saved');
        navigator.clipboard = original;
    });

    test('grid element clipboard parsing filters and remaps id', async () => {
        const original = navigator.clipboard;
        navigator.clipboard = {
            readText: jest.fn().mockResolvedValue(JSON.stringify([
                { id: '1', modelName: 'GridElement', label: 'ok' },
                { id: '2', modelName: 'Other' }
            ]))
        };
        const items = await util.getGridElementsFromClipboard();
        expect(items).toHaveLength(1);
        expect(items[0].id).toBe('generated-grid-id');
        navigator.clipboard = original;
    });

    test('splitInChunks and element lookup helpers', () => {
        expect(util.splitInChunks([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);

        const target = document.createElement('div');
        const child = document.createElement('span');
        target.appendChild(child);
        document.elementsFromPoint = jest.fn(() => [child]);
        expect(util.getElement([target], 1, 1)).toBe(target);
    });

    test('color conversion helpers return expected values', () => {
        expect(util.getRGB('#ffffff')).toEqual([255, 255, 255]);
        expect(util.hexToRGB('#0f0')).toEqual([0, 255, 0]);
        expect(util.cssRGBToRGB('rgb(1, 2, 3)')).toEqual([1, 2, 3]);
        expect(util.getRGB('bad')).toBeNull();
    });

    test('string and case conversion helpers', () => {
        expect(util.isString('x')).toBe(true);
        expect(util.isString(5)).toBe(false);
        expect(util.convertLowerUppercase('AbC', TextConfig.CONVERT_MODE_LOWERCASE)).toBe('abc');
        expect(util.convertLowerUppercase('AbC', TextConfig.CONVERT_MODE_UPPERCASE)).toBe('ABC');
        expect(util.convertLowerUppercase('AbC')).toBe('AbC');
    });

    test('date/time and base64 conversion helpers', () => {
        const s = util.getCurrentDateTimeString();
        expect(s).toMatch(/^\d{4}-\d{2}-\d{2}_\d{2}-\d{2}$/);

        const base64 = util.stringToBase64('hello');
        expect(util.base64ToString(base64)).toBe('hello');

        const bytes = util.base64ToBytes(base64);
        expect(bytes).toBeInstanceOf(Uint8Array);
        expect(util.bytesToBase64(bytes)).toBe(base64);
    });

    test('base64ToArrayBuffer handles invalid content', () => {
        const spy = jest.spyOn(window, 'atob').mockImplementation(() => {
            throw new Error('bad');
        });
        const buffer = util.base64ToArrayBuffer('%%%');
        expect(buffer.byteLength).toBe(0);
        spy.mockRestore();
    });

    test('arrayToPrintable and mapRange helpers', () => {
        expect(util.arrayToPrintable(['1', '2'])).toBe('1,2');
        expect(util.mapRange(5, 0, 10, 0, 100)).toBe(50);
        expect(util.mapRange(5, 1, 1, 0, 100)).toBe(0);
    });

    test('fetchJson handles success and errors', async () => {
        fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ ok: 1 }) });
        await expect(util.fetchJson('/x')).resolves.toEqual({ ok: 1 });

        fetch.mockResolvedValueOnce({ ok: false });
        await expect(util.fetchJson('/x')).resolves.toBeNull();

        fetch.mockRejectedValueOnce(new Error('n'));
        await expect(util.fetchJson('/x')).resolves.toBeNull();
    });

    test('random, dedupe, shuffle and replace helpers', () => {
        jest.spyOn(Math, 'random').mockReturnValue(0.5);
        expect(util.getRandom(0, 10)).toBe(5);
        expect(util.getRandomInt(1, 3)).toBe(2);
        expect(util.deduplicateArray([1, 1, 2])).toEqual([1, 2]);
        expect(util.shuffleArray([1, 2, 3])).toHaveLength(3);
        expect(util.replaceAll('a-b-c', '-', '_')).toBe('a_b_c');
        Math.random.mockRestore();
    });

    test('date and emoji helper behavior', () => {
        expect(util.isSameDate(new Date('2024-01-01T10:00:00Z'), new Date('2024-01-01T20:00:00Z'))).toBe(true);
        expect(util.isSameDate(new Date('2024-01-01'), new Date('2024-01-02'))).toBe(false);
        expect(util.isOnlyEmojis('🙂')).toBe(true);
        expect(util.isOnlyEmojis('🙂a')).toBe(false);
    });

    test('limitValue clamps and defaults non-finite values', () => {
        expect(util.limitValue(20, 0, 10, 5)).toBe(10);
        expect(util.limitValue(-1, 0, 10, 5)).toBe(0);
        expect(util.limitValue(NaN, 0, 10, 5)).toBe(5);
    });
});
