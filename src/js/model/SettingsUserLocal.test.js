jest.mock('../service/data/convertServiceLocal.js', () => ({
    convertServiceLocal: {
        updateDataModel: jest.fn()
    }
}));

import { SettingsUserLocal } from './SettingsUserLocal';
import { convertServiceLocal } from '../service/data/convertServiceLocal.js';
import { VoiceConfig } from './VoiceConfig.js';
import { IntegrationConfigLocal } from './IntegrationConfigLocal';

describe('SettingsUserLocal', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('applies defaults and invokes data model conversion', () => {
        const settings = new SettingsUserLocal({});
        expect(settings.isEmpty).toBe(true);
        expect(settings.systemVolume).toBe(100);
        expect(settings.systemVolumeMuted).toBe(false);
        expect(settings.integrations).toBeInstanceOf(IntegrationConfigLocal);
        expect(convertServiceLocal.updateDataModel).toHaveBeenCalledWith(settings);
    });

    test('voiceConfig becomes VoiceConfig when data exists', () => {
        const settings = new SettingsUserLocal({ voiceConfig: { preferredVoice: 'A' } });
        expect(settings.voiceConfig).toBeInstanceOf(VoiceConfig);
    });

    test('keeps provided fields', () => {
        const settings = new SettingsUserLocal({ username: 'u', isEmpty: false, systemVolume: 75, systemVolumeMuted: true });
        expect(settings.username).toBe('u');
        expect(settings.isEmpty).toBe(false);
        expect(settings.systemVolume).toBe(75);
        expect(settings.systemVolumeMuted).toBe(true);
    });
});
