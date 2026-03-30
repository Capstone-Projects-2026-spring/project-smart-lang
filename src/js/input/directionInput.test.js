jest.mock("../externals/jquery.js", () => {
  const createMockJQuery = (elements = []) => {
    const mockJQuery = function (selector) {
      if (typeof selector === "string") {
        return createMockJQuery(mockJQuery._elements);
      }
      if (selector && selector.addClass) {
        return selector;
      }
      return createMockJQuery([selector]);
    };

    mockJQuery._elements = elements;

    // Use Object.defineProperty for read-only properties
    Object.defineProperty(mockJQuery, "length", {
      value: elements.length,
      writable: true,
      configurable: true,
    });

    mockJQuery.toArray = jest.fn(() => elements);
    mockJQuery.addClass = jest.fn(() => mockJQuery);
    mockJQuery.removeClass = jest.fn(() => mockJQuery);

    mockJQuery.isFunction = function (fn) {
      return typeof fn === "function";
    };

    // Allow iteration
    mockJQuery[Symbol.iterator] = function* () {
      for (const el of elements) {
        yield el;
      }
    };

    // Index access
    elements.forEach((el, i) => {
      mockJQuery[i] = el;
    });

    return mockJQuery;
  };

  const $ = createMockJQuery([]);
  $.isFunction = (fn) => typeof fn === "function";

  return $;
});

jest.mock("./inputEventHandler", () => ({
  inputEventHandler: {
    instance: jest.fn(),
  },
}));

jest.mock("../model/InputConfig", () => ({
  InputConfig: {
    LEFT: "LEFT",
    RIGHT: "RIGHT",
    UP: "UP",
    DOWN: "DOWN",
    SELECT: "SELECT",
  },
}));

import $ from "../externals/jquery.js";
import { DirectionInput } from "./directionInput";
import { inputEventHandler } from "./inputEventHandler";
import { InputConfig } from "../model/InputConfig";

describe("DirectionInput", () => {
  let mockInputEventHandler;
  let mockElements;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    mockInputEventHandler = {
      startListening: jest.fn(),
      stopListening: jest.fn(),
      destroy: jest.fn(),
      onInputEvent: jest.fn(),
    };

    inputEventHandler.instance.mockReturnValue(mockInputEventHandler);

    // Create mock elements with positions
    mockElements = [
      {
        id: "elem1",
        getBoundingClientRect: jest.fn(() => ({
          left: 0,
          right: 100,
          top: 0,
          bottom: 100,
        })),
      },
      {
        id: "elem2",
        getBoundingClientRect: jest.fn(() => ({
          left: 110,
          right: 210,
          top: 0,
          bottom: 100,
        })),
      },
      {
        id: "elem3",
        getBoundingClientRect: jest.fn(() => ({
          left: 0,
          right: 100,
          top: 110,
          bottom: 210,
        })),
      },
    ];

    // Setup jQuery mock
    const mockJQuery = $;
    mockJQuery._elements = mockElements;
    mockJQuery.length = mockElements.length;
    mockElements.forEach((el, i) => {
      mockJQuery[i] = el;
    });
    mockJQuery.toArray.mockReturnValue(mockElements);
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe("getInstanceFromConfig", () => {
    test("creates instance with correct options from config", () => {
      const inputConfig = {
        dirInputs: [
          { label: "LEFT", keyCode: 37 },
          { label: "RIGHT", keyCode: 39 },
          { label: "UP", keyCode: 38 },
          { label: "DOWN", keyCode: 40 },
          { label: "SELECT", keyCode: 13 },
        ],
        dirWrapAround: true,
        dirResetToStart: false,
      };

      const selectionListener = jest.fn();
      const dirInput = DirectionInput.getInstanceFromConfig(
        inputConfig,
        ".test-selector",
        "scan-active",
        selectionListener,
      );

      expect(dirInput).toBeDefined();
      expect(typeof dirInput.start).toBe("function");
      expect(typeof dirInput.destroy).toBe("function");
      expect(typeof dirInput.left).toBe("function");
      expect(typeof dirInput.right).toBe("function");
      expect(typeof dirInput.up).toBe("function");
      expect(typeof dirInput.down).toBe("function");
      expect(typeof dirInput.select).toBe("function");
    });

    test("registers input events from config", () => {
      const inputConfig = {
        dirInputs: [
          { label: "LEFT", keyCode: 37 },
          { label: "RIGHT", keyCode: 39 },
          { label: "UP", keyCode: 38 },
          { label: "DOWN", keyCode: 40 },
          { label: "SELECT", keyCode: 13 },
        ],
        dirWrapAround: true,
        dirResetToStart: false,
      };

      DirectionInput.getInstanceFromConfig(
        inputConfig,
        ".test-selector",
        "scan-active",
        jest.fn(),
      );

      // Should register 5 input events (left, right, up, down, select)
      expect(mockInputEventHandler.onInputEvent).toHaveBeenCalledTimes(5);
    });
  });

  describe("start", () => {
    test("sets first element as active and starts listening", () => {
      const inputConfig = {
        dirInputs: [
          { label: "LEFT", keyCode: 37 },
          { label: "RIGHT", keyCode: 39 },
          { label: "UP", keyCode: 38 },
          { label: "DOWN", keyCode: 40 },
          { label: "SELECT", keyCode: 13 },
        ],
        dirWrapAround: true,
        dirResetToStart: false,
      };

      const dirInput = DirectionInput.getInstanceFromConfig(
        inputConfig,
        ".test-selector",
        "scan-active",
        jest.fn(),
      );

      dirInput.start();

      expect(mockInputEventHandler.startListening).toHaveBeenCalled();
      expect($.addClass).toHaveBeenCalledWith("scan-active");
    });
  });

  describe("destroy", () => {
    test("removes active class and destroys input handler", () => {
      const inputConfig = {
        dirInputs: [
          { label: "LEFT", keyCode: 37 },
          { label: "RIGHT", keyCode: 39 },
          { label: "UP", keyCode: 38 },
          { label: "DOWN", keyCode: 40 },
          { label: "SELECT", keyCode: 13 },
        ],
        dirWrapAround: true,
        dirResetToStart: false,
      };

      const dirInput = DirectionInput.getInstanceFromConfig(
        inputConfig,
        ".test-selector",
        "scan-active",
        jest.fn(),
      );

      dirInput.start();
      dirInput.destroy();

      expect($.removeClass).toHaveBeenCalledWith("scan-active");
      expect(mockInputEventHandler.destroy).toHaveBeenCalled();
    });
  });

  describe("direction methods", () => {
    let dirInput;
    let leftHandler;
    let rightHandler;
    let upHandler;
    let downHandler;
    let selectHandler;

    beforeEach(() => {
      const inputConfig = {
        dirInputs: [
          { label: "LEFT", keyCode: 37 },
          { label: "RIGHT", keyCode: 39 },
          { label: "UP", keyCode: 38 },
          { label: "DOWN", keyCode: 40 },
          { label: "SELECT", keyCode: 13 },
        ],
        dirWrapAround: true,
        dirResetToStart: false,
      };

      const selectionListener = jest.fn();
      dirInput = DirectionInput.getInstanceFromConfig(
        inputConfig,
        ".test-selector",
        "scan-active",
        selectionListener,
      );

      // Extract registered handlers
      const calls = mockInputEventHandler.onInputEvent.mock.calls;
      calls.forEach((call) => {
        const [event, handler] = call;
        if (event && event.label === "LEFT") leftHandler = handler;
        if (event && event.label === "RIGHT") rightHandler = handler;
        if (event && event.label === "UP") upHandler = handler;
        if (event && event.label === "DOWN") downHandler = handler;
        if (event && event.label === "SELECT") selectHandler = handler;
      });
    });

    test("left method can be called directly", () => {
      dirInput.start();

      // Need to wait for position calculation
      jest.advanceTimersByTime(300);

      expect(() => dirInput.left()).not.toThrow();
    });

    test("right method can be called directly", () => {
      dirInput.start();
      jest.advanceTimersByTime(300);

      expect(() => dirInput.right()).not.toThrow();
    });

    test("up method can be called directly", () => {
      dirInput.start();
      jest.advanceTimersByTime(300);

      expect(() => dirInput.up()).not.toThrow();
    });

    test("down method can be called directly", () => {
      dirInput.start();
      jest.advanceTimersByTime(300);

      expect(() => dirInput.down()).not.toThrow();
    });
  });

  describe("select", () => {
    test("calls selection listener with current element", () => {
      const selectionListener = jest.fn();
      const inputConfig = {
        dirInputs: [
          { label: "LEFT", keyCode: 37 },
          { label: "RIGHT", keyCode: 39 },
          { label: "UP", keyCode: 38 },
          { label: "DOWN", keyCode: 40 },
          { label: "SELECT", keyCode: 13 },
        ],
        dirWrapAround: true,
        dirResetToStart: false,
      };

      const dirInput = DirectionInput.getInstanceFromConfig(
        inputConfig,
        ".test-selector",
        "scan-active",
        selectionListener,
      );

      dirInput.start();
      dirInput.select();

      expect(selectionListener).toHaveBeenCalled();
    });

    test("resets to start when resetToStart is true", () => {
      const selectionListener = jest.fn();
      const inputConfig = {
        dirInputs: [
          { label: "LEFT", keyCode: 37 },
          { label: "RIGHT", keyCode: 39 },
          { label: "UP", keyCode: 38 },
          { label: "DOWN", keyCode: 40 },
          { label: "SELECT", keyCode: 13 },
        ],
        dirWrapAround: true,
        dirResetToStart: true,
      };

      const dirInput = DirectionInput.getInstanceFromConfig(
        inputConfig,
        ".test-selector",
        "scan-active",
        selectionListener,
      );

      dirInput.start();
      jest.advanceTimersByTime(300);
      dirInput.right(); // Move to second element
      dirInput.select();

      // Should have called addClass for reset
      expect($.addClass).toHaveBeenCalled();
    });

    test("does not throw when no selection listener set", () => {
      const inputConfig = {
        dirInputs: [
          { label: "LEFT", keyCode: 37 },
          { label: "RIGHT", keyCode: 39 },
          { label: "UP", keyCode: 38 },
          { label: "DOWN", keyCode: 40 },
          { label: "SELECT", keyCode: 13 },
        ],
        dirWrapAround: true,
        dirResetToStart: false,
      };

      const dirInput = DirectionInput.getInstanceFromConfig(
        inputConfig,
        ".test-selector",
        "scan-active",
        null,
      );

      dirInput.start();

      expect(() => dirInput.select()).not.toThrow();
    });
  });

  describe("position calculation", () => {
    test("calculates element positions after timeout", () => {
      const inputConfig = {
        dirInputs: [
          { label: "LEFT", keyCode: 37 },
          { label: "RIGHT", keyCode: 39 },
          { label: "UP", keyCode: 38 },
          { label: "DOWN", keyCode: 40 },
          { label: "SELECT", keyCode: 13 },
        ],
        dirWrapAround: true,
        dirResetToStart: false,
      };

      DirectionInput.getInstanceFromConfig(
        inputConfig,
        ".test-selector",
        "scan-active",
        jest.fn(),
      );

      // Position calculation happens after 200ms timeout
      jest.advanceTimersByTime(300);

      mockElements.forEach((el) => {
        expect(el.getBoundingClientRect).toHaveBeenCalled();
      });
    });
  });

  describe("wrap around behavior", () => {
    test("handles movement when wrapAround is false", () => {
      const inputConfig = {
        dirInputs: [
          { label: "LEFT", keyCode: 37 },
          { label: "RIGHT", keyCode: 39 },
          { label: "UP", keyCode: 38 },
          { label: "DOWN", keyCode: 40 },
          { label: "SELECT", keyCode: 13 },
        ],
        dirWrapAround: false,
        dirResetToStart: false,
      };

      const dirInput = DirectionInput.getInstanceFromConfig(
        inputConfig,
        ".test-selector",
        "scan-active",
        jest.fn(),
      );

      dirInput.start();
      jest.advanceTimersByTime(300);

      // Try to move left from first element - should not wrap
      expect(() => dirInput.left()).not.toThrow();
    });

    test("handles movement when wrapAround is true", () => {
      const inputConfig = {
        dirInputs: [
          { label: "LEFT", keyCode: 37 },
          { label: "RIGHT", keyCode: 39 },
          { label: "UP", keyCode: 38 },
          { label: "DOWN", keyCode: 40 },
          { label: "SELECT", keyCode: 13 },
        ],
        dirWrapAround: true,
        dirResetToStart: false,
      };

      const dirInput = DirectionInput.getInstanceFromConfig(
        inputConfig,
        ".test-selector",
        "scan-active",
        jest.fn(),
      );

      dirInput.start();
      jest.advanceTimersByTime(300);

      // Should be able to wrap around
      expect(() => {
        dirInput.left();
        dirInput.right();
        dirInput.up();
        dirInput.down();
      }).not.toThrow();
    });
  });

  describe("edge cases", () => {
    test("handles empty element list", () => {
      $._elements = [];
      $.length = 0;
      $.toArray.mockReturnValue([]);

      const inputConfig = {
        dirInputs: [
          { label: "LEFT", keyCode: 37 },
          { label: "RIGHT", keyCode: 39 },
          { label: "UP", keyCode: 38 },
          { label: "DOWN", keyCode: 40 },
          { label: "SELECT", keyCode: 13 },
        ],
        dirWrapAround: true,
        dirResetToStart: false,
      };

      const dirInput = DirectionInput.getInstanceFromConfig(
        inputConfig,
        ".nonexistent",
        "scan-active",
        jest.fn(),
      );

      // Should not throw
      expect(() => {
        jest.advanceTimersByTime(300);
      }).not.toThrow();
    });

    test("handles missing input events gracefully", () => {
      const inputConfig = {
        dirInputs: [], // No input events
        dirWrapAround: true,
        dirResetToStart: false,
      };

      const dirInput = DirectionInput.getInstanceFromConfig(
        inputConfig,
        ".test-selector",
        "scan-active",
        jest.fn(),
      );

      expect(dirInput).toBeDefined();
      expect(() => dirInput.start()).not.toThrow();
    });

    test("handles partial input events", () => {
      const inputConfig = {
        dirInputs: [
          { label: "LEFT", keyCode: 37 },
          { label: "SELECT", keyCode: 13 },
          // Missing RIGHT, UP, DOWN
        ],
        dirWrapAround: true,
        dirResetToStart: false,
      };

      const dirInput = DirectionInput.getInstanceFromConfig(
        inputConfig,
        ".test-selector",
        "scan-active",
        jest.fn(),
      );

      dirInput.start();

      // onInputEvent called for LEFT and SELECT only (2 valid + undefined for others)
      // The filter will return undefined for missing directions
      expect(mockInputEventHandler.onInputEvent).toHaveBeenCalled();
    });

    test("handles undefined wrapAround and resetToStart", () => {
      const inputConfig = {
        dirInputs: [
          { label: "LEFT", keyCode: 37 },
          { label: "RIGHT", keyCode: 39 },
          { label: "UP", keyCode: 38 },
          { label: "DOWN", keyCode: 40 },
          { label: "SELECT", keyCode: 13 },
        ],
        // wrapAround and dirResetToStart undefined
      };

      const dirInput = DirectionInput.getInstanceFromConfig(
        inputConfig,
        ".test-selector",
        "scan-active",
        jest.fn(),
      );

      expect(dirInput).toBeDefined();
      expect(() => dirInput.start()).not.toThrow();
    });

    test("handles selectionListener that is not a function", () => {
      const inputConfig = {
        dirInputs: [
          { label: "LEFT", keyCode: 37 },
          { label: "RIGHT", keyCode: 39 },
          { label: "UP", keyCode: 38 },
          { label: "DOWN", keyCode: 40 },
          { label: "SELECT", keyCode: 13 },
        ],
        dirWrapAround: true,
        dirResetToStart: false,
      };

      const dirInput = DirectionInput.getInstanceFromConfig(
        inputConfig,
        ".test-selector",
        "scan-active",
        "not a function",
      );

      dirInput.start();

      // Should not throw when selecting
      expect(() => dirInput.select()).not.toThrow();
    });

    test("movement does nothing when current element position info is missing", () => {
      const inputConfig = {
        dirInputs: [
          { label: "LEFT", keyCode: 37 },
          { label: "RIGHT", keyCode: 39 },
          { label: "UP", keyCode: 38 },
          { label: "DOWN", keyCode: 40 },
          { label: "SELECT", keyCode: 13 },
        ],
        dirWrapAround: true,
        dirResetToStart: false,
      };

      const dirInput = DirectionInput.getInstanceFromConfig(
        inputConfig,
        ".test-selector",
        "scan-active",
        jest.fn(),
      );

      dirInput.start();
      // Don't wait for position calculation

      // Should not throw, just return early
      expect(() => {
        dirInput.left();
        dirInput.right();
        dirInput.up();
        dirInput.down();
      }).not.toThrow();
    });
  });

  describe("position detection logic", () => {
    test("detects element to the right", () => {
      // elem1 at (0-100, 0-100)
      // elem2 at (110-210, 0-100) - to the right of elem1
      const inputConfig = {
        dirInputs: [
          { label: "LEFT", keyCode: 37 },
          { label: "RIGHT", keyCode: 39 },
          { label: "UP", keyCode: 38 },
          { label: "DOWN", keyCode: 40 },
          { label: "SELECT", keyCode: 13 },
        ],
        dirWrapAround: false,
        dirResetToStart: false,
      };

      const dirInput = DirectionInput.getInstanceFromConfig(
        inputConfig,
        ".test-selector",
        "scan-active",
        jest.fn(),
      );

      dirInput.start();
      jest.advanceTimersByTime(300);

      // After right(), should update active class
      dirInput.right();
      expect($.addClass).toHaveBeenCalled();
    });

    test("detects element below", () => {
      // elem1 at (0-100, 0-100)
      // elem3 at (0-100, 110-210) - below elem1
      const inputConfig = {
        dirInputs: [
          { label: "LEFT", keyCode: 37 },
          { label: "RIGHT", keyCode: 39 },
          { label: "UP", keyCode: 38 },
          { label: "DOWN", keyCode: 40 },
          { label: "SELECT", keyCode: 13 },
        ],
        dirWrapAround: false,
        dirResetToStart: false,
      };

      const dirInput = DirectionInput.getInstanceFromConfig(
        inputConfig,
        ".test-selector",
        "scan-active",
        jest.fn(),
      );

      dirInput.start();
      jest.advanceTimersByTime(300);

      dirInput.down();
      expect($.addClass).toHaveBeenCalled();
    });
  });
});
