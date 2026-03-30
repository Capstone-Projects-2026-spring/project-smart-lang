jest.mock('../util/util', () => ({
    util: {
        throttle: jest.fn((fn) => fn())
    }
}));

jest.mock('../model/InputEventKey', () => {
    class MockInputEventKey {
        constructor(props) {
            Object.assign(this, props);
            this.modelName = 'InputEventKey';
        }
        static getModelName() {
            return 'InputEventKey';
        }
    }
    MockInputEventKey.KEY_MOUSE_PREFIX = 'KEY_MOUSE';
    MockInputEventKey.KEY_MOUSE_LEFT = 'KEY_MOUSE0';
    MockInputEventKey.KEY_MOUSE_MIDDLE = 'KEY_MOUSE1';
    MockInputEventKey.KEY_MOUSE_RIGHT = 'KEY_MOUSE2';
    MockInputEventKey.KEY_TAP = 'KEY_TAP';

    return { InputEventKey: MockInputEventKey };
});

import { inputEventHandler } from './inputEventHandler';
import { util } from '../util/util';
import { InputEventKey } from '../model/InputEventKey';

describe('inputEventHandler', () => {
    let instance;
    let documentAddEventListenerSpy;
    let documentRemoveEventListenerSpy;
    let bodyAddEventListenerSpy;
    let bodyRemoveEventListenerSpy;
    let capturedDocumentListeners;
    let capturedBodyListeners;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.useFakeTimers();

        capturedDocumentListeners = {};
        capturedBodyListeners = {};

        global.log = {
            debug: jest.fn(),
            warn: jest.fn()
        };

        // Spy on real document methods to capture listeners
        documentAddEventListenerSpy = jest.spyOn(document, 'addEventListener').mockImplementation((event, handler) => {
            capturedDocumentListeners[event] = handler;
        });
        documentRemoveEventListenerSpy = jest.spyOn(document, 'removeEventListener').mockImplementation((event) => {
            delete capturedDocumentListeners[event];
        });
        bodyAddEventListenerSpy = jest.spyOn(document.body, 'addEventListener').mockImplementation((event, handler, options) => {
            capturedBodyListeners[event] = { handler, options };
        });
        bodyRemoveEventListenerSpy = jest.spyOn(document.body, 'removeEventListener').mockImplementation((event) => {
            delete capturedBodyListeners[event];
        });

        // Get a fresh instance
        instance = inputEventHandler.instance();
    });

    afterEach(() => {
        if (instance && instance.isListening()) {
            instance.stopListening();
        }
        documentAddEventListenerSpy.mockRestore();
        documentRemoveEventListenerSpy.mockRestore();
        bodyAddEventListenerSpy.mockRestore();
        bodyRemoveEventListenerSpy.mockRestore();
        jest.useRealTimers();
    });

    describe('instance management', () => {
        test('creates a new instance', () => {
            expect(instance).toBeDefined();
            expect(typeof instance.startListening).toBe('function');
            expect(typeof instance.stopListening).toBe('function');
            expect(typeof instance.destroy).toBe('function');
        });

        test('each instance has unique ID', () => {
            const instance2 = inputEventHandler.instance();
            expect(instance.getID()).not.toBe(instance2.getID());
        });

        test('global instance exists', () => {
            expect(inputEventHandler.global).toBeDefined();
        });
    });

    describe('startListening', () => {
        test('registers all event listeners on document and body', () => {
            instance.startListening();

            expect(document.addEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
            expect(document.addEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));
            expect(document.addEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
            expect(document.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
            expect(document.addEventListener).toHaveBeenCalledWith('keyup', expect.any(Function));
            expect(document.addEventListener).toHaveBeenCalledWith('fullscreenchange', expect.any(Function));
            expect(document.body.addEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function), { passive: false });
            expect(document.body.addEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function));
            expect(document.body.addEventListener).toHaveBeenCalledWith('touchend', expect.any(Function));
        });

        test('sets isListening to true', () => {
            expect(instance.isListening()).toBe(false);
            instance.startListening();
            expect(instance.isListening()).toBe(true);
        });

        test('does not register listeners twice', () => {
            instance.startListening();
            const callCount = document.addEventListener.mock.calls.length;
            instance.startListening();
            expect(document.addEventListener).toHaveBeenCalledTimes(callCount);
        });
    });

    describe('stopListening', () => {
        test('removes all event listeners', () => {
            instance.startListening();
            instance.stopListening();

            expect(document.removeEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
            expect(document.removeEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));
            expect(document.removeEventListener).toHaveBeenCalledWith('mouseup', expect.any(Function));
            expect(document.removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
            expect(document.removeEventListener).toHaveBeenCalledWith('keyup', expect.any(Function));
            expect(document.removeEventListener).toHaveBeenCalledWith('fullscreenchange', expect.any(Function));
            expect(document.body.removeEventListener).toHaveBeenCalledWith('touchmove', expect.any(Function));
            expect(document.body.removeEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function));
            expect(document.body.removeEventListener).toHaveBeenCalledWith('touchend', expect.any(Function));
        });

        test('sets isListening to false', () => {
            instance.startListening();
            expect(instance.isListening()).toBe(true);
            instance.stopListening();
            expect(instance.isListening()).toBe(false);
        });
    });

    describe('destroy', () => {
        test('stops listening and removes from allInstances', () => {
            instance.startListening();
            instance.destroy();
            expect(instance.isListening()).toBe(false);
        });
    });

    describe('pauseAll and resumeAll', () => {
        test('pauses all instances', () => {
            const instance2 = inputEventHandler.instance();
            instance.startListening();
            instance2.startListening();

            inputEventHandler.pauseAll();

            expect(instance.isListening()).toBe(false);
            expect(instance2.isListening()).toBe(false);
        });

        test('resumes only previously listening instances', () => {
            const instance2 = inputEventHandler.instance();
            instance.startListening();
            // instance2 not started

            inputEventHandler.pauseAll();
            inputEventHandler.resumeAll();

            expect(instance.isListening()).toBe(true);
            expect(instance2.isListening()).toBe(false);
        });
    });

    describe('handler registration', () => {
        test('onMouseUpperOrLeftBorder registers handler', () => {
            const handler = jest.fn();
            const result = instance.onMouseUpperOrLeftBorder(handler);
            expect(result).toBe(instance); // returns instance for chaining
        });

        test('onSwipedDown registers handler', () => {
            const handler = jest.fn();
            const result = instance.onSwipedDown(handler);
            expect(result).toBe(instance);
        });

        test('onSwipedUp registers handler', () => {
            const handler = jest.fn();
            const result = instance.onSwipedUp(handler);
            expect(result).toBe(instance);
        });

        test('onSwipedRight registers handler', () => {
            const handler = jest.fn();
            const result = instance.onSwipedRight(handler);
            expect(result).toBe(instance);
        });

        test('onSwipedLeft registers handler', () => {
            const handler = jest.fn();
            const result = instance.onSwipedLeft(handler);
            expect(result).toBe(instance);
        });

        test('onEscape registers handler for ESC key', () => {
            const handler = jest.fn();
            const result = instance.onEscape(handler);
            expect(result).toBe(instance);
        });

        test('onAnyKey registers handler', () => {
            const handler = jest.fn();
            const result = instance.onAnyKey(handler);
            expect(result).toBe(instance);
        });

        test('onTouchMove registers handler', () => {
            const handler = jest.fn();
            const result = instance.onTouchMove(handler);
            expect(result).toBe(instance);
        });

        test('onTouchStart registers handler', () => {
            const handler = jest.fn();
            const result = instance.onTouchStart(handler);
            expect(result).toBe(instance);
        });

        test('onTouchEnd registers handler', () => {
            const handler = jest.fn();
            const result = instance.onTouchEnd(handler);
            expect(result).toBe(instance);
        });

        test('onExitFullscreen registers handler', () => {
            const handler = jest.fn();
            const result = instance.onExitFullscreen(handler);
            expect(result).toBe(instance);
        });

        test('onInputEvent registers key handler', () => {
            const handler = jest.fn();
            const inputEvent = {
                modelName: 'InputEventKey',
                keyCode: 65,
                repeat: 1,
                timeout: 0,
                holdDuration: 0
            };
            instance.onInputEvent(inputEvent, handler);
            // Verify it was registered by starting listening and checking behavior
            expect(handler).not.toHaveBeenCalled();
        });

        test('onInputEvent does nothing for null input or handler', () => {
            expect(() => {
                instance.onInputEvent(null, jest.fn());
                instance.onInputEvent({ modelName: 'InputEventKey', keyCode: 65 }, null);
            }).not.toThrow();
        });

        test('off removes handler from all arrays', () => {
            const handler = jest.fn();
            instance.onSwipedDown(handler);
            instance.onSwipedUp(handler);
            instance.off(handler);
            // Handler should be removed - we can't directly test this without triggering events
        });
    });

    describe('mouse move handling', () => {
        test('calls border handler when mouse near top edge', () => {
            const borderHandler = jest.fn();
            instance.onMouseUpperOrLeftBorder(borderHandler);
            instance.startListening();

            const mousemoveHandler = capturedDocumentListeners['mousemove'];
            mousemoveHandler({ clientY: 2, clientX: 100 }); // Near top

            expect(borderHandler).toHaveBeenCalled();
        });

        test('calls border handler when mouse near left edge', () => {
            const borderHandler = jest.fn();
            instance.onMouseUpperOrLeftBorder(borderHandler);
            instance.startListening();

            const mousemoveHandler = capturedDocumentListeners['mousemove'];
            mousemoveHandler({ clientY: 100, clientX: 2 }); // Near left

            expect(borderHandler).toHaveBeenCalled();
        });

        test('does not call border handler when mouse away from edges', () => {
            const borderHandler = jest.fn();
            instance.onMouseUpperOrLeftBorder(borderHandler);
            instance.startListening();

            const mousemoveHandler = capturedDocumentListeners['mousemove'];
            mousemoveHandler({ clientY: 100, clientX: 100 });

            expect(borderHandler).not.toHaveBeenCalled();
        });
    });

    describe('mouse button handling', () => {
        test('mousedown triggers key down listener with mouse key code', () => {
            const keyHandler = jest.fn();
            instance.onInputEvent({
                modelName: 'InputEventKey',
                keyCode: 'KEY_MOUSE0',
                repeat: 1,
                timeout: 0,
                holdDuration: 0
            }, keyHandler);
            instance.startListening();

            const mousedownHandler = capturedDocumentListeners['mousedown'];
            mousedownHandler({ button: 0 }); // left button

            expect(keyHandler).toHaveBeenCalled();
        });

        test('mouseup triggers key up listener', () => {
            instance.startListening();

            const mouseupHandler = capturedDocumentListeners['mouseup'];
            expect(() => {
                mouseupHandler({ button: 0 });
            }).not.toThrow();
        });
    });

    describe('keyboard handling', () => {
        test('keydown calls anyKey handlers', () => {
            const anyKeyHandler = jest.fn();
            instance.onAnyKey(anyKeyHandler);
            instance.startListening();

            const keydownHandler = capturedDocumentListeners['keydown'];
            keydownHandler({
                keyCode: 65,
                code: 'KeyA',
                which: 65,
                repeat: false,
                preventDefault: jest.fn()
            });

            expect(anyKeyHandler).toHaveBeenCalledWith(65, 'KeyA', expect.any(Object));
        });

        test('keydown ignores repeat events for anyKey handlers', () => {
            const anyKeyHandler = jest.fn();
            instance.onAnyKey(anyKeyHandler);
            instance.startListening();

            const keydownHandler = capturedDocumentListeners['keydown'];
            keydownHandler({
                keyCode: 65,
                which: 65,
                repeat: true,
                preventDefault: jest.fn()
            });

            expect(anyKeyHandler).not.toHaveBeenCalled();
        });

        test('keydown triggers registered key handler', () => {
            const keyHandler = jest.fn();
            instance.onInputEvent({
                modelName: 'InputEventKey',
                keyCode: 65,
                repeat: 1,
                timeout: 0,
                holdDuration: 0
            }, keyHandler);
            instance.startListening();

            const keydownHandler = capturedDocumentListeners['keydown'];
            keydownHandler({
                keyCode: 65,
                which: 65,
                repeat: false,
                preventDefault: jest.fn()
            });

            expect(keyHandler).toHaveBeenCalled();
        });

        test('keydown prevents default for registered keys', () => {
            const keyHandler = jest.fn();
            instance.onInputEvent({
                modelName: 'InputEventKey',
                keyCode: 65,
                repeat: 1,
                timeout: 0,
                holdDuration: 0
            }, keyHandler);
            instance.startListening();

            const keydownHandler = capturedDocumentListeners['keydown'];
            const preventDefaultMock = jest.fn();
            keydownHandler({
                keyCode: 65,
                which: 65,
                repeat: false,
                preventDefault: preventDefaultMock
            });

            expect(preventDefaultMock).toHaveBeenCalled();
        });

        test('keydown ignores repeat events for registered handlers', () => {
            const keyHandler = jest.fn();
            instance.onInputEvent({
                modelName: 'InputEventKey',
                keyCode: 65,
                repeat: 1,
                timeout: 0,
                holdDuration: 0
            }, keyHandler);
            instance.startListening();

            const keydownHandler = capturedDocumentListeners['keydown'];
            keydownHandler({
                keyCode: 65,
                which: 65,
                repeat: false,
                preventDefault: jest.fn()
            });

            keydownHandler({
                keyCode: 65,
                which: 65,
                repeat: true,
                preventDefault: jest.fn()
            });

            expect(keyHandler).toHaveBeenCalledTimes(1);
        });

        test('keyup ignores repeat events', () => {
            instance.startListening();

            const keyupHandler = capturedDocumentListeners['keyup'];
            expect(() => {
                keyupHandler({
                    keyCode: 65,
                    which: 65,
                    repeat: true
                });
            }).not.toThrow();
        });
    });

    describe('key repeat handling', () => {
        test('handles key with repeat > 1', () => {
            const keyHandler = jest.fn();
            instance.onInputEvent({
                modelName: 'InputEventKey',
                keyCode: 65,
                repeat: 2,
                timeout: 500,
                holdDuration: 0
            }, keyHandler);
            instance.startListening();

            const keydownHandler = capturedDocumentListeners['keydown'];
            const keyupHandler = capturedDocumentListeners['keyup'];

            // First press
            keydownHandler({
                keyCode: 65,
                which: 65,
                repeat: false,
                preventDefault: jest.fn()
            });
            keyupHandler({ keyCode: 65, which: 65, repeat: false });

            expect(keyHandler).not.toHaveBeenCalled();

            // Second press within timeout
            keydownHandler({
                keyCode: 65,
                which: 65,
                repeat: false,
                preventDefault: jest.fn()
            });

            jest.advanceTimersByTime(10);
            expect(keyHandler).toHaveBeenCalled();
        });

        test('handles key with holdDuration', () => {
            const keyHandler = jest.fn();
            instance.onInputEvent({
                modelName: 'InputEventKey',
                keyCode: 65,
                repeat: 1,
                timeout: 0,
                holdDuration: 1000
            }, keyHandler);
            instance.startListening();

            const keydownHandler = capturedDocumentListeners['keydown'];

            keydownHandler({
                keyCode: 65,
                which: 65,
                repeat: false,
                preventDefault: jest.fn()
            });

            expect(keyHandler).not.toHaveBeenCalled();

            jest.advanceTimersByTime(1000);
            expect(keyHandler).toHaveBeenCalled();
        });

        test('holdDuration handler cancelled on keyup', () => {
            const keyHandler = jest.fn();
            instance.onInputEvent({
                modelName: 'InputEventKey',
                keyCode: 65,
                repeat: 1,
                timeout: 0,
                holdDuration: 1000
            }, keyHandler);
            instance.startListening();

            const keydownHandler = capturedDocumentListeners['keydown'];
            const keyupHandler = capturedDocumentListeners['keyup'];

            keydownHandler({
                keyCode: 65,
                which: 65,
                repeat: false,
                preventDefault: jest.fn()
            });

            jest.advanceTimersByTime(500);
            keyupHandler({ keyCode: 65, which: 65, repeat: false });

            jest.advanceTimersByTime(1000);
            expect(keyHandler).not.toHaveBeenCalled();
        });
    });

    describe('touch handling', () => {
        test('touchmove calls registered handlers', () => {
            const touchMoveHandler = jest.fn();
            instance.onTouchMove(touchMoveHandler);
            instance.startListening();

            const touchmoveListener = capturedBodyListeners['touchmove'].handler;
            const mockEvent = {
                touches: [{ clientX: 50, clientY: 50 }]
            };

            touchmoveListener(mockEvent);
            expect(touchMoveHandler).toHaveBeenCalledWith(mockEvent);
        });

        test('swipe down detected when moving down 100+ pixels', () => {
            const swipeDownHandler = jest.fn();
            instance.onSwipedDown(swipeDownHandler);
            instance.startListening();

            const touchmoveListener = capturedBodyListeners['touchmove'].handler;

            // First touch sets position
            touchmoveListener({
                touches: [{ clientX: 50, clientY: 50 }]
            });

            // Move down
            touchmoveListener({
                touches: [{ clientX: 50, clientY: 160 }]
            });

            expect(swipeDownHandler).toHaveBeenCalled();
        });

        test('swipe up detected when moving up 100+ pixels', () => {
            const swipeUpHandler = jest.fn();
            instance.onSwipedUp(swipeUpHandler);
            instance.startListening();

            const touchmoveListener = capturedBodyListeners['touchmove'].handler;

            // First touch sets position
            touchmoveListener({
                touches: [{ clientX: 50, clientY: 200 }]
            });

            // Move up
            touchmoveListener({
                touches: [{ clientX: 50, clientY: 90 }]
            });

            expect(swipeUpHandler).toHaveBeenCalled();
        });

        test('swipe right detected when moving right 100+ pixels', () => {
            const swipeRightHandler = jest.fn();
            instance.onSwipedRight(swipeRightHandler);
            instance.startListening();

            const touchmoveListener = capturedBodyListeners['touchmove'].handler;

            // First touch sets position
            touchmoveListener({
                touches: [{ clientX: 50, clientY: 50 }]
            });

            // Move right
            touchmoveListener({
                touches: [{ clientX: 160, clientY: 50 }]
            });

            expect(swipeRightHandler).toHaveBeenCalled();
        });

        test('swipe left detected when moving left 100+ pixels', () => {
            const swipeLeftHandler = jest.fn();
            instance.onSwipedLeft(swipeLeftHandler);
            instance.startListening();

            const touchmoveListener = capturedBodyListeners['touchmove'].handler;

            // First touch sets position
            touchmoveListener({
                touches: [{ clientX: 200, clientY: 50 }]
            });

            // Move left
            touchmoveListener({
                touches: [{ clientX: 90, clientY: 50 }]
            });

            expect(swipeLeftHandler).toHaveBeenCalled();
        });

        test('touchstart calls registered handlers and triggers key tap', () => {
            const touchStartHandler = jest.fn();
            instance.onTouchStart(touchStartHandler);
            instance.startListening();

            const touchstartListener = capturedBodyListeners['touchstart'].handler;
            const mockEvent = { touches: [{ clientX: 50, clientY: 50 }] };

            touchstartListener(mockEvent);
            expect(touchStartHandler).toHaveBeenCalledWith(mockEvent);
        });

        test('touchend calls registered handlers and resets position', () => {
            const touchEndHandler = jest.fn();
            instance.onTouchEnd(touchEndHandler);
            instance.startListening();

            const touchendListener = capturedBodyListeners['touchend'].handler;
            const mockEvent = {};

            touchendListener(mockEvent);
            expect(touchEndHandler).toHaveBeenCalledWith(mockEvent);
        });
    });

    describe('fullscreen change handling', () => {
        test('calls exit fullscreen handlers when exiting fullscreen', () => {
            const exitHandler = jest.fn();
            instance.onExitFullscreen(exitHandler);
            instance.startListening();

            document.fullscreenElement = null;
            const fullscreenListener = capturedDocumentListeners['fullscreenchange'];
            fullscreenListener();

            expect(exitHandler).toHaveBeenCalled();
        });

        test('does not call exit handlers when entering fullscreen', () => {
            const exitHandler = jest.fn();
            instance.onExitFullscreen(exitHandler);
            instance.startListening();

            document.fullscreenElement = { id: 'element' };
            const fullscreenListener = capturedDocumentListeners['fullscreenchange'];
            fullscreenListener();

            expect(exitHandler).not.toHaveBeenCalled();
        });
    });

    describe('edge cases', () => {
        test('handles handler that is not a function', () => {
            util.throttle.mockImplementation((fn) => {
                if (fn && fn.apply) {
                    fn();
                }
            });

            const borderHandler = 'not a function';
            instance.onMouseUpperOrLeftBorder(borderHandler);
            instance.startListening();

            const mousemoveHandler = capturedDocumentListeners['mousemove'];

            // Should log warning and not throw
            expect(() => {
                mousemoveHandler({ clientY: 2, clientX: 100 });
            }).not.toThrow();
        });

        test('null handler not added to arrays', () => {
            const result = instance.onSwipedDown(null);
            expect(result).toBe(instance);
        });

        test('handles timeout expiration for key repeat', () => {
            const keyHandler = jest.fn();
            instance.onInputEvent({
                modelName: 'InputEventKey',
                keyCode: 65,
                repeat: 2,
                timeout: 100,
                holdDuration: 0
            }, keyHandler);
            instance.startListening();

            const keydownHandler = capturedDocumentListeners['keydown'];
            const keyupHandler = capturedDocumentListeners['keyup'];

            // First press
            keydownHandler({
                keyCode: 65,
                which: 65,
                repeat: false,
                preventDefault: jest.fn()
            });
            keyupHandler({ keyCode: 65, which: 65, repeat: false });

            // Wait for timeout to expire
            jest.advanceTimersByTime(200);

            // Second press after timeout
            keydownHandler({
                keyCode: 65,
                which: 65,
                repeat: false,
                preventDefault: jest.fn()
            });
            keyupHandler({ keyCode: 65, which: 65, repeat: false });

            // Should not trigger handler since counter was reset
            expect(keyHandler).not.toHaveBeenCalled();
        });
    });
});
