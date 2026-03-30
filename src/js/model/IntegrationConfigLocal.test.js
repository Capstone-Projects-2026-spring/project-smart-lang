import { IntegrationConfigLocal } from './IntegrationConfigLocal';

describe('IntegrationConfigLocal', () => {
    test('constructor creates instance with empty data', () => {
        const config = new IntegrationConfigLocal();
        expect(config).toBeInstanceOf(IntegrationConfigLocal);
    });

    test('constructor accepts data object', () => {
        const data = { someKey: 'someValue' };
        const config = new IntegrationConfigLocal(data);
        expect(config).toBeInstanceOf(IntegrationConfigLocal);
    });

    test('constructor handles undefined data', () => {
        const config = new IntegrationConfigLocal(undefined);
        expect(config).toBeInstanceOf(IntegrationConfigLocal);
    });

    test('constructor handles null data', () => {
        const config = new IntegrationConfigLocal(null);
        expect(config).toBeInstanceOf(IntegrationConfigLocal);
    });
});
