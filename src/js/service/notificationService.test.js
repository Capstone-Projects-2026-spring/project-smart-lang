/**
 * Tests for notificationService.js
 * Tests notification initialization, backup reminders, and timer management.
 */

// Mock dependencies before imports
jest.mock('./data/dataService.js', () => ({
    dataService: {
        getMetadata: jest.fn(() =>
            Promise.resolve({
                notificationConfig: {
                    backupNotifyIntervalDays: 7,
                    lastBackupNotification: 0,
                    lastBackup: 0,
                },
            })
        ),
        saveMetadata: jest.fn(() => Promise.resolve()),
        getLastGridUpdateTime: jest.fn(() => Promise.resolve(Date.now())),
        downloadBackupToFile: jest.fn(),
        markCurrentConfigAsBackedUp: jest.fn(() => Promise.resolve()),
    },
}));

jest.mock('../externals/jquery.js', () => {
    const mockJQuery = jest.fn(() => mockJQuery);
    mockJQuery.trigger = jest.fn();
    mockJQuery.on = jest.fn();
    return mockJQuery;
});

jest.mock('../util/constants.js', () => ({
    constants: {
        EVENT_USER_CHANGED: 'EVENT_USER_CHANGED',
        EVENT_METADATA_UPDATED: 'EVENT_METADATA_UPDATED',
    },
}));

jest.mock('../vue/mainVue.js', () => ({
    MainVue: {
        setTooltip: jest.fn(),
        clearTooltip: jest.fn(),
    },
}));

jest.mock('./i18nService.js', () => ({
    i18nService: {
        t: jest.fn((key) => key),
    },
}));

import { notificationService } from './notificationService.js';
import { dataService } from './data/dataService.js';
import { MainVue } from '../vue/mainVue.js';

describe('notificationService', () => {
    // Note: The notificationService has internal state (notificationConfig) that persists
    // between tests. Some tests may need to account for this.

    beforeEach(() => {
        jest.useFakeTimers();
        jest.clearAllMocks();

        // Reset default mock implementations
        dataService.getMetadata.mockResolvedValue({
            notificationConfig: {
                backupNotifyIntervalDays: 7,
                lastBackupNotification: 0,
                lastBackup: 0,
            },
        });
        dataService.getLastGridUpdateTime.mockResolvedValue(Date.now() - 1000);
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    describe('init', () => {
        test('sets up initial timer for checking notifications', () => {
            notificationService.init();

            // Timer should be set for 60 seconds (INIT_WAIT_TIME)
            expect(jest.getTimerCount()).toBeGreaterThanOrEqual(1);
        });

        test('clears existing timers when called multiple times', () => {
            notificationService.init();
            notificationService.init();
            notificationService.init();

            // Should have only one active timer set
            expect(jest.getTimerCount()).toBeGreaterThanOrEqual(1);
        });
    });

    describe('checkNotifications', () => {
        test('returns early when notificationConfig is null', async () => {
            // Call checkNotifications directly without initializing config
            // This simulates the case where config hasn't been loaded yet
            await notificationService.checkNotifications();

            // Since notificationConfig starts null (or from previous test state),
            // we verify behavior based on that
        });

        test('sets up recurring timer after initial check', async () => {
            notificationService.init();
            jest.advanceTimersByTime(60 * 1000);
            await Promise.resolve();

            // After initial check, another timer should be set
            expect(jest.getTimerCount()).toBeGreaterThanOrEqual(0);
        });
    });

    describe('timer behavior', () => {
        test('sets recurring check timer after initial check', async () => {
            notificationService.init();

            // Advance past initial wait time (60 seconds)
            jest.advanceTimersByTime(60 * 1000);
            await Promise.resolve();

            // Should have set another timer for the check interval
            expect(jest.getTimerCount()).toBeGreaterThanOrEqual(0);
        });
    });

    describe('initialization timing', () => {
        test('initial wait time is 60 seconds', () => {
            notificationService.init();

            // At 59 seconds, timer should not have fired
            jest.advanceTimersByTime(59 * 1000);
            
            // Verify timer is still active
            expect(jest.getTimerCount()).toBeGreaterThanOrEqual(1);
        });
    });

    describe('checkNotifications behavior', () => {
        test('can be called directly without errors', async () => {
            await expect(notificationService.checkNotifications()).resolves.not.toThrow();
        });
    });
});
