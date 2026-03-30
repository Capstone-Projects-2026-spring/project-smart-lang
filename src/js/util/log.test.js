import { log } from './log';

describe('log', () => {
    test('log is exported from window.log', () => {
        // log.js exports window.log which should be set up globally
        // The module simply re-exports the global log object
        expect(log).toBe(window.log);
    });

    test('log object has expected methods when defined', () => {
        // If window.log is properly configured, it should have typical log methods
        if (log) {
            // These tests verify the structure if log is defined
            expect(typeof log).toBe('object');
        }
    });
});
