// Mock global objects before importing lquery
global.document = {
  querySelectorAll: jest.fn(),
  getElementById: jest.fn(),
  createElement: jest.fn(() => ({
    className: "",
    innerHTML: "",
    style: {},
    classList: {
      contains: jest.fn(),
      add: jest.fn(),
      remove: jest.fn(),
    },
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    setAttribute: jest.fn(),
    outerHTML: '<option value="test">test</option>',
  })),
  activeElement: null,
  head: {
    appendChild: jest.fn(),
  },
};

global.window = {
  getComputedStyle: jest.fn(() => ({
    getPropertyValue: jest.fn(),
  })),
};

global.navigator = {
  userLanguage: "en-US",
  language: "en-US",
};

global.i18n = {
  TEST_KEY: "Test Value",
  HELLO_KEY: "Hello {?} {?}",
};

global.console = {
  log: jest.fn(),
};

import { L } from "./lquery";

describe("lquery", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("selector function L()", () => {
    test("returns Node directly if passed a Node", () => {
      const node = document.createElement("div");
      expect(L(node)).toBe(node);
    });

    test("returns NodeList directly if passed a NodeList", () => {
      const nodeList = document.querySelectorAll("div");
      expect(L(nodeList)).toBe(nodeList);
    });

    test("returns Array directly if passed an Array", () => {
      const arr = [1, 2, 3];
      expect(L(arr)).toBe(arr);
    });

    test("uses getElementById for # selectors", () => {
      document.getElementById = jest.fn(() => ({ id: "test" }));
      L("#testId");
      expect(document.getElementById).toHaveBeenCalledWith("testId");
    });

    test("uses querySelectorAll for other selectors", () => {
      document.querySelectorAll = jest.fn(() => []);
      L(".test-class");
      expect(document.querySelectorAll).toHaveBeenCalledWith(".test-class");
    });
  });

  describe("L.selectAsList", () => {
    test("returns array from NodeList", () => {
      const mockNodeList = {
        0: { id: 1 },
        1: { id: 2 },
        length: 2,
        [Symbol.iterator]: Array.prototype[Symbol.iterator],
      };
      Object.setPrototypeOf(mockNodeList, NodeList.prototype);
      document.querySelectorAll = jest.fn(() => mockNodeList);

      const result = L.selectAsList(".test");
      expect(Array.isArray(result)).toBe(true);
    });

    test("returns array with single element for getElementById result", () => {
      const elem = { id: "test" };
      document.getElementById = jest.fn(() => elem);

      const result = L.selectAsList("#test");
      expect(result).toEqual([elem]);
    });

    test("flattens nested arrays", () => {
      const arr = [
        [1, 2],
        [3, 4],
      ];
      const result = L.selectAsList(arr);
      expect(result).toEqual([1, 2, 3, 4]);
    });
  });

  describe("L.addClass", () => {
    test("adds class to element", () => {
      const elem = {
        classList: {
          contains: jest.fn(() => false),
          add: jest.fn(),
        },
      };
      document.getElementById = jest.fn(() => elem);

      L.addClass("#test", "new-class");
      expect(elem.classList.add).toHaveBeenCalledWith("new-class");
    });

    test("does not add class if already present", () => {
      const elem = {
        classList: {
          contains: jest.fn(() => true),
          add: jest.fn(),
        },
      };
      document.getElementById = jest.fn(() => elem);

      L.addClass("#test", "existing-class");
      expect(elem.classList.add).not.toHaveBeenCalled();
    });
  });

  describe("L.removeClass", () => {
    test("removes class from element", () => {
      const elem = {
        classList: {
          remove: jest.fn(),
        },
      };
      document.getElementById = jest.fn(() => elem);

      L.removeClass("#test", "some-class");
      expect(elem.classList.remove).toHaveBeenCalledWith("some-class");
    });
  });

  describe("L.toggleClass", () => {
    test("adds class if not present", () => {
      const elem = {
        classList: {
          contains: jest.fn(() => false),
          add: jest.fn(),
          remove: jest.fn(),
        },
      };
      document.getElementById = jest.fn(() => elem);

      L.toggleClass("#test", "toggle-class");
      expect(elem.classList.add).toHaveBeenCalledWith("toggle-class");
    });

    test("removes class if present", () => {
      const elem = {
        classList: {
          contains: jest.fn(() => true),
          add: jest.fn(),
          remove: jest.fn(),
        },
      };
      document.getElementById = jest.fn(() => elem);

      L.toggleClass("#test", "toggle-class");
      expect(elem.classList.remove).toHaveBeenCalledWith("toggle-class");
    });
  });

  describe("L.setVisible", () => {
    test("hides element when visible is false", () => {
      const elem = { style: {} };
      document.getElementById = jest.fn(() => elem);

      L.setVisible("#test", false);
      expect(elem.style.display).toBe("none");
    });

    test("shows element as block by default when visible is true", () => {
      const elem = { style: { display: "none" } };
      document.getElementById = jest.fn(() => elem);

      L.setVisible("#test", true);
      expect(elem.style.display).toBe("block");
    });

    test("uses custom display class when provided", () => {
      const elem = { style: {} };
      document.getElementById = jest.fn(() => elem);

      L.setVisible("#test", true, "flex");
      expect(elem.style.display).toBe("flex");
    });
  });

  describe("L.isVisible", () => {
    test("returns false when display is none", () => {
      const elem = { style: { display: "none" } };
      document.getElementById = jest.fn(() => elem);

      expect(L.isVisible("#test")).toBe(false);
    });

    test("returns true when display is not none", () => {
      const elem = { style: { display: "block" } };
      document.getElementById = jest.fn(() => elem);

      expect(L.isVisible("#test")).toBe(true);
    });
  });

  describe("L.setSelected", () => {
    test("adds selected class and sets aria-selected when selected", () => {
      const elem = {
        classList: {
          contains: jest.fn(() => false),
          add: jest.fn(),
          remove: jest.fn(),
        },
        setAttribute: jest.fn(),
      };
      document.getElementById = jest.fn(() => elem);

      L.setSelected("#test", true);
      expect(elem.classList.add).toHaveBeenCalledWith("selected");
      expect(elem.setAttribute).toHaveBeenCalledWith("aria-selected", true);
    });

    test("removes selected class when not selected", () => {
      const elem = {
        classList: {
          contains: jest.fn(() => false),
          add: jest.fn(),
          remove: jest.fn(),
        },
        setAttribute: jest.fn(),
      };
      document.getElementById = jest.fn(() => elem);

      L.setSelected("#test", false);
      expect(elem.classList.remove).toHaveBeenCalledWith("selected");
      expect(elem.setAttribute).toHaveBeenCalledWith("aria-selected", false);
    });
  });

  describe("L.setValue", () => {
    test.skip('sets value on element', () => {
      const elem = { value: "" };
      document.getElementById = jest.fn(() => elem);

      L.setValue("#test", "new value");
      expect(elem.value).toBe("new value");
    });
  });

  describe("L.hasFocus", () => {
    test("returns true when element has focus", () => {
      const elem = { id: "test" };
      document.getElementById = jest.fn(() => elem);
      Object.defineProperty(document, "activeElement", {
        writable: true,
        configurable: true,
        value: elem,
      });

      expect(L.hasFocus("#test")).toBe(true);
    });

    test("returns false when element does not have focus", () => {
      const elem = { id: "test" };
      document.getElementById = jest.fn(() => elem);
      Object.defineProperty(document, "activeElement", {
        writable: true,
        configurable: true,
        value: { id: "other" },
      });

      expect(L.hasFocus("#test")).toBe(false);
    });
  });

  describe("L.val2key", () => {
    test("returns key for matching value", () => {
      const array = { a: 1, b: 2, c: 3 };
      expect(L.val2key(2, array)).toBe("b");
    });

    test("returns false when value not found", () => {
      const array = { a: 1, b: 2 };
      expect(L.val2key(5, array)).toBe(false);
    });
  });

  describe("L.isFunction", () => {
    test("returns true for functions", () => {
      expect(L.isFunction(() => {})).toBe(true);
      expect(L.isFunction(function () {})).toBe(true);
    });

    test("returns false for non-functions", () => {
      expect(L.isFunction("string")).toBeFalsy();
      expect(L.isFunction(123)).toBeFalsy();
      expect(L.isFunction(null)).toBeFalsy();
      expect(L.isFunction(undefined)).toBeFalsy();
    });
  });

  describe("L.getIDSelector", () => {
    test("returns ID selector string", () => {
      expect(L.getIDSelector("myId")).toBe("#myId");
    });
  });

  describe("L.getPercentage", () => {
    test("calculates percentage correctly", () => {
      expect(L.getPercentage(50, 0, 100)).toBe(50);
      expect(L.getPercentage(25, 0, 100)).toBe(25);
      expect(L.getPercentage(5, 0, 10)).toBe(50);
    });

    test("handles edge cases", () => {
      expect(L.getPercentage(0, 0, 100)).toBe(0);
      expect(L.getPercentage(100, 0, 100)).toBe(100);
    });
  });

  describe("L.getMs", () => {
    test("returns current timestamp", () => {
      const before = Date.now();
      const result = L.getMs();
      const after = Date.now();

      expect(result).toBeGreaterThanOrEqual(before);
      expect(result).toBeLessThanOrEqual(after);
    });
  });

  describe("L.deepCopy", () => {
    test("creates deep copy of object", () => {
      const original = { a: 1, nested: { b: 2 } };
      const copy = L.deepCopy(original);

      expect(copy).toEqual(original);
      expect(copy).not.toBe(original);
      expect(copy.nested).not.toBe(original.nested);
    });

    test("modifying copy does not affect original", () => {
      const original = { a: 1, nested: { b: 2 } };
      const copy = L.deepCopy(original);

      copy.nested.b = 999;
      expect(original.nested.b).toBe(2);
    });
  });

  describe("L.removeAllChildren", () => {
    test("removes all child nodes", () => {
      const elem = {
        firstChild: { id: "child1" },
        removeChild: jest.fn(function () {
          this.firstChild = null;
        }),
      };
      document.getElementById = jest.fn(() => elem);

      L.removeAllChildren("#test");
      expect(elem.removeChild).toHaveBeenCalled();
    });
  });

  describe("L.createElement", () => {
    test("creates element with class name", () => {
      const mockElem = {
        className: "",
        innerHTML: "",
        appendChild: jest.fn(),
      };
      document.createElement = jest.fn(() => mockElem);

      const result = L.createElement("div", "test-class");
      expect(document.createElement).toHaveBeenCalledWith("div");
      expect(result.className).toBe("test-class");
    });

    test("appends string content as innerHTML", () => {
      const mockElem = {
        className: "",
        innerHTML: "",
        appendChild: jest.fn(),
      };
      document.createElement = jest.fn(() => mockElem);

      const result = L.createElement("div", "test", "Hello");
      expect(result.innerHTML).toBe("Hello");
    });
  });

  describe("L.createSelectItems", () => {
    test("creates option elements", () => {
      const mockElem = {
        className: "",
        innerHTML: "",
        value: "",
        outerHTML: '<option value="opt1">opt1</option>',
      };
      document.createElement = jest.fn(() => mockElem);

      const result = L.createSelectItems(["opt1", "opt2"]);
      expect(result).toContain("option");
    });
  });

  describe("L.isLang", () => {
    test("returns true when language matches", () => {
      expect(L.isLang("en")).toBe(true);
    });

    test("returns false when language does not match", () => {
      expect(L.isLang("de")).toBe(false);
    });
  });

  describe("L.getLang", () => {
    test("returns two-letter language code", () => {
      expect(L.getLang()).toBe("en");
    });
  });

  describe("L.translate", () => {
    test("returns translated value for known key", () => {
      expect(L.translate("TEST_KEY")).toBe("Test Value");
    });

    test("returns key if translation not found", () => {
      expect(L.translate("UNKNOWN_KEY")).toBe("UNKNOWN_KEY");
    });

    test("replaces placeholders with arguments", () => {
      expect(L.translate("HELLO_KEY", "John", "Doe")).toBe("Hello John Doe");
    });
  });

  describe("L.getLastElement", () => {
    test("returns last element of array", () => {
      expect(L.getLastElement([1, 2, 3])).toBe(3);
      expect(L.getLastElement(["a", "b"])).toBe("b");
    });

    test("returns undefined for empty array", () => {
      expect(L.getLastElement([])).toBeUndefined();
    });
  });

  describe("L.replaceAll", () => {
    test("replaces all occurrences", () => {
      expect(L.replaceAll("a-b-c", "-", "_")).toBe("a_b_c");
      expect(L.replaceAll("hello world world", "world", "test")).toBe(
        "hello test test",
      );
    });
  });

  describe("L.equalIgnoreCase", () => {
    test("compares strings case-insensitively", () => {
      expect(L.equalIgnoreCase("Hello", "hello")).toBe(true);
      expect(L.equalIgnoreCase("WORLD", "world")).toBe(true);
      expect(L.equalIgnoreCase("abc", "xyz")).toBe(false);
    });
  });

  describe("L.loadScript", () => {
    let originalAppendChild;

    beforeEach(() => {
      originalAppendChild = document.head.appendChild;
      document.head.appendChild = jest.fn();
    });

    afterEach(() => {
      document.head.appendChild = originalAppendChild;
    });

    test("creates script element and adds to head", async () => {
      const mockScript = {
        onload: null,
        onerror: null,
        src: "",
      };
      document.createElement = jest.fn(() => mockScript);

      const promise = L.loadScript("test.js");
      mockScript.onload();

      await expect(promise).resolves.toBe(true);
      expect(document.head.appendChild).toHaveBeenCalled();
    });

    test("uses fallback on error", async () => {
      const mockScript = {
        onload: null,
        onerror: null,
        src: "",
      };
      document.createElement = jest.fn(() => mockScript);

      const promise = L.loadScript("test.js", "fallback.js");
      mockScript.onerror();

      // Trigger the fallback script load
      mockScript.onload();

      await expect(promise).resolves.toBe(true);
    });
  });

  describe("L.flattenArray", () => {
    test("flattens one level of nesting", () => {
      expect(
        L.flattenArray([
          [1, 2],
          [3, 4],
        ]),
      ).toEqual([1, 2, 3, 4]);
    });
  });

  describe("L.flattenArrayDeep", () => {
    test("flattens deeply nested arrays", () => {
      expect(L.flattenArrayDeep([[[1]], [[2]], [3]])).toEqual([1, 2, 3]);
      expect(L.flattenArrayDeep([1, [2, [3, [4]]]])).toEqual([1, 2, 3, 4]);
    });
  });

  describe("L.convertToKeyCode", () => {
    test("converts alphanumeric characters to key codes", () => {
      expect(L.convertToKeyCode("a")).toBe(65);
      expect(L.convertToKeyCode("A")).toBe(65);
      expect(L.convertToKeyCode("5")).toBe(53);
    });

    test("returns null for non-alphanumeric characters", () => {
      expect(L.convertToKeyCode("!")).toBeNull();
      expect(L.convertToKeyCode(" ")).toBeNull();
    });
  });

  describe("L.getRandomInt", () => {
    test("returns integer within range", () => {
      jest.spyOn(Math, "random").mockReturnValue(0.5);

      const result = L.getRandomInt(1, 10);
      expect(result).toBeGreaterThanOrEqual(1);
      expect(result).toBeLessThanOrEqual(10);
      expect(Number.isInteger(result)).toBe(true);

      Math.random.mockRestore();
    });

    test("returns min when random is 0", () => {
      jest.spyOn(Math, "random").mockReturnValue(0);
      expect(L.getRandomInt(5, 10)).toBe(5);
      Math.random.mockRestore();
    });
  });

  describe("toggle functions", () => {
    test("L.toggle does nothing with insufficient arguments", () => {
      L.toggle();
      // Should not throw
    });

    test("L.toggleInline does nothing with insufficient arguments", () => {
      L.toggleInline();
      // Should not throw
    });
  });
});
