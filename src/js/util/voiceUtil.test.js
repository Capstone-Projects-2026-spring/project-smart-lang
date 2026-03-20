import voiceUtil from './voiceUtil';

describe('voiceUtil.isVoiceOffline', () => {
    test('returns false when id or name is missing', () => {
        expect(voiceUtil.isVoiceOffline('', 'Any', true)).toBe(false);
        expect(voiceUtil.isVoiceOffline('id', '', true)).toBe(false);
    });

    test('returns false when localServiceProperty is false', () => {
        expect(voiceUtil.isVoiceOffline('id', 'Microsoft Voice', false)).toBe(false);
    });

    test('returns localServiceProperty for non Microsoft voices', () => {
        expect(voiceUtil.isVoiceOffline('google-id', 'Google US', true)).toBe(true);
    });

    test('returns false for Microsoft online or natural voices', () => {
        expect(voiceUtil.isVoiceOffline('microsoft-online-id', 'Some Voice', true)).toBe(false);
        expect(voiceUtil.isVoiceOffline('microsoft-id', 'Natural Voice', true)).toBe(false);
    });

    test('returns true for known Microsoft offline voices', () => {
        expect(voiceUtil.isVoiceOffline('Microsoft', 'Zira', true)).toBe(true);
    });

    test('returns false for unknown Microsoft voices', () => {
        expect(voiceUtil.isVoiceOffline('Microsoft', 'UnknownVoice', true)).toBe(false);
    });
});
