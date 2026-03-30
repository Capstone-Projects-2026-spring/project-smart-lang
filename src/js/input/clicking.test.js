jest.mock('../util/lquery.js', () => ({
    L: {
        selectAsList: jest.fn(() => [])
    }
}));

jest.mock('../service/speechService.js', () => ({
    speechService: {
        hasSpoken: jest.fn(() => false)
    }
}));

import { Clicker } from './clicking';
import { L } from '../util/lquery.js';
import { speechService } from '../service/speechService.js';

describe('Clicker', () => {
    let mockElement;
    let mockElements;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();

        mockElement = {
            addEventListener: jest.fn(),
            removeEventListener: jest.fn()
        };

        mockElements = [mockElement];
        L.selectAsList.mockReturnValue(mockElements);
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe('getInstanceFromConfig', () => {
        test('creates instance with correct options from config', () => {
            const inputConfig = {
                mouseDownInsteadClick: true,
                mouseDoubleClickEnabled: true,
                mouseclickEnabled: true
            };

            const clicker = Clicker.getInstanceFromConfig(inputConfig, '.test-selector');
            expect(clicker).toBeDefined();
            expect(typeof clicker.startClickcontrol).toBe('function');
            expect(typeof clicker.destroy).toBe('function');
            expect(typeof clicker.setSelectionListener).toBe('function');
        });

        test('creates instance with false options', () => {
            const inputConfig = {
                mouseDownInsteadClick: false,
                mouseDoubleClickEnabled: false,
                mouseclickEnabled: false
            };

            const clicker = Clicker.getInstanceFromConfig(inputConfig, '.test');
            expect(clicker).toBeDefined();
        });
    });

    describe('startClickcontrol', () => {
        test('registers click event listener when useSingleClick is true and useMousedownEvent is false', () => {
            const inputConfig = {
                mouseDownInsteadClick: false,
                mouseDoubleClickEnabled: false,
                mouseclickEnabled: true
            };

            const clicker = Clicker.getInstanceFromConfig(inputConfig, '.test');
            clicker.startClickcontrol();

            expect(L.selectAsList).toHaveBeenCalledWith('.test');
            expect(mockElement.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
            expect(mockElement.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
        });

        test('registers mousedown and touchstart events when useMousedownEvent is true', () => {
            const inputConfig = {
                mouseDownInsteadClick: true,
                mouseDoubleClickEnabled: false,
                mouseclickEnabled: true
            };

            const clicker = Clicker.getInstanceFromConfig(inputConfig, '.test');
            clicker.startClickcontrol();

            expect(mockElement.addEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));
            expect(mockElement.addEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function));
        });

        test('registers dblclick event when useDoubleclick is true', () => {
            const inputConfig = {
                mouseDownInsteadClick: false,
                mouseDoubleClickEnabled: true,
                mouseclickEnabled: false
            };

            const clicker = Clicker.getInstanceFromConfig(inputConfig, '.test');
            clicker.startClickcontrol();

            expect(mockElement.addEventListener).toHaveBeenCalledWith('dblclick', expect.any(Function));
        });

        test('registers keydown event for all configurations', () => {
            const inputConfig = {
                mouseDownInsteadClick: false,
                mouseDoubleClickEnabled: false,
                mouseclickEnabled: false
            };

            const clicker = Clicker.getInstanceFromConfig(inputConfig, '.test');
            clicker.startClickcontrol();

            expect(mockElement.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
        });

        test('handles multiple elements', () => {
            const secondMockElement = {
                addEventListener: jest.fn(),
                removeEventListener: jest.fn()
            };
            L.selectAsList.mockReturnValue([mockElement, secondMockElement]);

            const inputConfig = {
                mouseDownInsteadClick: false,
                mouseDoubleClickEnabled: false,
                mouseclickEnabled: true
            };

            const clicker = Clicker.getInstanceFromConfig(inputConfig, '.test');
            clicker.startClickcontrol();

            expect(mockElement.addEventListener).toHaveBeenCalled();
            expect(secondMockElement.addEventListener).toHaveBeenCalled();
        });
    });

    describe('click handling and debouncing', () => {
        test('calls selection listener on click', () => {
            const inputConfig = {
                mouseDownInsteadClick: false,
                mouseDoubleClickEnabled: false,
                mouseclickEnabled: true
            };

            const clicker = Clicker.getInstanceFromConfig(inputConfig, '.test');
            const selectionListener = jest.fn();
            clicker.setSelectionListener(selectionListener);
            clicker.startClickcontrol();

            const clickHandler = mockElement.addEventListener.mock.calls.find(
                call => call[0] === 'click'
            )[1];

            const mockEvent = { currentTarget: mockElement };
            clickHandler(mockEvent);

            expect(selectionListener).toHaveBeenCalledWith(mockElement);
        });

        test('debounces rapid clicks within 100ms', () => {
            const inputConfig = {
                mouseDownInsteadClick: false,
                mouseDoubleClickEnabled: false,
                mouseclickEnabled: true
            };

            const clicker = Clicker.getInstanceFromConfig(inputConfig, '.test');
            const selectionListener = jest.fn();
            clicker.setSelectionListener(selectionListener);
            clicker.startClickcontrol();

            const clickHandler = mockElement.addEventListener.mock.calls.find(
                call => call[0] === 'click'
            )[1];

            const mockEvent = { currentTarget: mockElement };

            // First click
            clickHandler(mockEvent);
            expect(selectionListener).toHaveBeenCalledTimes(1);

            // Rapid second click within 100ms - should be debounced
            jest.advanceTimersByTime(50);
            clickHandler(mockEvent);
            expect(selectionListener).toHaveBeenCalledTimes(1);

            // Click after 100ms - should go through
            jest.advanceTimersByTime(100);
            clickHandler(mockEvent);
            expect(selectionListener).toHaveBeenCalledTimes(2);
        });

        test('does not call selection listener if none set', () => {
            const inputConfig = {
                mouseDownInsteadClick: false,
                mouseDoubleClickEnabled: false,
                mouseclickEnabled: true
            };

            const clicker = Clicker.getInstanceFromConfig(inputConfig, '.test');
            clicker.startClickcontrol();

            const clickHandler = mockElement.addEventListener.mock.calls.find(
                call => call[0] === 'click'
            )[1];

            // Should not throw
            expect(() => {
                clickHandler({ currentTarget: mockElement });
            }).not.toThrow();
        });
    });

    describe('onInputStart (mousedown/touchstart)', () => {
        test('calls click handler for mousedown when speech has not spoken', () => {
            speechService.hasSpoken.mockReturnValue(false);

            const inputConfig = {
                mouseDownInsteadClick: true,
                mouseDoubleClickEnabled: false,
                mouseclickEnabled: true
            };

            const clicker = Clicker.getInstanceFromConfig(inputConfig, '.test');
            const selectionListener = jest.fn();
            clicker.setSelectionListener(selectionListener);
            clicker.startClickcontrol();

            const mousedownHandler = mockElement.addEventListener.mock.calls.find(
                call => call[0] === 'mousedown'
            )[1];

            const mockEvent = {
                type: 'mousedown',
                currentTarget: mockElement,
                buttons: 1,
                preventDefault: jest.fn()
            };

            mousedownHandler(mockEvent);
            expect(selectionListener).toHaveBeenCalledWith(mockElement);
        });

        test('prevents default and handles click when speech has spoken', () => {
            speechService.hasSpoken.mockReturnValue(true);

            const inputConfig = {
                mouseDownInsteadClick: true,
                mouseDoubleClickEnabled: false,
                mouseclickEnabled: true
            };

            const clicker = Clicker.getInstanceFromConfig(inputConfig, '.test');
            const selectionListener = jest.fn();
            clicker.setSelectionListener(selectionListener);
            clicker.startClickcontrol();

            const mousedownHandler = mockElement.addEventListener.mock.calls.find(
                call => call[0] === 'mousedown'
            )[1];

            const mockEvent = {
                type: 'mousedown',
                currentTarget: mockElement,
                buttons: 1,
                preventDefault: jest.fn()
            };

            mousedownHandler(mockEvent);
            expect(mockEvent.preventDefault).toHaveBeenCalled();
            expect(selectionListener).toHaveBeenCalled();
        });

        test('ignores emulated mousedown events (buttons === 0) from touchscreen', () => {
            speechService.hasSpoken.mockReturnValue(true);

            const inputConfig = {
                mouseDownInsteadClick: true,
                mouseDoubleClickEnabled: false,
                mouseclickEnabled: true
            };

            const clicker = Clicker.getInstanceFromConfig(inputConfig, '.test');
            const selectionListener = jest.fn();
            clicker.setSelectionListener(selectionListener);
            clicker.startClickcontrol();

            const mousedownHandler = mockElement.addEventListener.mock.calls.find(
                call => call[0] === 'mousedown'
            )[1];

            const mockEvent = {
                type: 'mousedown',
                currentTarget: mockElement,
                buttons: 0, // emulated from touchscreen
                preventDefault: jest.fn()
            };

            mousedownHandler(mockEvent);
            expect(selectionListener).not.toHaveBeenCalled();
        });

        test('handles touchstart events', () => {
            speechService.hasSpoken.mockReturnValue(false);

            const inputConfig = {
                mouseDownInsteadClick: true,
                mouseDoubleClickEnabled: false,
                mouseclickEnabled: true
            };

            const clicker = Clicker.getInstanceFromConfig(inputConfig, '.test');
            const selectionListener = jest.fn();
            clicker.setSelectionListener(selectionListener);
            clicker.startClickcontrol();

            const touchstartHandler = mockElement.addEventListener.mock.calls.find(
                call => call[0] === 'touchstart'
            )[1];

            const mockEvent = {
                type: 'touchstart',
                currentTarget: mockElement,
                preventDefault: jest.fn()
            };

            touchstartHandler(mockEvent);
            expect(selectionListener).toHaveBeenCalledWith(mockElement);
        });
    });

    describe('double click handling', () => {
        test('calls selection listener on dblclick', () => {
            const inputConfig = {
                mouseDownInsteadClick: false,
                mouseDoubleClickEnabled: true,
                mouseclickEnabled: false
            };

            const clicker = Clicker.getInstanceFromConfig(inputConfig, '.test');
            const selectionListener = jest.fn();
            clicker.setSelectionListener(selectionListener);
            clicker.startClickcontrol();

            const dblclickHandler = mockElement.addEventListener.mock.calls.find(
                call => call[0] === 'dblclick'
            )[1];

            const mockEvent = { currentTarget: mockElement };
            dblclickHandler(mockEvent);

            expect(selectionListener).toHaveBeenCalledWith(mockElement);
        });
    });

    describe('keyboard handling', () => {
        test('calls selection listener on Enter key (keyCode 13)', () => {
            const inputConfig = {
                mouseDownInsteadClick: false,
                mouseDoubleClickEnabled: false,
                mouseclickEnabled: false
            };

            const clicker = Clicker.getInstanceFromConfig(inputConfig, '.test');
            const selectionListener = jest.fn();
            clicker.setSelectionListener(selectionListener);
            clicker.startClickcontrol();

            const keydownHandler = mockElement.addEventListener.mock.calls.find(
                call => call[0] === 'keydown'
            )[1];

            keydownHandler({ which: 13, currentTarget: mockElement });
            expect(selectionListener).toHaveBeenCalledWith(mockElement);
        });

        test('calls selection listener on Space key (keyCode 32)', () => {
            const inputConfig = {
                mouseDownInsteadClick: false,
                mouseDoubleClickEnabled: false,
                mouseclickEnabled: false
            };

            const clicker = Clicker.getInstanceFromConfig(inputConfig, '.test');
            const selectionListener = jest.fn();
            clicker.setSelectionListener(selectionListener);
            clicker.startClickcontrol();

            const keydownHandler = mockElement.addEventListener.mock.calls.find(
                call => call[0] === 'keydown'
            )[1];

            keydownHandler({ keyCode: 32, currentTarget: mockElement });
            expect(selectionListener).toHaveBeenCalledWith(mockElement);
        });

        test('ignores other keys', () => {
            const inputConfig = {
                mouseDownInsteadClick: false,
                mouseDoubleClickEnabled: false,
                mouseclickEnabled: false
            };

            const clicker = Clicker.getInstanceFromConfig(inputConfig, '.test');
            const selectionListener = jest.fn();
            clicker.setSelectionListener(selectionListener);
            clicker.startClickcontrol();

            const keydownHandler = mockElement.addEventListener.mock.calls.find(
                call => call[0] === 'keydown'
            )[1];

            keydownHandler({ which: 65, currentTarget: mockElement }); // 'A' key
            expect(selectionListener).not.toHaveBeenCalled();
        });
    });

    describe('destroy', () => {
        test('removes all event listeners', () => {
            const inputConfig = {
                mouseDownInsteadClick: true,
                mouseDoubleClickEnabled: true,
                mouseclickEnabled: true
            };

            const clicker = Clicker.getInstanceFromConfig(inputConfig, '.test');
            clicker.startClickcontrol();
            clicker.destroy();

            expect(mockElement.removeEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));
            expect(mockElement.removeEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function));
            expect(mockElement.removeEventListener).toHaveBeenCalledWith('click', expect.any(Function));
            expect(mockElement.removeEventListener).toHaveBeenCalledWith('dblclick', expect.any(Function));
            expect(mockElement.removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
        });

        test('handles multiple elements on destroy', () => {
            const secondMockElement = {
                addEventListener: jest.fn(),
                removeEventListener: jest.fn()
            };
            L.selectAsList.mockReturnValue([mockElement, secondMockElement]);

            const inputConfig = {
                mouseDownInsteadClick: false,
                mouseDoubleClickEnabled: false,
                mouseclickEnabled: true
            };

            const clicker = Clicker.getInstanceFromConfig(inputConfig, '.test');
            clicker.startClickcontrol();
            clicker.destroy();

            expect(mockElement.removeEventListener).toHaveBeenCalled();
            expect(secondMockElement.removeEventListener).toHaveBeenCalled();
        });
    });

    describe('edge cases', () => {
        test('handles empty element list', () => {
            L.selectAsList.mockReturnValue([]);

            const inputConfig = {
                mouseDownInsteadClick: false,
                mouseDoubleClickEnabled: false,
                mouseclickEnabled: true
            };

            const clicker = Clicker.getInstanceFromConfig(inputConfig, '.nonexistent');

            expect(() => {
                clicker.startClickcontrol();
                clicker.destroy();
            }).not.toThrow();
        });

        test('setSelectionListener updates listener', () => {
            const inputConfig = {
                mouseDownInsteadClick: false,
                mouseDoubleClickEnabled: false,
                mouseclickEnabled: true
            };

            const clicker = Clicker.getInstanceFromConfig(inputConfig, '.test');
            const listener1 = jest.fn();
            const listener2 = jest.fn();

            clicker.setSelectionListener(listener1);
            clicker.startClickcontrol();

            const clickHandler = mockElement.addEventListener.mock.calls.find(
                call => call[0] === 'click'
            )[1];

            clickHandler({ currentTarget: mockElement });
            expect(listener1).toHaveBeenCalledTimes(1);
            expect(listener2).not.toHaveBeenCalled();

            jest.advanceTimersByTime(150); // wait for debounce
            clicker.setSelectionListener(listener2);
            clickHandler({ currentTarget: mockElement });
            expect(listener1).toHaveBeenCalledTimes(1);
            expect(listener2).toHaveBeenCalledTimes(1);
        });
    });
});
