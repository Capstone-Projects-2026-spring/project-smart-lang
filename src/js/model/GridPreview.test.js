import { GridPreview } from './GridPreview';

describe('GridPreview', () => {
    const baseData = {
        name: 'Test Grid',
        url: '/grids/test.json',
        languages: ['en', 'de']
    };

    test('constructor creates instance with required data', () => {
        const preview = new GridPreview(baseData);
        expect(preview.name).toBe('Test Grid');
        expect(preview.url).toBe('/grids/test.json');
        expect(preview.languages).toEqual(['en', 'de']);
    });

    test('constructor applies baseUrl to url', () => {
        const preview = new GridPreview(baseData, { baseUrl: 'https://example.com' });
        expect(preview.url).toBe('https://example.com/grids/test.json');
    });

    test('constructor extracts filename from url', () => {
        const preview = new GridPreview(baseData);
        expect(preview.filename).toBe('test.json');
    });

    test('constructor sets selfContained property', () => {
        const data = { ...baseData, selfContained: true };
        const preview = new GridPreview(data);
        expect(preview.selfContained).toBe(true);
    });

    test('constructor sets author property', () => {
        const data = { ...baseData, author: 'Test Author' };
        const preview = new GridPreview(data);
        expect(preview.author).toBe('Test Author');
    });

    test('constructor sets website property', () => {
        const data = { ...baseData, website: 'https://author.com' };
        const preview = new GridPreview(data);
        expect(preview.website).toBe('https://author.com');
    });

    test('constructor sets description property', () => {
        const data = { ...baseData, description: 'A test grid' };
        const preview = new GridPreview(data);
        expect(preview.description).toBe('A test grid');
    });

    test('constructor handles localized description', () => {
        const data = { ...baseData, description: { en: 'English desc', de: 'German desc' } };
        const preview = new GridPreview(data);
        expect(preview.description).toEqual({ en: 'English desc', de: 'German desc' });
    });

    test('constructor handles localized name', () => {
        const data = { ...baseData, name: { en: 'English name', de: 'German name' } };
        const preview = new GridPreview(data);
        expect(preview.name).toEqual({ en: 'English name', de: 'German name' });
    });

    test('constructor sets wordPrediction property', () => {
        const data = { ...baseData, wordPrediction: true };
        const preview = new GridPreview(data);
        expect(preview.wordPrediction).toBe(true);
    });

    test('constructor sets translate property', () => {
        const data = { ...baseData, translate: true };
        const preview = new GridPreview(data);
        expect(preview.translate).toBe(true);
    });

    test('constructor applies baseUrl to images', () => {
        const data = { ...baseData, images: ['/img/1.png', '/img/2.png'] };
        const preview = new GridPreview(data, { baseUrl: 'https://example.com' });
        expect(preview.images).toEqual([
            'https://example.com/img/1.png',
            'https://example.com/img/2.png'
        ]);
    });

    test('constructor handles empty images array', () => {
        const preview = new GridPreview(baseData);
        expect(preview.images).toEqual([]);
    });

    test('constructor applies baseUrl to thumbnail', () => {
        const data = { ...baseData, thumbnail: '/thumb/test.png' };
        const preview = new GridPreview(data, { baseUrl: 'https://example.com' });
        expect(preview.thumbnail).toBe('https://example.com/thumb/test.png');
    });

    test('constructor handles undefined thumbnail', () => {
        const preview = new GridPreview(baseData);
        expect(preview.thumbnail).toBeUndefined();
    });

    test('constructor sets tags property', () => {
        const data = { ...baseData, tags: ['AAC', 'symbols'] };
        const preview = new GridPreview(data);
        expect(preview.tags).toEqual(['AAC', 'symbols']);
    });

    test('constructor defaults tags to empty array', () => {
        const preview = new GridPreview(baseData);
        expect(preview.tags).toEqual([]);
    });

    test('constructor sets generateGlobalGrid property', () => {
        const data = { ...baseData, generateGlobalGrid: true };
        const preview = new GridPreview(data);
        expect(preview.generateGlobalGrid).toBe(true);
    });

    test('constructor defaults generateGlobalGrid to false', () => {
        const preview = new GridPreview(baseData);
        expect(preview.generateGlobalGrid).toBe(false);
    });

    test('constructor sets pdf property', () => {
        const data = { ...baseData, pdf: '/pdfs/test.pdf' };
        const preview = new GridPreview(data);
        expect(preview.pdf).toBe('/pdfs/test.pdf');
    });

    test('constructor sets priority property', () => {
        const data = { ...baseData, priority: 10 };
        const preview = new GridPreview(data);
        expect(preview.priority).toBe(10);
    });

    test('constructor defaults priority to 0', () => {
        const preview = new GridPreview(baseData);
        expect(preview.priority).toBe(0);
    });

    test('constructor handles priority as object', () => {
        const data = { ...baseData, priority: { en: 10, de: 5 } };
        const preview = new GridPreview(data);
        expect(preview.priority).toEqual({ en: 10, de: 5 });
    });

    test('constructor defaults languages to empty array', () => {
        const data = { name: 'Test', url: '/test.json' };
        const preview = new GridPreview(data);
        expect(preview.languages).toEqual([]);
    });

    test('constructor sets githubUrl when githubEditable is true', () => {
        const data = { ...baseData, url: '/grids/path/test.json' };
        const preview = new GridPreview(data, {
            baseUrl: 'https://example.com',
            githubEditable: true,
            githubBaseUrl: 'https://github.com/repo'
        });
        expect(preview.githubUrl).toBe('https://github.com/repo/grids/path');
    });

    test('constructor does not set githubUrl when githubEditable is false', () => {
        const preview = new GridPreview(baseData, {
            baseUrl: '',
            githubEditable: false,
            githubBaseUrl: 'https://github.com/repo'
        });
        expect(preview.githubUrl).toBeUndefined();
    });

    test('constructor handles default options', () => {
        const preview = new GridPreview(baseData);
        expect(preview.url).toBe('/grids/test.json');
        expect(preview.githubUrl).toBeUndefined();
    });
});
