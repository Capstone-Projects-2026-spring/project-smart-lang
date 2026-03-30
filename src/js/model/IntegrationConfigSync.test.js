import { IntegrationConfigSync } from './IntegrationConfigSync';

describe('IntegrationConfigSync', () => {
    test('constructor creates instance with empty podcasts array', () => {
        const config = new IntegrationConfigSync();
        expect(config).toBeInstanceOf(IntegrationConfigSync);
        expect(config.podcasts).toEqual([]);
    });

    test('constructor accepts data with podcasts', () => {
        const podcasts = [
            { name: 'Podcast 1', url: 'https://example.com/feed1' },
            { name: 'Podcast 2', url: 'https://example.com/feed2' }
        ];
        const config = new IntegrationConfigSync({ podcasts });
        expect(config.podcasts).toEqual(podcasts);
    });

    test('constructor handles empty object', () => {
        const config = new IntegrationConfigSync({});
        expect(config.podcasts).toEqual([]);
    });

    test('constructor handles data with undefined podcasts', () => {
        const config = new IntegrationConfigSync({ podcasts: undefined });
        expect(config.podcasts).toEqual([]);
    });
});
