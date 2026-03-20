jest.mock('./log', () => ({
    log: {
        warn: jest.fn(),
        debug: jest.fn()
    }
}));

import { MapCache } from './MapCache';
import { log } from './log';

class Box {
    constructor(value) {
        this.value = value;
    }
}

describe('MapCache', () => {
    beforeEach(() => {
        log.warn.mockClear();
        log.debug.mockClear();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    test('stores and returns deep copies', () => {
        const cache = new MapCache();
        const original = { a: 1, nested: { b: 2 } };

        cache.set('item', original);
        const fromCache = cache.get('item');

        expect(fromCache).toEqual(original);
        expect(fromCache).not.toBe(original);

        fromCache.nested.b = 999;
        expect(cache.get('item').nested.b).toBe(2);
    });

    test('supports objectType instantiation for single values and arrays', () => {
        const cache = new MapCache();

        cache.set('single', { n: 1 }, Box);
        const single = cache.get('single');
        expect(single).toBeInstanceOf(Box);
        expect(single.value).toEqual({ n: 1 });

        cache.set('arr', [{ n: 2 }, { n: 3 }], Box);
        const arr = cache.get('arr');
        expect(arr[0]).toBeInstanceOf(Box);
        expect(arr[1]).toBeInstanceOf(Box);
        expect(arr.map((e) => e.value)).toEqual([{ n: 2 }, { n: 3 }]);
    });

    test('has, clear and clearAll work as expected', () => {
        const cache = new MapCache();

        cache.set('a', { x: 1 });
        cache.set('b', { x: 2 });
        expect(cache.has('a')).toBe(true);

        cache.clear('a');
        expect(cache.get('a')).toBeNull();
        expect(cache.has('b')).toBe(true);

        cache.clearAll();
        expect(cache.has('b')).toBe(false);
    });

    test('returns null for unknown key and undefined for invalid key types', () => {
        const cache = new MapCache();

        expect(cache.get('missing')).toBeNull();
        expect(cache.get(123)).toBeUndefined();
        expect(cache.has(123)).toBe(false);
    });

    test('does not cache invalid values or short-version objects', () => {
        const cache = new MapCache();

        cache.set(42, { ok: true });
        cache.set('empty', null);
        cache.set('badType', { ok: true }, {});
        cache.set('short', { isShortVersion: true });

        expect(cache.get('empty')).toBeNull();
        expect(cache.get('badType')).toBeNull();
        expect(cache.get('short')).toBeNull();
        expect(log.warn).toHaveBeenCalled();
        expect(log.debug).toHaveBeenCalled();
    });

    test('expires cached values when ttl is exceeded', () => {
        jest.useFakeTimers();
        const cache = new MapCache({ ttlMs: 100 });

        cache.set('temp', { ok: true });
        expect(cache.has('temp')).toBe(true);

        jest.advanceTimersByTime(101);

        expect(cache.get('temp')).toBeNull();
        expect(cache.has('temp')).toBe(false);
    });

    test('getAsPromise resolves cache value asynchronously', async () => {
        jest.useFakeTimers();
        const cache = new MapCache();
        cache.set('async', { ok: true });

        const promise = cache.getAsPromise('async');
        jest.advanceTimersByTime(1);

        await expect(promise).resolves.toEqual({ ok: true });
    });
});
