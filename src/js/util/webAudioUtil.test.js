// Mock dependencies
jest.mock('./log', () => ({
    log: {
        warn: jest.fn(),
        debug: jest.fn()
    }
}));

jest.mock('./constants', () => ({
    constants: {
        EVENT_USERSETTINGS_UPDATED: 'EVENT_USERSETTINGS_UPDATED',
        EVENT_USER_CHANGED: 'EVENT_USER_CHANGED'
    }
}));

jest.mock('../service/data/localStorageService', () => ({
    localStorageService: {
        getUserSettings: jest.fn(() => ({
            systemVolume: 100,
            systemVolumeMuted: false
        }))
    }
}));

jest.mock('../vue/mainVue', () => ({
    MainVue: {
        setTooltip: jest.fn()
    }
}));

jest.mock('../service/i18nService', () => ({
    i18nService: {
        t: jest.fn((key, value) => `${key}: ${value}`)
    }
}));

// Mock jQuery module - define before importing
const mockOn = jest.fn();
const mockJQuery = jest.fn(() => ({ on: mockOn }));
mockJQuery.fn = {};

jest.mock('../externals/jquery.js', () => {
    return {
        default: mockJQuery
    };
});

// Mock DOM elements
const mockAudioPlayer = {
    src: '',
    volume: 1,
    currentTime: 0,
    paused: true,
    ended: false,
    readyState: 4,
    duration: 100,
    play: jest.fn(),
    pause: jest.fn()
};

const mockVideoPlayer = {
    src: '',
    volume: 1,
    currentTime: 0,
    paused: true,
    ended: false,
    readyState: 4,
    duration: 100,
    play: jest.fn(),
    pause: jest.fn()
};

global.document = {
    getElementById: jest.fn((id) => {
        if (id === 'audioPlayer') return mockAudioPlayer;
        if (id === 'videoPlayer') return mockVideoPlayer;
        return null;
    }),
    on: mockOn
};

global.log = {
    debug: jest.fn(),
    warn: jest.fn()
};

import { webAudioUtil } from './webAudioUtil';
import { localStorageService } from '../service/data/localStorageService';
import { MainVue } from '../vue/mainVue';
import { i18nService } from '../service/i18nService';

describe('webAudioUtil', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockAudioPlayer.src = '';
        mockAudioPlayer.volume = 1;
        mockAudioPlayer.currentTime = 0;
        mockAudioPlayer.paused = true;
        mockAudioPlayer.ended = false;
        mockAudioPlayer.readyState = 4;
        
        mockVideoPlayer.src = '';
        mockVideoPlayer.volume = 1;
        mockVideoPlayer.currentTime = 0;
        mockVideoPlayer.paused = true;
        mockVideoPlayer.ended = false;
        mockVideoPlayer.readyState = 4;
    });

    describe('playUrl', () => {
        test('returns early if no URL provided', async () => {
            await webAudioUtil.playUrl(null);
            expect(mockAudioPlayer.play).not.toHaveBeenCalled();
        });

        test('sets audio source and plays', async () => {
            await webAudioUtil.playUrl('http://example.com/audio.mp3');
            
            expect(mockAudioPlayer.src).toBe('http://example.com/audio.mp3');
            expect(mockAudioPlayer.play).toHaveBeenCalled();
        });
    });

    describe('pause', () => {
        test('pauses both audio and video players', () => {
            webAudioUtil.pause();
            
            expect(mockAudioPlayer.pause).toHaveBeenCalled();
            expect(mockVideoPlayer.pause).toHaveBeenCalled();
        });
    });

    describe('resume', () => {
        test('resumes audio player when not playing video', () => {
            webAudioUtil.resume();
            expect(mockAudioPlayer.play).toHaveBeenCalled();
        });
    });

    describe('isPlaying', () => {
        test('returns false when both players are paused', () => {
            mockAudioPlayer.paused = true;
            mockVideoPlayer.paused = true;
            
            expect(webAudioUtil.isPlaying()).toBe(false);
        });

        test('returns true when audio is playing', () => {
            mockAudioPlayer.currentTime = 1;
            mockAudioPlayer.paused = false;
            mockAudioPlayer.ended = false;
            mockAudioPlayer.readyState = 4;
            
            expect(webAudioUtil.isPlaying()).toBe(true);
        });
    });

    describe('isPaused', () => {
        test('returns true when audio is paused at non-zero position', () => {
            mockAudioPlayer.paused = true;
            mockAudioPlayer.currentTime = 5;
            mockAudioPlayer.ended = false;
            
            expect(webAudioUtil.isPaused()).toBe(true);
        });

        test('returns false when audio is not paused', () => {
            mockAudioPlayer.paused = false;
            mockAudioPlayer.currentTime = 5;
            
            expect(webAudioUtil.isPaused()).toBe(false);
        });
    });

    describe('seek', () => {
        test('does nothing when not playing', () => {
            mockAudioPlayer.paused = true;
            mockAudioPlayer.currentTime = 10;
            
            webAudioUtil.seek(30);
            
            expect(mockAudioPlayer.currentTime).toBe(10);
        });

        test('seeks forward when playing', () => {
            mockAudioPlayer.currentTime = 10;
            mockAudioPlayer.paused = false;
            mockAudioPlayer.ended = false;
            mockAudioPlayer.readyState = 4;
            mockAudioPlayer.duration = 100;
            
            webAudioUtil.seek(20);
            
            expect(mockAudioPlayer.currentTime).toBe(30);
        });

        test('seeks backward with negative value', () => {
            mockAudioPlayer.currentTime = 50;
            mockAudioPlayer.paused = false;
            mockAudioPlayer.ended = false;
            mockAudioPlayer.readyState = 4;
            mockAudioPlayer.duration = 100;
            
            webAudioUtil.seek(-20);
            
            expect(mockAudioPlayer.currentTime).toBe(30);
        });

        test('clamps to minimum 0', () => {
            mockAudioPlayer.currentTime = 10;
            mockAudioPlayer.paused = false;
            mockAudioPlayer.ended = false;
            mockAudioPlayer.readyState = 4;
            mockAudioPlayer.duration = 100;
            
            webAudioUtil.seek(-30);
            
            expect(mockAudioPlayer.currentTime).toBe(0);
        });

        test('clamps to maximum duration', () => {
            mockAudioPlayer.currentTime = 90;
            mockAudioPlayer.paused = false;
            mockAudioPlayer.ended = false;
            mockAudioPlayer.readyState = 4;
            mockAudioPlayer.duration = 100;
            
            webAudioUtil.seek(30);
            
            expect(mockAudioPlayer.currentTime).toBe(100);
        });
    });

    describe('setCurrentTime', () => {
        test('sets audio player current time', () => {
            webAudioUtil.setCurrentTime(30);
            expect(mockAudioPlayer.currentTime).toBe(30);
        });

        test('defaults to 0 when no parameter', () => {
            mockAudioPlayer.currentTime = 50;
            webAudioUtil.setCurrentTime();
            expect(mockAudioPlayer.currentTime).toBe(0);
        });
    });

    describe('getPlayPosition', () => {
        test('returns audio player current time', () => {
            mockAudioPlayer.currentTime = 45;
            expect(webAudioUtil.getPlayPosition()).toBe(45);
        });
    });

    describe('volumeUp', () => {
        test('increases volume by step', () => {
            webAudioUtil.setVolume(0.5);
            const result = webAudioUtil.volumeUp();
            
            expect(result).toBeCloseTo(0.65, 2);
        });

        test('caps at 1.0', () => {
            webAudioUtil.setVolume(0.95);
            const result = webAudioUtil.volumeUp();
            
            expect(result).toBe(1);
        });
    });

    describe('volumeDown', () => {
        test('decreases volume by step', () => {
            webAudioUtil.setVolume(0.5);
            const result = webAudioUtil.volumeDown();
            
            expect(result).toBeCloseTo(0.35, 2);
        });

        test('floors at 0', () => {
            webAudioUtil.setVolume(0.1);
            const result = webAudioUtil.volumeDown();
            
            expect(result).toBe(0);
        });
    });

    describe('setVolume', () => {
        test('sets volume on both players', () => {
            webAudioUtil.setVolume(0.8);
            
            expect(mockAudioPlayer.volume).toBe(0.8);
            expect(mockVideoPlayer.volume).toBe(0.8);
        });

        test('applies system volume scaling', () => {
            localStorageService.getUserSettings.mockReturnValue({
                systemVolume: 50,
                systemVolumeMuted: false
            });
            
            // Force update of user settings
            webAudioUtil.setVolume(1.0);
            
            expect(mockAudioPlayer.volume).toBe(0.5);
        });

        test('mutes when system is muted', () => {
            localStorageService.getUserSettings.mockReturnValue({
                systemVolume: 100,
                systemVolumeMuted: true
            });
            
            webAudioUtil.setVolume(1.0);
            
            expect(mockAudioPlayer.volume).toBe(0);
        });

        test('shows tooltip when tooltipKey provided', () => {
            localStorageService.getUserSettings.mockReturnValue({
                systemVolume: 100,
                systemVolumeMuted: false
            });
            
            webAudioUtil.setVolume(0.5, 'volumeLabel');
            
            expect(MainVue.setTooltip).toHaveBeenCalled();
            expect(i18nService.t).toHaveBeenCalledWith('volumeLabel', 50);
        });

        test('does not show tooltip when tooltipKey not provided', () => {
            localStorageService.getUserSettings.mockReturnValue({
                systemVolume: 100,
                systemVolumeMuted: false
            });
            
            webAudioUtil.setVolume(0.5);
            
            expect(MainVue.setTooltip).not.toHaveBeenCalled();
        });

        test('rounds volume to 2 decimal places', () => {
            localStorageService.getUserSettings.mockReturnValue({
                systemVolume: 100,
                systemVolumeMuted: false
            });
            
            const result = webAudioUtil.setVolume(0.333333);
            
            expect(result).toBe(0.33);
        });
    });

    describe('event listeners', () => {
        test('registers for user settings updated event', () => {
            expect(mockOn).toHaveBeenCalled();
        });
    });
});
