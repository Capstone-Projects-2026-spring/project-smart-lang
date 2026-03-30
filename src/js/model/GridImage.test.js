jest.mock('../externals/objectmodel', () => ({
    Model: (definition) => {
        return class {
            static definition = definition;

            static defaults(defaults) {
                this._defaults = defaults;
            }

            constructor(properties = {}) {
                Object.assign(this, this.constructor._defaults || {}, properties);
            }
        };
    }
}));

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
        generateId: jest.fn(() => 'grid-image-1-100')
    }
}));

jest.mock('../util/imageUtil', () => ({
    imageUtil: {
        getImageDimensionsFromDataUrl: jest.fn(() => ({ width: 100, height: 100 }))
    }
}));

import { GridImage } from './GridImage';
import { imageUtil } from '../util/imageUtil';

describe('GridImage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('getModelName returns correct name', () => {
        expect(GridImage.getModelName()).toBe('GridImage');
    });

    test('getIdPrefix returns correct prefix', () => {
        expect(GridImage.getIdPrefix()).toBe('grid-image');
    });

    test('constructor applies defaults', () => {
        const image = new GridImage();
        expect(image.data).toBe(null);
        expect(image.author).toBe(null);
        expect(image.authorURL).toBe(null);
    });

    test('constructor accepts properties', () => {
        const image = new GridImage({
            data: 'data:image/png;base64,abc123',
            author: 'Test Author',
            authorURL: 'https://example.com'
        });
        expect(image.data).toBe('data:image/png;base64,abc123');
        expect(image.author).toBe('Test Author');
        expect(image.authorURL).toBe('https://example.com');
    });

    test('getImageType returns null when no data or url', () => {
        const image = new GridImage();
        expect(image.getImageType()).toBe(null);
    });

    test('getImageType returns PNG for png data url', () => {
        const image = new GridImage({
            data: 'data:image/png;base64,abc123'
        });
        expect(image.getImageType()).toBe(GridImage.IMAGE_TYPES.PNG);
    });

    test('getImageType returns JPEG for jpeg data url', () => {
        const image = new GridImage({
            data: 'data:image/jpeg;base64,abc123'
        });
        expect(image.getImageType()).toBe(GridImage.IMAGE_TYPES.JPEG);
    });

    test('getImageType returns SVG for svg data url', () => {
        const image = new GridImage({
            data: 'data:image/svg+xml;base64,abc123'
        });
        expect(image.getImageType()).toBe(GridImage.IMAGE_TYPES.SVG);
    });

    test('getImageType returns PNG for arasaac url', () => {
        const image = new GridImage({
            url: 'https://api.arasaac.org/api/pictograms/123'
        });
        expect(image.getImageType()).toBe(GridImage.IMAGE_TYPES.PNG);
    });

    test('getImageType returns JPEG for jpeg url', () => {
        const image = new GridImage({
            url: 'https://example.com/image.jpeg'
        });
        expect(image.getImageType()).toBe(GridImage.IMAGE_TYPES.JPEG);
    });

    test('getImageType returns JPEG for jpg url', () => {
        const image = new GridImage({
            url: 'https://example.com/image.JPG'
        });
        expect(image.getImageType()).toBe(GridImage.IMAGE_TYPES.JPEG);
    });

    test('getImageType returns PNG for png url', () => {
        const image = new GridImage({
            url: 'https://example.com/image.PNG'
        });
        expect(image.getImageType()).toBe(GridImage.IMAGE_TYPES.PNG);
    });

    test('getImageType returns SVG for svg url', () => {
        const image = new GridImage({
            url: 'https://example.com/image.svg'
        });
        expect(image.getImageType()).toBe(GridImage.IMAGE_TYPES.SVG);
    });

    test('getDimensions calls imageUtil.getImageDimensionsFromDataUrl', () => {
        const image = new GridImage({
            data: 'data:image/png;base64,abc123'
        });
        const dimensions = image.getDimensions();
        expect(imageUtil.getImageDimensionsFromDataUrl).toHaveBeenCalledWith('data:image/png;base64,abc123');
        expect(dimensions).toEqual({ width: 100, height: 100 });
    });

    test('IMAGE_TYPES constants are defined', () => {
        expect(GridImage.IMAGE_TYPES.PNG).toBe('PNG');
        expect(GridImage.IMAGE_TYPES.JPEG).toBe('JPEG');
        expect(GridImage.IMAGE_TYPES.SVG).toBe('SVG');
    });

    test('copies values from elementToCopy through setDefaults', () => {
        const copy = {
            data: 'data:image/png;base64,copied',
            author: 'Copied Author'
        };
        const image = new GridImage({}, copy);
        expect(image.data).toBe('data:image/png;base64,copied');
        expect(image.author).toBe('Copied Author');
    });
});
