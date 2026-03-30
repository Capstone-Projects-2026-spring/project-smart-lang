// Mock log first
jest.mock('./log', () => ({
    log: {
        warn: jest.fn(),
        debug: jest.fn()
    }
}));

// Mock html2canvas
jest.mock('html2canvas', () => ({
    default: jest.fn()
}));

// Mock DOM APIs
const mockCanvas = {
    width: 0,
    height: 0,
    getContext: jest.fn(() => ({
        drawImage: jest.fn()
    })),
    toDataURL: jest.fn(() => 'data:image/png;base64,abc123'),
    toBlob: jest.fn((callback) => callback(new Blob(['test'], { type: 'image/png' })))
};

global.document = {
    createElement: jest.fn((tag) => {
        if (tag === 'canvas') {
            return { ...mockCanvas };
        }
        if (tag === 'img') {
            return {
                onload: null,
                onerror: null,
                src: '',
                width: 100,
                height: 100,
                naturalWidth: 100,
                naturalHeight: 100,
                clientWidth: 100,
                clientHeight: 100
            };
        }
        return {};
    }),
    querySelector: jest.fn(() => ({ id: 'test-element' })),
    body: {
        appendChild: jest.fn(),
        removeChild: jest.fn()
    },
    images: []
};

global.Image = jest.fn().mockImplementation(() => ({
    onload: null,
    onerror: null,
    src: '',
    width: 100,
    height: 100,
    naturalWidth: 100,
    naturalHeight: 100,
    crossOrigin: null
}));

global.DOMParser = jest.fn().mockImplementation(() => ({
    parseFromString: jest.fn(() => ({
        documentElement: {
            width: { baseVal: { value: 100 } },
            height: { baseVal: { value: 100 } }
        }
    }))
}));

global.XMLSerializer = jest.fn().mockImplementation(() => ({
    serializeToString: jest.fn(() => '<svg></svg>')
}));

global.SVGLength = {
    SVG_LENGTHTYPE_PX: 1
};

global.btoa = jest.fn((str) => Buffer.from(str, 'binary').toString('base64'));
global.atob = jest.fn((str) => Buffer.from(str, 'base64').toString('binary'));

global.$ = {
    get: jest.fn()
};

global.Blob = jest.fn().mockImplementation((parts, options) => ({
    size: parts ? parts.length : 0,
    type: options?.type || ''
}));

import { imageUtil } from './imageUtil';
import { log } from './log';

describe('imageUtil', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getBase64FromImg', () => {
        test('converts image to base64 with default maxWidth', () => {
            const mockCtx = { drawImage: jest.fn() };
            const mockCanvasElem = {
                width: 0,
                height: 0,
                getContext: jest.fn(() => mockCtx),
                toDataURL: jest.fn(() => 'data:image/jpeg;base64,abc')
            };
            document.createElement = jest.fn(() => mockCanvasElem);
            
            const img = {
                src: 'http://example.com/image.jpg',
                width: 200,
                height: 100
            };
            
            const result = imageUtil.getBase64FromImg(img);
            
            expect(result).toHaveProperty('data');
            expect(result).toHaveProperty('dim');
            expect(result.dim).toHaveProperty('width');
            expect(result.dim).toHaveProperty('height');
            expect(result.dim).toHaveProperty('ratio');
        });

        test('detects PNG mime type from src', () => {
            const mockCtx = { drawImage: jest.fn() };
            const mockCanvasElem = {
                width: 0,
                height: 0,
                getContext: jest.fn(() => mockCtx),
                toDataURL: jest.fn(() => 'data:image/png;base64,abc')
            };
            document.createElement = jest.fn(() => mockCanvasElem);
            
            const img = {
                src: 'http://example.com/image.png',
                width: 100,
                height: 100
            };
            
            const result = imageUtil.getBase64FromImg(img);
            expect(mockCanvasElem.toDataURL).toHaveBeenCalledWith('image/png', undefined);
        });

        test('detects SVG mime type from src', () => {
            const mockCtx = { drawImage: jest.fn() };
            const mockCanvasElem = {
                width: 0,
                height: 0,
                getContext: jest.fn(() => mockCtx),
                toDataURL: jest.fn(() => 'data:image/svg+xml;base64,abc')
            };
            document.createElement = jest.fn(() => mockCanvasElem);
            
            const img = {
                src: 'http://example.com/image.svg',
                width: 100,
                height: 100
            };
            
            const result = imageUtil.getBase64FromImg(img);
            expect(mockCanvasElem.toDataURL).toHaveBeenCalledWith('image/svg+xml', undefined);
        });

        test('detects mime type from data URL', () => {
            const mockCtx = { drawImage: jest.fn() };
            const mockCanvasElem = {
                width: 0,
                height: 0,
                getContext: jest.fn(() => mockCtx),
                toDataURL: jest.fn(() => 'data:image/png;base64,abc')
            };
            document.createElement = jest.fn(() => mockCanvasElem);
            
            const img = {
                src: 'data:image/png;base64,abc123',
                width: 100,
                height: 100
            };
            
            const result = imageUtil.getBase64FromImg(img);
            expect(result).toHaveProperty('data');
        });

        test('scales image when width exceeds maxWidth', () => {
            const mockCtx = { drawImage: jest.fn() };
            const mockCanvasElem = {
                width: 0,
                height: 0,
                getContext: jest.fn(() => mockCtx),
                toDataURL: jest.fn(() => 'data:image/jpeg;base64,abc')
            };
            document.createElement = jest.fn(() => mockCanvasElem);
            
            const img = {
                src: 'http://example.com/image.jpg',
                width: 300, // larger than default 150
                height: 150
            };
            
            imageUtil.getBase64FromImg(img);
            expect(mockCanvasElem.width).toBe(150);
            expect(mockCanvasElem.height).toBe(75);
        });

        test('throws when conversion fails', () => {
            const mockCtx = { drawImage: jest.fn() };
            const mockCanvasElem = {
                width: 0,
                height: 0,
                getContext: jest.fn(() => mockCtx),
                toDataURL: jest.fn(() => {
                    throw new Error('SecurityError');
                })
            };
            document.createElement = jest.fn(() => mockCanvasElem);
            
            const img = {
                src: 'http://example.com/image.jpg',
                width: 100,
                height: 100
            };
            
            expect(() => imageUtil.getBase64FromImg(img)).toThrow('image converting failed!');
        });
    });

    describe('dataStringToFileSuffix', () => {
        test('returns png for PNG data string', () => {
            expect(imageUtil.dataStringToFileSuffix('data:image/png;base64,abc')).toBe('png');
        });

        test('returns svg for SVG data string', () => {
            expect(imageUtil.dataStringToFileSuffix('data:image/svg+xml;base64,abc')).toBe('svg');
        });

        test('returns jpg for JPEG data string', () => {
            expect(imageUtil.dataStringToFileSuffix('data:image/jpeg;base64,abc')).toBe('jpg');
        });

        test('returns empty string for unknown type', () => {
            expect(imageUtil.dataStringToFileSuffix('data:image/unknown;base64,abc')).toBe('');
        });

        test('returns empty string for empty input', () => {
            expect(imageUtil.dataStringToFileSuffix()).toBe('');
            expect(imageUtil.dataStringToFileSuffix('')).toBe('');
        });
    });

    describe('mimeTypeToFileSuffix', () => {
        test('returns correct suffix for known mime types', () => {
            expect(imageUtil.mimeTypeToFileSuffix('image/jpeg')).toBe('jpg');
            expect(imageUtil.mimeTypeToFileSuffix('image/png')).toBe('png');
            expect(imageUtil.mimeTypeToFileSuffix('image/gif')).toBe('gif');
            expect(imageUtil.mimeTypeToFileSuffix('image/webp')).toBe('webp');
            expect(imageUtil.mimeTypeToFileSuffix('image/bmp')).toBe('bmp');
            expect(imageUtil.mimeTypeToFileSuffix('image/svg+xml')).toBe('svg');
            expect(imageUtil.mimeTypeToFileSuffix('image/svg')).toBe('svg');
        });

        test('returns empty string for unknown mime type', () => {
            expect(imageUtil.mimeTypeToFileSuffix('image/unknown')).toBe('');
            expect(imageUtil.mimeTypeToFileSuffix('text/plain')).toBe('');
        });
    });

    describe('getBase64FromInput', () => {
        test('reads file from input and returns base64', async () => {
            const mockFile = new Blob(['test'], { type: 'image/png' });
            const mockInput = {
                files: [mockFile]
            };
            
            const mockReader = {
                onload: null,
                readAsDataURL: jest.fn(function() {
                    setTimeout(() => {
                        this.onload({ target: { result: 'data:image/png;base64,abc' } });
                    }, 0);
                })
            };
            global.FileReader = jest.fn(() => mockReader);
            
            const promise = imageUtil.getBase64FromInput(mockInput);
            mockReader.onload({ target: { result: 'data:image/png;base64,abc' } });
            
            const result = await promise;
            expect(result).toBe('data:image/png;base64,abc');
        });

        test('handles input without files', async () => {
            const mockInput = { files: null };
            
            const promise = imageUtil.getBase64FromInput(mockInput);
            // Promise should not resolve since there are no files
            expect(promise).toBeInstanceOf(Promise);
        });
    });

    describe('convertBase64', () => {
        test('returns null for empty input', async () => {
            const result = await imageUtil.convertBase64(null);
            expect(result).toBeNull();
        });

        test('returns unchanged SVG base64', async () => {
            const svgBase64 = 'data:image/svg+xml;base64,abc123';
            const result = await imageUtil.convertBase64(svgBase64);
            expect(result).toBe(svgBase64);
        });

        test('converts other image types', async () => {
            const mockCtx = { drawImage: jest.fn() };
            const mockImg = {
                onload: null,
                src: '',
                width: 100,
                height: 100
            };
            const mockCanvasElem = {
                width: 0,
                height: 0,
                getContext: jest.fn(() => mockCtx),
                toDataURL: jest.fn(() => 'data:image/jpeg;base64,converted')
            };
            
            document.createElement.mockImplementation((tag) => {
                if (tag === 'canvas') return mockCanvasElem;
                if (tag === 'img') return mockImg;
                return {};
            });
            
            const promise = imageUtil.convertBase64('data:image/jpeg;base64,original', 150);
            
            // Trigger image load
            setTimeout(() => {
                mockImg.onload();
            }, 0);
            
            const result = await promise;
            expect(result).toBe('data:image/jpeg;base64,converted');
        });
    });

    describe('base64SvgToBase64Png', () => {
        test('returns null for empty input', async () => {
            const result = await imageUtil.base64SvgToBase64Png(null);
            expect(result).toBeNull();
        });

        test('converts SVG to PNG', async () => {
            const mockCtx = { drawImage: jest.fn() };
            const mockImg = {
                onload: null,
                src: '',
                naturalWidth: 100,
                naturalHeight: 100
            };
            const mockCanvasElem = {
                width: 0,
                height: 0,
                getContext: jest.fn(() => mockCtx),
                toDataURL: jest.fn(() => 'data:image/png;base64,converted')
            };
            
            document.createElement.mockImplementation((tag) => {
                if (tag === 'canvas') return mockCanvasElem;
                if (tag === 'img') return mockImg;
                return {};
            });
            
            const promise = imageUtil.base64SvgToBase64Png('data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=', 200);
            
            // Trigger image load
            setTimeout(() => {
                mockImg.onload();
            }, 0);
            
            const result = await promise;
            expect(result).toBe('data:image/png;base64,converted');
        });
    });

    describe('getScreenshot', () => {
        test('returns null when element not found', async () => {
            document.querySelector = jest.fn(() => null);
            
            const result = await imageUtil.getScreenshot('#nonexistent');
            expect(result).toBeNull();
        });
    });

    describe('canvasToBlob', () => {
        test('converts canvas to blob', async () => {
            const mockBlob = new Blob(['test'], { type: 'image/png' });
            const canvas = {
                toBlob: jest.fn((callback) => callback(mockBlob))
            };
            
            const result = await imageUtil.canvasToBlob(canvas);
            expect(result).toBe(mockBlob);
        });
    });

    describe('getEmptyImage', () => {
        test('returns empty GIF data URL', () => {
            const result = imageUtil.getEmptyImage();
            expect(result).toBe('data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=');
        });
    });

    describe('getImageDimensionsFromDataUrl', () => {
        test('returns empty object for null input', async () => {
            const result = await imageUtil.getImageDimensionsFromDataUrl(null);
            expect(result).toEqual({});
        });

        test('returns dimensions from data URL', async () => {
            const mockImg = {
                onload: null,
                src: '',
                naturalWidth: 200,
                naturalHeight: 100
            };
            global.Image = jest.fn(() => mockImg);
            
            const promise = imageUtil.getImageDimensionsFromDataUrl('data:image/png;base64,abc');
            
            setTimeout(() => {
                mockImg.onload();
            }, 0);
            
            const result = await promise;
            expect(result).toHaveProperty('width', 200);
            expect(result).toHaveProperty('height', 100);
            expect(result).toHaveProperty('ratio', 2);
        });
    });

    describe('getImageDimensionsFromImg', () => {
        test('returns empty object for null input', () => {
            expect(imageUtil.getImageDimensionsFromImg(null)).toEqual({});
        });

        test('returns dimensions from img element', () => {
            const img = {
                naturalWidth: 400,
                naturalHeight: 200
            };
            
            const result = imageUtil.getImageDimensionsFromImg(img);
            expect(result).toEqual({
                width: 400,
                height: 200,
                ratio: 2
            });
        });

        test('uses client dimensions when natural dimensions are 0', () => {
            const img = {
                naturalWidth: 0,
                naturalHeight: 0,
                clientWidth: 300,
                clientHeight: 150
            };
            
            const result = imageUtil.getImageDimensionsFromImg(img);
            expect(result.width).toBe(300);
            expect(result.height).toBe(150);
        });
    });

    describe('allImagesLoaded', () => {
        test('resolves true when no images', async () => {
            document.images = [];
            
            const result = await imageUtil.allImagesLoaded();
            expect(result).toBe(true);
        });

        test('resolves true when images are complete', async () => {
            document.images = [
                { complete: true, naturalHeight: 100 },
                { complete: true, naturalHeight: 200 }
            ];
            
            const result = await imageUtil.allImagesLoaded();
            expect(result).toBe(true);
        });

        test('resolves false when image has no natural height', async () => {
            document.images = [
                { complete: true, naturalHeight: 0 }
            ];
            
            const result = await imageUtil.allImagesLoaded();
            expect(result).toBe(false);
        });
    });

    describe('dataStringToBase64', () => {
        test('extracts base64 from data string', () => {
            const result = imageUtil.dataStringToBase64('data:image/png;base64,abc123xyz');
            expect(result).toBe('abc123xyz');
        });

        test('handles empty string', () => {
            const result = imageUtil.dataStringToBase64('');
            expect(result).toBe('');
        });
    });

    describe('urlToBase64', () => {
        test('resolves null when conversion fails', async () => {
            const mockImg = {
                onload: null,
                onerror: null,
                src: '',
                crossOrigin: null
            };
            global.Image = jest.fn(() => mockImg);
            
            const promise = imageUtil.urlToBase64('http://example.com/image.jpg');
            
            setTimeout(() => {
                mockImg.onerror();
            }, 0);
            
            const result = await promise;
            expect(result).toBeNull();
        });
    });
});

