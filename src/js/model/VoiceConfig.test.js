import { VoiceConfig } from './VoiceConfig';

describe('VoiceConfig', () => {
    test('creates empty config by default', () => {
        const cfg = new VoiceConfig();
        expect(cfg.preferredVoice).toBeUndefined();
        expect(cfg.secondVoice).toBeUndefined();
        expect(cfg.voiceLangIsTextLang).toBeUndefined();
        expect(cfg.voicePitch).toBeUndefined();
        expect(cfg.voiceRate).toBeUndefined();
    });

    test('assigns all provided settings', () => {
        const cfg = new VoiceConfig({
            preferredVoice: 'A',
            secondVoice: 'B',
            voiceLangIsTextLang: true,
            voicePitch: 1.2,
            voiceRate: 0.8
        });

        expect(cfg.preferredVoice).toBe('A');
        expect(cfg.secondVoice).toBe('B');
        expect(cfg.voiceLangIsTextLang).toBe(true);
        expect(cfg.voicePitch).toBe(1.2);
        expect(cfg.voiceRate).toBe(0.8);
    });
});
