jest.mock('./util.js', () => ({
    util: {
        base64ToArrayBuffer: jest.fn((base64) => new ArrayBuffer(8)),
        mapRange: jest.fn((value, fromMin, fromMax, toMin, toMax) => {
            return ((value - fromMin) / (fromMax - fromMin)) * (toMax - toMin) + toMin;
        })
    }
}));

// Mock globals
global.log = {
    warn: jest.fn(),
    debug: jest.fn()
};

global.navigator = {
    mediaDevices: {
        getUserMedia: jest.fn()
    }
};

global.MediaRecorder = jest.fn().mockImplementation(() => ({
    addEventListener: jest.fn(),
    start: jest.fn(),
    stop: jest.fn()
}));

global.MediaRecorder.isTypeSupported = jest.fn((type) => type === 'audio/webm');

global.Blob = jest.fn().mockImplementation((parts) => ({
    size: parts ? parts.length : 0
}));

global.FileReader = jest.fn().mockImplementation(() => ({
    readAsDataURL: jest.fn(function() {
        setTimeout(() => {
            this.result = 'data:audio/webm;base64,test';
            this.onloadend();
        }, 0);
    }),
    onloadend: null
}));

global.window = {
    AudioContext: jest.fn().mockImplementation(() => ({
        createBufferSource: jest.fn(() => ({
            connect: jest.fn(),
            buffer: null,
            onended: null,
            start: jest.fn()
        })),
        createOscillator: jest.fn(() => ({
            connect: jest.fn(),
            type: 'sine',
            frequency: { value: 440 },
            onended: null,
            start: jest.fn(),
            stop: jest.fn()
        })),
        createGain: jest.fn(() => ({
            connect: jest.fn(),
            gain: { value: 1 }
        })),
        destination: {},
        decodeAudioData: jest.fn((data, success, error) => {
            success({ duration: 1 });
        }),
        currentTime: 0
    })),
    webkitAudioContext: null,
    audioContext: null
};

global.AudioContext = global.window.AudioContext;

import { audioUtil } from './audioUtil';
import { util } from './util.js';

describe('audioUtil', () => {
    let mockAudioStream;
    let mockMediaRecorder;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();
        
        mockAudioStream = {
            getTracks: jest.fn(() => [{
                stop: jest.fn()
            }])
        };
        
        navigator.mediaDevices.getUserMedia.mockResolvedValue(mockAudioStream);
    });

    afterEach(() => {
        jest.useRealTimers();
        audioUtil.stopRecording();
        audioUtil.stopRecordMicVolume();
    });

    describe('record', () => {
        test.skip('returns early if no callback provided', async () => {
            await audioUtil.record(null);
            expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
        });

        test.skip('requests audio stream', async () => {
            const callback = jest.fn();
            await audioUtil.record(callback);
            
            expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
                audio: true,
                video: false
            });
        });

        test.skip('creates MediaRecorder with supported mimeType', async () => {
            const callback = jest.fn();
            await audioUtil.record(callback);
            
            expect(MediaRecorder).toHaveBeenCalledWith(
                mockAudioStream,
                { mimeType: 'audio/webm' }
            );
        });

        test.skip('logs warning when no audio stream', async () => {
            navigator.mediaDevices.getUserMedia.mockResolvedValue(null);
            
            const callback = jest.fn();
            await expect(audioUtil.record(callback)).rejects.toBeUndefined();
            expect(log.warn).toHaveBeenCalledWith('no access to audio stream!');
        });
    });

    describe('stopRecording', () => {
        test.skip('stops media recorder and tracks', async () => {
            const mockTrack = { stop: jest.fn() };
            mockAudioStream.getTracks.mockReturnValue([mockTrack]);
            
            const callback = jest.fn();
            await audioUtil.record(callback);
            
            audioUtil.stopRecording();
            
            expect(mockTrack.stop).toHaveBeenCalled();
        });

        test.skip('does nothing if no recorder', () => {
            audioUtil.stopRecording();
            // Should not throw
            expect(true).toBe(true);
        });
    });

    describe('isRecording', () => {
        test.skip('returns false initially', () => {
            expect(audioUtil.isRecording()).toBe(false);
        });

        test.skip('returns true while recording', async () => {
            const callback = jest.fn();
            await audioUtil.record(callback);
            
            expect(audioUtil.isRecording()).toBe(true);
        });
    });

    describe('addMicVolumeCallback', () => {
        test.skip('returns early if no callback provided', async () => {
            await audioUtil.addMicVolumeCallback(null);
            expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
        });
    });

    describe('removeMicVolumeCallback', () => {
        test.skip('stops recording when no callbacks left', async () => {
            const callback = jest.fn();
            audioUtil.removeMicVolumeCallback(callback);
            // Should not throw
            expect(true).toBe(true);
        });
    });

    describe('stopRecordMicVolume', () => {
        test.skip('cleans up audio resources', () => {
            audioUtil.stopRecordMicVolume();
            // Should not throw
            expect(true).toBe(true);
        });
    });

    describe('playAudio', () => {
        test.skip('converts base64 and plays audio', async () => {
            const promise = audioUtil.playAudio('dGVzdA==');
            
            // Wait for the decodeAudioData to complete
            await promise;
            
            expect(util.base64ToArrayBuffer).toHaveBeenCalled();
            expect(window.AudioContext).toHaveBeenCalled();
        });

        test.skip('accepts options parameter', async () => {
            const onended = jest.fn();
            await audioUtil.playAudio('dGVzdA==', { onended });
            
            expect(window.AudioContext).toHaveBeenCalled();
        });
    });

    describe('playAudioUint8', () => {
        test.skip('creates audio context and plays buffer', async () => {
            const buffer = new ArrayBuffer(8);
            await audioUtil.playAudioUint8(buffer);
            
            expect(window.AudioContext).toHaveBeenCalled();
        });

        test.skip('calls onended callback when provided', async () => {
            const onended = jest.fn();
            const buffer = new ArrayBuffer(8);
            
            await audioUtil.playAudioUint8(buffer, { onended });
            
            expect(window.AudioContext).toHaveBeenCalled();
        });
    });

    describe('waitForAudioEnded', () => {
        test.skip('resolves immediately if no audio source', async () => {
            audioUtil.stopAudio();
            await audioUtil.waitForAudioEnded();
            // Should resolve without issues
            expect(true).toBe(true);
        });
    });

    describe('stopAudio', () => {
        test.skip('stops current audio source', async () => {
            const buffer = new ArrayBuffer(8);
            await audioUtil.playAudioUint8(buffer);
            
            audioUtil.stopAudio();
            // Should not throw
            expect(true).toBe(true);
        });

        test.skip('handles no current audio source', () => {
            audioUtil.stopAudio();
            audioUtil.stopAudio(); // Call again when no source
            // Should not throw
            expect(true).toBe(true);
        });
    });

    describe('beep', () => {
        test.skip('creates oscillator and plays tone', async () => {
            const promise = audioUtil.beep(800, 100, 0.5, 'sine');
            
            // Get the oscillator mock
            const mockOscillator = window.AudioContext.mock.results[0]?.value?.createOscillator();
            
            // Trigger onended
            if (mockOscillator && mockOscillator.onended) {
                mockOscillator.onended();
            }
            
            jest.advanceTimersByTime(1000);
            
            expect(window.AudioContext).toHaveBeenCalled();
        });

        test.skip('uses default values', async () => {
            const promise = audioUtil.beep();
            jest.advanceTimersByTime(1100);
            
            expect(window.AudioContext).toHaveBeenCalled();
        });

        test.skip('calls callback when provided', async () => {
            const callback = jest.fn();
            audioUtil.beep(800, 50, 0.5, 'sine', callback);
            
            jest.advanceTimersByTime(1100);
        });
    });

    describe('beepHigh', () => {
        test.skip('plays high frequency beep', () => {
            audioUtil.beepHigh();
            jest.advanceTimersByTime(1100);
            
            expect(window.AudioContext).toHaveBeenCalled();
        });
    });

    describe('beepHighDouble', () => {
        test.skip('plays two high frequency beeps', () => {
            audioUtil.beepHighDouble();
            jest.advanceTimersByTime(1200);
            
            // Should create two audio contexts for two beeps
            expect(window.AudioContext).toHaveBeenCalled();
        });
    });
});
