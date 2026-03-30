/**
 * Tests for stateService.js
 * Tests state management, word form handling, and listener functionality.
 */

// Mock dependencies
jest.mock("../externals/jquery.js", () => {
  const mockJQuery = jest.fn(() => mockJQuery);
  mockJQuery.trigger = jest.fn();
  mockJQuery.on = jest.fn();
  return mockJQuery;
});

jest.mock("./i18nService.js", () => ({
  i18nService: {
    getContentLang: jest.fn(() => "en"),
    getTranslation: jest.fn((label, options) => {
      if (typeof label === "object") {
        const lang = options?.lang || "en";
        return label[lang] || label.en || Object.values(label)[0] || "";
      }
      return label || "";
    }),
  },
}));

jest.mock("../model/GridElement.js", () => ({
  GridElement: {
    ELEMENT_TYPE_NORMAL: "ELEMENT_TYPE_NORMAL",
  },
}));

jest.mock("../util/constants.js", () => ({
  constants: {
    EVENT_ELEM_TEXT_CHANGED: "EVENT_ELEM_TEXT_CHANGED",
    EVENT_METADATA_UPDATED: "EVENT_METADATA_UPDATED",
    EVENT_USER_CHANGED: "EVENT_USER_CHANGED",
  },
}));

jest.mock("../util/util.js", () => ({
  util: {
    convertLowerUppercase: jest.fn((text, mode) => text),
    deduplicateArray: jest.fn((arr) => [...new Set(arr)]),
  },
}));

jest.mock("./data/dataService.js", () => ({
  dataService: {
    getMetadata: jest.fn(() =>
      Promise.resolve({
        textConfig: { convertMode: null },
      }),
    ),
  },
}));

jest.mock("../model/GridActionWordForm.js", () => ({
  GridActionWordForm: {
    getModelName: jest.fn(() => "GridActionWordForm"),
    WORDFORM_MODE_NEXT_FORM: "WORDFORM_MODE_NEXT_FORM",
  },
}));

jest.mock("../util/gridUtil", () => ({
  gridUtil: {
    getWordFormsForLang: jest.fn((element, lang) => {
      if (!element || !element.wordForms || element.wordForms.length === 0) {
        return [];
      }
      const targetLang = lang || "en";
      return element.wordForms
        .filter((wf) => wf.lang === targetLang)
        .map((wf, index) => ({
          value: wf.value,
          tags: wf.tags || [],
          pronunciation: wf.pronunciation,
          id: index,
        }));
    }),
    getDisplayLabel: jest.fn((element) => {
      if (!element) return "";
      if (typeof element.label === "string") return element.label;
      return element.label?.en || Object.values(element.label || {})[0] || "";
    }),
    getFirstWordFormObject: jest.fn((element, lang) => {
      if (!element || !element.wordForms || element.wordForms.length === 0) {
        return null;
      }
      const targetLang = lang || "en";
      const form = element.wordForms.find((wf) => wf.lang === targetLang);
      return form
        ? { value: form.value, pronunciation: form.pronunciation }
        : null;
    }),
  },
}));

import { stateService } from "./stateService.js";
import { i18nService } from "./i18nService.js";
import { gridUtil } from "../util/gridUtil";
import $ from "../externals/jquery.js";

describe("stateService", () => {
  // Helper to set up a minimal grid to prevent null errors
  const setupMinimalGrid = () => {
    stateService.setCurrentGrid({ id: "default-grid", gridElements: [] });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset internal state - set a minimal grid first to avoid null errors
    stateService.clearListeners();
    setupMinimalGrid();
    stateService.setGlobalGrid(null);
    stateService.resetWordForms();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("setCurrentGrid and setGlobalGrid", () => {
    test("setCurrentGrid sets the current grid", () => {
      const mockGrid = {
        id: "grid-1",
        gridElements: [{ id: "elem-1", label: { en: "Test" } }],
      };
      stateService.setCurrentGrid(mockGrid);
      // Can verify via getDisplayText or hasGlobalGridElement
      expect(stateService.hasGlobalGridElement("elem-1")).toBe(false);
    });

    test("setGlobalGrid sets the global grid", () => {
      const mockGlobalGrid = {
        id: "global-grid-1",
        gridElements: [{ id: "global-elem-1", label: { en: "Global" } }],
      };
      stateService.setGlobalGrid(mockGlobalGrid);
      expect(stateService.hasGlobalGridElement("global-elem-1")).toBe(true);
    });
  });

  describe("hasGlobalGridElement", () => {
    test("returns false when no global grid is set", () => {
      expect(stateService.hasGlobalGridElement("any-id")).toBe(false);
    });

    test("returns true when element exists in global grid", () => {
      stateService.setGlobalGrid({
        id: "gg",
        gridElements: [{ id: "global-1" }, { id: "global-2" }],
      });
      expect(stateService.hasGlobalGridElement("global-1")).toBe(true);
      expect(stateService.hasGlobalGridElement("global-2")).toBe(true);
    });

    test("returns false when element does not exist in global grid", () => {
      stateService.setGlobalGrid({
        id: "gg",
        gridElements: [{ id: "global-1" }],
      });
      expect(stateService.hasGlobalGridElement("nonexistent")).toBe(false);
    });
  });

  describe("mergeTags", () => {
    test("adds new tags to existing tags (toggle=false)", () => {
      const result = stateService.mergeTags(["a", "b"], ["c", "d"], false);
      expect(result).toEqual(["a", "b", "c", "d"]);
    });

    test("adds tags when toggle=true and tag not present", () => {
      const result = stateService.mergeTags(["a"], ["b"], true);
      expect(result).toEqual(["a", "b"]);
    });

    test("removes tags when toggle=true and tag already present", () => {
      const result = stateService.mergeTags(["a", "b", "c"], ["b"], true);
      expect(result).toEqual(["a", "c"]);
    });

    test("handles empty existing tags", () => {
      const result = stateService.mergeTags([], ["a", "b"], false);
      expect(result).toEqual(["a", "b"]);
    });

    test("handles empty new tags", () => {
      const result = stateService.mergeTags(["a", "b"], [], false);
      expect(result).toEqual(["a", "b"]);
    });

    test("handles duplicate tags in toggle mode", () => {
      const result = stateService.mergeTags(["a", "b"], ["a", "c"], true);
      // 'a' is present, so removed; 'c' is not present, so added
      expect(result).toEqual(["b", "c"]);
    });
  });

  describe("resetWordForms", () => {
    test("clears all word form state", () => {
      stateService.addWordFormTags(["tag1"], false);
      expect(stateService.getCurrentWordFormTags()).toEqual(["tag1"]);

      stateService.resetWordForms();

      expect(stateService.getCurrentWordFormTags()).toEqual([]);
    });
  });

  describe("resetWordFormTags", () => {
    test("clears only word form tags", () => {
      stateService.addWordFormTags(["tag1", "tag2"], false);
      expect(stateService.getCurrentWordFormTags()).toContain("tag1");

      stateService.resetWordFormTags();

      expect(stateService.getCurrentWordFormTags()).toEqual([]);
    });
  });

  describe("getCurrentWordFormTags", () => {
    test("returns empty array initially", () => {
      expect(stateService.getCurrentWordFormTags()).toEqual([]);
    });

    test("returns copy of tags (not reference)", () => {
      stateService.addWordFormTags(["a"], false);
      const tags1 = stateService.getCurrentWordFormTags();
      const tags2 = stateService.getCurrentWordFormTags();

      expect(tags1).toEqual(tags2);
      expect(tags1).not.toBe(tags2); // Different references
    });
  });

  describe("addWordFormTags", () => {
    beforeEach(() => {
      stateService.setCurrentGrid({
        id: "grid-1",
        gridElements: [],
      });
    });

    test("adds tags to current word form tags", () => {
      stateService.addWordFormTags(["plural"], false);
      expect(stateService.getCurrentWordFormTags()).toContain("plural");
    });

    test("toggles existing tags when toggle=true", () => {
      stateService.addWordFormTags(["plural"], false);
      stateService.addWordFormTags(["plural"], true);
      expect(stateService.getCurrentWordFormTags()).not.toContain("plural");
    });
  });

  describe("getDisplayText", () => {
    test("returns empty string for null element", () => {
      stateService.setCurrentGrid({ id: "g1", gridElements: [] });
      expect(stateService.getDisplayText("nonexistent")).toBe("");
    });

    test("returns empty string when no current grid", () => {
      expect(stateService.getDisplayText("any")).toBe("");
    });

    test("returns label when element exists and no word forms", () => {
      const mockElement = {
        id: "elem-1",
        type: "ELEMENT_TYPE_NORMAL",
        label: { en: "Hello" },
        wordForms: [],
        actions: [],
      };
      stateService.setCurrentGrid({
        id: "grid-1",
        gridElements: [mockElement],
      });

      gridUtil.getDisplayLabel.mockReturnValueOnce("Hello");

      const result = stateService.getDisplayText("elem-1");
      expect(result).toBe("Hello");
    });
  });

  describe("getSpeakText", () => {
    test("returns empty string for null element", () => {
      stateService.setCurrentGrid({ id: "g1", gridElements: [] });
      expect(stateService.getSpeakText("nonexistent", {})).toBe("");
    });

    test("returns label when no word forms available", () => {
      const mockElement = {
        id: "elem-1",
        label: { en: "Hello" },
        wordForms: [],
        pronunciation: {},
      };
      stateService.setCurrentGrid({
        id: "grid-1",
        gridElements: [mockElement],
      });

      i18nService.getTranslation.mockReturnValueOnce("Hello");

      const result = stateService.getSpeakText("elem-1", { lang: "en" });
      expect(result).toBe("Hello");
    });

    test("accepts element object instead of id", () => {
      const mockElement = {
        id: "elem-1",
        label: { en: "Test" },
        wordForms: [],
        pronunciation: {},
      };
      stateService.setCurrentGrid({
        id: "grid-1",
        gridElements: [mockElement],
      });

      i18nService.getTranslation.mockReturnValueOnce("Test");

      const result = stateService.getSpeakText(mockElement, { lang: "en" });
      expect(typeof result).toBe("string");
    });
  });

  describe("getWordForm", () => {
    test("returns null when element has no word forms", () => {
      const mockElement = {
        id: "elem-1",
        wordForms: [],
      };
      stateService.setCurrentGrid({
        id: "grid-1",
        gridElements: [mockElement],
      });

      const result = stateService.getWordForm(mockElement, {
        searchTags: ["plural"],
      });
      expect(result).toBeNull();
    });
  });

  describe("getWordFormObject", () => {
    test("returns null when no matching word form", () => {
      const mockElement = {
        id: "elem-1",
        wordForms: [],
      };

      gridUtil.getWordFormsForLang.mockReturnValueOnce([]);

      const result = stateService.getWordFormObject(mockElement, {
        searchTags: ["plural"],
      });
      expect(result).toBeNull();
    });

    test("returns form by wordFormId if provided", () => {
      const mockElement = {
        id: "elem-1",
        wordForms: [
          { lang: "en", value: "form0", tags: [] },
          { lang: "en", value: "form1", tags: [] },
        ],
      };

      gridUtil.getWordFormsForLang.mockReturnValueOnce([
        { value: "form0", tags: [], id: 0 },
        { value: "form1", tags: [], id: 1 },
      ]);

      const result = stateService.getWordFormObject(mockElement, {
        wordFormId: 1,
      });
      expect(result.value).toBe("form1");
    });
  });

  describe("setState and getState", () => {
    test("sets and gets state correctly", () => {
      stateService.setState("testKey", "testValue");
      expect(stateService.getState("testKey")).toBe("testValue");
    });

    test("returns undefined for non-existent state", () => {
      expect(stateService.getState("nonexistent")).toBeUndefined();
    });

    test("overwrites existing state", () => {
      stateService.setState("key", "value1");
      stateService.setState("key", "value2");
      expect(stateService.getState("key")).toBe("value2");
    });

    test("handles various value types", () => {
      stateService.setState("string", "hello");
      stateService.setState("number", 42);
      stateService.setState("object", { a: 1 });
      stateService.setState("array", [1, 2, 3]);
      stateService.setState("boolean", true);
      stateService.setState("null", null);

      expect(stateService.getState("string")).toBe("hello");
      expect(stateService.getState("number")).toBe(42);
      expect(stateService.getState("object")).toEqual({ a: 1 });
      expect(stateService.getState("array")).toEqual([1, 2, 3]);
      expect(stateService.getState("boolean")).toBe(true);
      expect(stateService.getState("null")).toBeNull();
    });
  });

  describe("onStateChanged", () => {
    test("calls listener when state changes", () => {
      const listener = jest.fn();
      stateService.onStateChanged("myKey", listener);

      stateService.setState("myKey", "newValue");

      expect(listener).toHaveBeenCalledWith("newValue");
    });

    test("does not call listener when state is same", () => {
      const listener = jest.fn();
      stateService.setState("myKey", "sameValue");
      stateService.onStateChanged("myKey", listener);

      stateService.setState("myKey", "sameValue");

      expect(listener).not.toHaveBeenCalled();
    });

    test("supports multiple listeners for same key", () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      stateService.onStateChanged("sharedKey", listener1);
      stateService.onStateChanged("sharedKey", listener2);

      stateService.setState("sharedKey", "value");

      expect(listener1).toHaveBeenCalledWith("value");
      expect(listener2).toHaveBeenCalledWith("value");
    });

    test("listeners are independent per key", () => {
      const listenerA = jest.fn();
      const listenerB = jest.fn();
      stateService.onStateChanged("keyA", listenerA);
      stateService.onStateChanged("keyB", listenerB);

      stateService.setState("keyA", "valueA");

      expect(listenerA).toHaveBeenCalledWith("valueA");
      expect(listenerB).not.toHaveBeenCalled();
    });
  });

  describe("clearListeners", () => {
    test("clears all listeners when no key provided", () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      stateService.onStateChanged("key1", listener1);
      stateService.onStateChanged("key2", listener2);

      stateService.clearListeners();

      stateService.setState("key1", "a");
      stateService.setState("key2", "b");

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).not.toHaveBeenCalled();
    });

    test("clears only specified key listeners", () => {
      const listener1 = jest.fn();
      const listener2 = jest.fn();
      stateService.onStateChanged("key1", listener1);
      stateService.onStateChanged("key2", listener2);

      stateService.clearListeners("key1");

      stateService.setState("key1", "value-a-" + Date.now());
      stateService.setState("key2", "value-b-" + Date.now());

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalled();
      expect(listener2).toHaveBeenCalledWith(
        expect.stringContaining("value-b-"),
      );
    });
  });

  describe("nextWordForm", () => {
    test("returns undefined when element not found", () => {
      stateService.setCurrentGrid({ id: "g1", gridElements: [] });
      const result = stateService.nextWordForm("nonexistent");
      expect(result).toBeUndefined();
    });

    test("returns undefined when element has no word forms", () => {
      const mockElement = {
        id: "elem-1",
        wordForms: [],
        actions: [],
      };
      stateService.setCurrentGrid({
        id: "grid-1",
        gridElements: [mockElement],
      });

      gridUtil.getWordFormsForLang.mockReturnValueOnce([]);

      const result = stateService.nextWordForm("elem-1");
      expect(result).toBeUndefined();
    });
  });

  describe("getSpeakTextAllLangs", () => {
    test("returns empty string for nonexistent element", () => {
      stateService.setCurrentGrid({ id: "g1", gridElements: [] });
      expect(stateService.getSpeakTextAllLangs("nonexistent")).toBe("");
    });

    test("returns map of languages to speak text", () => {
      const mockElement = {
        id: "elem-1",
        label: { en: "Hello", de: "Hallo" },
        wordForms: [
          { lang: "en", value: "Hello" },
          { lang: "de", value: "Hallo" },
        ],
        pronunciation: { en: "hello", de: "hallo" },
      };
      stateService.setCurrentGrid({
        id: "grid-1",
        gridElements: [mockElement],
      });

      const result = stateService.getSpeakTextAllLangs("elem-1");
      expect(typeof result).toBe("object");
    });
  });

  describe("edge cases", () => {
    test("handles null grid gracefully for getDisplayText", () => {
      // Note: Can't actually set null grid without causing errors in resetWordForms
      // So we test with empty grid instead
      stateService.setCurrentGrid({ id: "g1", gridElements: [] });
      expect(stateService.getDisplayText("any")).toBe("");
      expect(stateService.getSpeakText("any", {})).toBe("");
    });

    test("handles undefined elementId gracefully", () => {
      stateService.setCurrentGrid({ id: "g1", gridElements: [] });
      expect(stateService.getDisplayText(undefined)).toBe("");
      expect(stateService.getDisplayText(null)).toBe("");
    });
  });
});
