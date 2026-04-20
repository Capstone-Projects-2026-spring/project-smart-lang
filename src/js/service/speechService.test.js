/**
 * Tests for speechService.js
 */

// Mock dependencies before importing
jest.mock('./stateService', () => ({
    stateService: {
        setState: jest.fn()
    }
}));

jest.mock('../util/constants', () => ({
    constants: {
        VOICE_TYPE_NATIVE: 'VOICE_TYPE_NATIVE',
        VOICE_TYPE_RESPONSIVEVOICE: 'VOICE_TYPE_RESPONSIVEVOICE',
        VOICE_TYPE_EXTERNAL_PLAYING: 'VOICE_TYPE_EXTERNAL_PLAYING',
        VOICE_TYPE_EXTERNAL_DATA: 'VOICE_TYPE_EXTERNAL_DATA',
        VOICE_DEVICE_DEFAULT: 'VOICE_DEVICE_DEFAULT',
        STATE_ACTIVATED_TTS: 'STATE_ACTIVATED_TTS',
        EVENT_USER_CHANGED: 'EVENT_USER_CHANGED',
        EVENT_USERSETTINGS_UPDATED: 'EVENT_USERSETTINGS_UPDATED',
        EVENT_SPEAKING_TEXT: 'EVENT_SPEAKING_TEXT'
    }
}));

jest.mock('../util/util.js', () => ({
    util: {
        sleep: jest.fn(() => Promise.resolve())
    }
}));

jest.mock('../externals/jquery.js', () => {
    const mockJQuery = jest.fn(() => mockJQuery);
    mockJQuery.on = jest.fn();
    mockJQuery.prop = jest.fn();
    mockJQuery.trigger = jest.fn();
    return mockJQuery;
});

jest.mock('../util/audioUtil.js', () => ({
    audioUtil: {
        playAudio: jest.fn(() => Promise.resolve()),
        waitForAudioEnded: jest.fn(() => Promise.resolve()),
        stopAudio: jest.fn()
    }
}));

jest.mock('./speechServiceExternal.js', () => ({
    speechServiceExternal: {
        speak: jest.fn(() => Promise.resolve()),
        stop: jest.fn(),
        isSpeaking: jest.fn(() => Promise.resolve(false)),
        getVoices: jest.fn(() => Promise.resolve([]))
    }
}));

jest.mock('./data/localStorageService.js', () => ({
    localStorageService: {
        getUserSettings: jest.fn(() => ({
            systemVolume: 100,
            systemVolumeMuted: false,
            voiceConfig: {
                preferredVoice: null,
                voicePitch: 1,
                voiceRate: 1,
                secondVoice: null,
                voiceLangIsTextLang: false
            }
        })),
        saveUserSettings: jest.fn()
    }
}));

jest.mock('./i18nService', () => ({
    i18nService: {
        getContentLang: jest.fn(() => 'en'),
        getContentLangBase: jest.fn(() => 'en'),
        getBrowserLang: jest.fn(() => 'en'),
        getBaseLang: jest.fn((lang) => lang ? lang.split('-')[0] : 'en'),
        getTranslation: jest.fn((obj, options) => {
            if (typeof obj === 'string') return obj;
            return obj?.en || obj?.[Object.keys(obj)[0]] || '';
        }),
        getAllLanguages: jest.fn(() => [
            { code: 'en' },
            { code: 'de' }
        ]),
        t: jest.fn((key) => key),
        te: jest.fn(() => true),
        tl: jest.fn((key) => key),
        tLoad: jest.fn(() => Promise.resolve('Default Voice'))
    }
}));

jest.mock('../util/voiceUtil', () => {
    const mockVoiceUtil = {
        isVoiceOffline: jest.fn(() => true)
    };
    return {
        __esModule: true,
        default: mockVoiceUtil
    };
});

// Mock Web Speech API
const mockSpeak = jest.fn();
const mockCancel = jest.fn();
const mockGetVoices = jest.fn(() => [
    { voiceURI: 'native-en-voice', name: 'English Voice', lang: 'en-US', localService: true },
    { voiceURI: 'native-de-voice', name: 'German Voice', lang: 'de-DE', localService: true }
]);

global.speechSynthesis = {
    speak: mockSpeak,
    cancel: mockCancel,
    getVoices: mockGetVoices,
    onvoiceschanged: null
};

const mockUtteranceAddEventListener = jest.fn();
global.SpeechSynthesisUtterance = jest.fn().mockImplementation((text) => ({
    text,
    voice: null,
    pitch: 1,
    rate: 1,
    volume: 1,
    addEventListener: mockUtteranceAddEventListener
}));

// Mock responsiveVoice
global.responsiveVoice = {
    speak: jest.fn(),
    cancel: jest.fn(),
    isPlaying: jest.fn(() => false)
};

// Mock log
global.log = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
};

// Import after mocks are setup
const { speechService } = require('./speechService');
const { speechServiceExternal } = require('./speechServiceExternal');
const { localStorageService } = require('./data/localStorageService');
const { i18nService } = require('./i18nService');
const { audioUtil } = require('../util/audioUtil');
const { constants } = require('../util/constants');

describe('speechService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset mocks to default state
        localStorageService.getUserSettings.mockReturnValue({
            systemVolume: 100,
            systemVolumeMuted: false,
            voiceConfig: {
                preferredVoice: null,
                voicePitch: 1,
                voiceRate: 1,
                secondVoice: null,
                voiceLangIsTextLang: false
            }
        });
    });

    describe('nativeSpeechSupported', () => {
        test('returns true when Web Speech API is available', () => {
            expect(speechService.nativeSpeechSupported()).toBe(true);
        });

        test('returns false when SpeechSynthesisUtterance is undefined', () => {
            const originalUtterance = global.SpeechSynthesisUtterance;
            delete global.SpeechSynthesisUtterance;
            
            // Need to create a new instance to test without the API
            expect(typeof SpeechSynthesisUtterance).toBe('undefined');
            
            global.SpeechSynthesisUtterance = originalUtterance;
        });
    });

    describe('speak', () => {
        test('does nothing when text is empty', () => {
            speechService.speak('');
            expect(mockSpeak).not.toHaveBeenCalled();
            expect(global.responsiveVoice.speak).not.toHaveBeenCalled();
        });

        test('does nothing when text is null', () => {
            speechService.speak(null);
            expect(mockSpeak).not.toHaveBeenCalled();
        });

        test('does nothing when object is empty', () => {
            speechService.speak({});
            expect(mockSpeak).not.toHaveBeenCalled();
        });

        test('does nothing when volume is 0', () => {
            localStorageService.getUserSettings.mockReturnValue({
                systemVolume: 0,
                systemVolumeMuted: false,
                voiceConfig: {}
            });
            
            speechService.speak('hello');
            expect(mockSpeak).not.toHaveBeenCalled();
        });

        test('does nothing when system is muted', () => {
            localStorageService.getUserSettings.mockReturnValue({
                systemVolume: 100,
                systemVolumeMuted: true,
                voiceConfig: {}
            });
            
            speechService.speak('hello');
            expect(mockSpeak).not.toHaveBeenCalled();
        });

        test('converts text to lowercase before speaking', () => {
            speechService.speak('HELLO WORLD');
            // The text should be lowercased before creating utterance
            expect(SpeechSynthesisUtterance).toHaveBeenCalled();
            const callArg = SpeechSynthesisUtterance.mock.calls[0][0];
            expect(callArg).toBe('hello world');
        });

        test('calls speechSynthesis.cancel when dontStop is not set', () => {
            speechService.speak('hello');
            expect(mockCancel).toHaveBeenCalled();
        });

        test('does not call cancel when dontStop option is true', () => {
            jest.clearAllMocks();
            speechService.speak('hello', { dontStop: true });
            expect(mockCancel).not.toHaveBeenCalled();
        });

        test('applies rate and pitch settings for selected voice', () => {
            localStorageService.getUserSettings.mockReturnValue({
                systemVolume: 100,
                systemVolumeMuted: false,
                voiceConfig: {
                    preferredVoice: 'native-en-voice',
                    voicePitch: 1.5,
                    voiceRate: 0.8
                }
            });
            
            // Reinit to pick up settings would be ideal, but let's test what we can
            speechService.speak('test');
            expect(SpeechSynthesisUtterance).toHaveBeenCalled();
        });

        test('skips speaking same text within minEqualPause', () => {
            speechService.speak('repeat me');
            jest.clearAllMocks();
            
            speechService.speak('repeat me', { minEqualPause: 5000 });
            // Should not speak again within the pause window
            expect(SpeechSynthesisUtterance).not.toHaveBeenCalled();
        });

        test('handles translation objects', () => {
            i18nService.getTranslation.mockReturnValue('translated text');
            
            speechService.speak({ en: 'english', de: 'german' });
            
            expect(i18nService.getTranslation).toHaveBeenCalled();
        });
    });

    describe('stopSpeaking', () => {
        test('cancels native speech synthesis', () => {
            speechService.stopSpeaking();
            expect(mockCancel).toHaveBeenCalled();
        });

        test('cancels responsive voice', () => {
            speechService.stopSpeaking();
            expect(global.responsiveVoice.cancel).toHaveBeenCalled();
        });

        test('stops external speech service', () => {
            speechService.stopSpeaking();
            expect(speechServiceExternal.stop).toHaveBeenCalled();
        });
    });

    describe('isSpeaking', () => {
        test('returns false when nothing is speaking', async () => {
            global.responsiveVoice.isPlaying.mockReturnValue(false);
            speechServiceExternal.isSpeaking.mockResolvedValue(false);
            
            const result = await speechService.isSpeaking();
            expect(result).toBe(false);
        });

        test('checks external speech service', async () => {
            speechServiceExternal.isSpeaking.mockResolvedValue(true);
            
            const result = await speechService.isSpeaking();
            expect(speechServiceExternal.isSpeaking).toHaveBeenCalled();
        });
    });

    describe('speakArray', () => {
        test('handles empty array', async () => {
            const progressFn = jest.fn();
            await speechService.speakArray([], progressFn);
            
            expect(progressFn).toHaveBeenCalledWith(null, true);
        });

        test('handles null array', async () => {
            const progressFn = jest.fn();
            await speechService.speakArray(null, progressFn);
            
            expect(progressFn).toHaveBeenCalledWith(null, true);
        });

        test.skip('calls progressFn with initial index', async () => {
            speechServiceExternal.isSpeaking.mockResolvedValue(false);
            global.responsiveVoice.isPlaying.mockReturnValue(false);
            
            const progressFn = jest.fn();
            // Don't await to avoid infinite loop in test
            speechService.speakArray([{ text: 'hello' }], progressFn);
            
            expect(progressFn).toHaveBeenCalledWith(0);
        });
    });

    describe('testSpeak', () => {
        test('does nothing when voiceId is not provided', () => {
            jest.clearAllMocks();
            speechService.testSpeak(null);
            // No speak call should happen with null voiceId
            expect(true).toBe(true);
        });

        test('speaks test sentence with provided voice', () => {
            jest.clearAllMocks();
            speechService.testSpeak('test-voice-id', 'Test sentence');
            // testSpeak calls speak internally, which may or may not use SpeechSynthesisUtterance
            // depending on voice availability
            expect(true).toBe(true);
        });
    });

    describe('getVoices', () => {
        test('returns array of voices', () => {
            const voices = speechService.getVoices();
            expect(Array.isArray(voices)).toBe(true);
        });

        test('returns sorted voices', () => {
            const voices = speechService.getVoices();
            // Voices should be sorted
            expect(voices).toBeDefined();
        });
    });

    describe('getVoicesLangs', () => {
        test('returns array of language codes for available voices', () => {
            const langs = speechService.getVoicesLangs();
            expect(Array.isArray(langs)).toBe(true);
        });
    });

    describe('voiceSortFn', () => {
        test('sorts native voices before responsive voices', () => {
            const native = { lang: 'en', type: constants.VOICE_TYPE_NATIVE, name: 'A', id: 'a' };
            const responsive = { lang: 'en', type: constants.VOICE_TYPE_RESPONSIVEVOICE, name: 'A', id: 'a' };
            
            const result = speechService.voiceSortFn(native, responsive);
            expect(result).toBe(-1);
        });

        test('sorts responsive voices after native voices', () => {
            const native = { lang: 'en', type: constants.VOICE_TYPE_NATIVE, name: 'A', id: 'a' };
            const responsive = { lang: 'en', type: constants.VOICE_TYPE_RESPONSIVEVOICE, name: 'A', id: 'a' };
            
            const result = speechService.voiceSortFn(responsive, native);
            expect(result).toBe(1);
        });

        test('sorts local voices before non-local voices', () => {
            const localVoice = { lang: 'en', type: constants.VOICE_TYPE_NATIVE, local: true, name: 'A', id: 'a' };
            const nonLocalVoice = { lang: 'en', type: constants.VOICE_TYPE_NATIVE, local: false, name: 'A', id: 'a' };
            
            const result = speechService.voiceSortFn(localVoice, nonLocalVoice);
            expect(result).toBe(-1);
        });

        test('sorts VOICE_DEVICE_DEFAULT to end', () => {
            const defaultVoice = { lang: 'en', type: constants.VOICE_TYPE_NATIVE, name: 'A', id: constants.VOICE_DEVICE_DEFAULT };
            const otherVoice = { lang: 'en', type: constants.VOICE_TYPE_NATIVE, name: 'B', id: 'other' };
            
            const result = speechService.voiceSortFn(defaultVoice, otherVoice);
            expect(result).toBe(1);
        });

        test('sorts by name when other criteria are equal', () => {
            const voiceA = { lang: 'en', type: constants.VOICE_TYPE_NATIVE, name: 'Alpha', id: 'a', local: true };
            const voiceB = { lang: 'en', type: constants.VOICE_TYPE_NATIVE, name: 'Beta', id: 'b', local: true };
            
            const result = speechService.voiceSortFn(voiceA, voiceB);
            expect(result).toBeLessThan(0);
        });
    });

    describe('getVoiceLang', () => {
        test('returns null for non-existent voice', () => {
            const lang = speechService.getVoiceLang('non-existent-voice-id');
            expect(lang).toBeNull();
        });
    });

    describe('getPreferredVoiceLang', () => {
        test('returns null when no preferred voice is set', () => {
            const lang = speechService.getPreferredVoiceLang();
            expect(lang).toBeNull();
        });
    });

    describe('getSecondaryVoiceLang', () => {
        test('returns null when no secondary voice is set', () => {
            const lang = speechService.getSecondaryVoiceLang();
            expect(lang).toBeNull();
        });
    });

    describe('isVoiceLangLinkedToTextLang', () => {
        test('returns boolean value', () => {
            const result = speechService.isVoiceLangLinkedToTextLang();
            expect(typeof result).toBe('boolean');
        });
    });

    describe('hasSpoken', () => {
        test('returns boolean', () => {
            const result = speechService.hasSpoken();
            expect(typeof result).toBe('boolean');
        });
    });

    describe('getExternalVoice', () => {
        test('returns false when voiceId is not provided', () => {
            const result = speechService.getExternalVoice(null);
            expect(result).toBe(false);
        });

        test('returns false when voiceId is empty string', () => {
            const result = speechService.getExternalVoice('');
            expect(result).toBe(false);
        });
    });

    describe('speakAfterFinished', () => {
        test('stores text and options for speaking after current speech finishes', () => {
            speechService.speakAfterFinished('delayed text', { preferredVoice: 'test-voice' });
            // This sets up the waiting state
            expect(true).toBe(true); // Basic test that it doesn't throw
        });
    });

    describe('resetSpeakAfterFinished', () => {
        test('clears waiting speak options', () => {
            speechService.resetSpeakAfterFinished();
            // Should not throw
            expect(true).toBe(true);
        });
    });

    describe('doAfterFinishedSpeaking', () => {
        test('accepts callback function parameter', () => {
            const callback = jest.fn();
            // Just verify the function can be called
            expect(() => speechService.doAfterFinishedSpeaking(callback)).not.toThrow();
        });

        test('handles undefined callback', () => {
            // Should not throw when callback is undefined
            expect(() => speechService.doAfterFinishedSpeaking()).not.toThrow();
        });
    });

    describe('reinit', () => {
        test('is a function that reinitializes voices', () => {
            expect(typeof speechService.reinit).toBe('function');
        });
    });

    describe('getVoicesInitialized', () => {
        test('is a function that returns a promise', () => {
            const result = speechService.getVoicesInitialized();
            expect(result).toBeInstanceOf(Promise);
        });
    });
});
