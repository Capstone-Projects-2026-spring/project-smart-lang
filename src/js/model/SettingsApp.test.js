jest.mock('../service/data/convertServiceLocal.js', () => ({
    convertServiceLocal: {
        updateDataModel: jest.fn()
    }
}));

import { SettingsApp } from './SettingsApp';
import { convertServiceLocal } from '../service/data/convertServiceLocal.js';

describe('SettingsApp', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('applies constructor defaults and updates data model', () => {
        const settings = new SettingsApp({});
        expect(settings.appLang).toBe('');
        expect(settings.modelVersion).toBeUndefined();
        expect(convertServiceLocal.updateDataModel).toHaveBeenCalledWith(settings);
    });

    test('keeps provided values', () => {
        const settings = new SettingsApp({ appLang: 'en', modelVersion: 'x', syncNavigation: true });
        expect(settings.appLang).toBe('en');
        expect(settings.modelVersion).toBe('x');
        expect(settings.syncNavigation).toBe(true);
    });
});
