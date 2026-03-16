jest.mock('./util', () => ({
    util: {
        isString: jest.fn((value) => typeof value === 'string' || value instanceof String)
    }
}));

jest.mock('jszip', () => {
    class FakeZip {
        constructor() {
            this._files = {};
            this.file = jest.fn((path, content, options) => {
                this._files[path] = { content, options };
            });
            this.generateAsync = jest.fn(async (_opts, onUpdate) => {
                if (onUpdate) {
                    onUpdate({ percent: 100 });
                }
                return { blob: true, files: this._files };
            });
        }

        static async loadAsync() {
            return {
                files: {
                    'a.json': {
                        async: jest.fn(async () => '{"a":1}')
                    },
                    'b.txt': {
                        async: jest.fn(async () => 'TXT')
                    }
                }
            };
        }
    }

    return {
        __esModule: true,
        default: FakeZip
    };
});

import { fileUtil } from './fileUtil';
import { util } from './util';

describe('fileUtil', () => {
    beforeEach(() => {
        global.log = { warn: jest.fn() };
        global.$ = {
            ajax: jest.fn()
        };
    });

    test('readZip parses configured json files and reports progress', async () => {
        const progressFn = jest.fn();
        const data = await fileUtil.readZip('dummy', { jsonFileExtensions: ['json'], progressFn });

        expect(data['a.json']).toEqual({ a: 1 });
        expect(data['b.txt']).toBe('TXT');
        expect(progressFn).toHaveBeenCalled();
    });

    test('createZip stringifies objects and reports generation progress', async () => {
        util.isString.mockImplementation((value) => typeof value === 'string');
        const progressFn = jest.fn();

        const result = await fileUtil.createZip({
            'a.txt': 'hello',
            'b.json': { x: 1 }
        }, { progressFn });

        expect(result.blob).toBe(true);
        expect(progressFn).toHaveBeenCalledWith(100);
    });

    test('readFileContent resolves undefined for empty input', async () => {
        await expect(fileUtil.readFileContent()).resolves.toBeUndefined();
    });

    test('filename and extension helpers detect file types', () => {
        const grd = { name: 'board.grd.json' };
        const obf = { name: 'x.obf' };
        const obz = { name: 'x.obz' };

        expect(fileUtil.getFilename(grd)).toBe('board.grd.json');
        expect(fileUtil.getFileExtension(obf)).toBe('.obf');
        expect(fileUtil.isGrdFile(grd)).toBe(true);
        expect(fileUtil.isObfFile(obf)).toBe(true);
        expect(fileUtil.isObzFile(obz)).toBe(true);
    });

    test('downloadFile resolves success and failure branches', async () => {
        global.$.ajax.mockImplementation(() => ({
            done: function (cb) {
                cb({ ok: true });
                return this;
            },
            fail: function () {
                return this;
            }
        }));
        await expect(fileUtil.downloadFile('/ok')).resolves.toEqual({ ok: true });

        global.$.ajax.mockImplementation(() => ({
            done: function () {
                return this;
            },
            fail: function (cb) {
                cb(null, null, 'err');
                return this;
            }
        }));
        await expect(fileUtil.downloadFile('/fail')).resolves.toBeNull();
    });
});
