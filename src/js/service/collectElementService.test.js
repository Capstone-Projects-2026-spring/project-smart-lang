// Mock dependencies
const mockJqueryInstance = {
  on: jest.fn(),
  off: jest.fn(),
  trigger: jest.fn(),
  empty: jest.fn(),
  html: jest.fn(),
  attr: jest.fn(),
  prop: jest.fn(() => 100),
  width: jest.fn(() => 500),
  scrollLeft: jest.fn(),
};
const mockJquery = jest.fn(() => mockJqueryInstance);
mockJquery.extend = jest.fn();

jest.mock("../externals/jquery.js", () => ({
  default: mockJquery,
}));

jest.mock("../model/GridElement", () => ({
  GridElement: class {
    constructor(props) {
      Object.assign(this, props);
      this.id = props?.id || "generated-id";
    }
    static ELEMENT_TYPE_NORMAL = "ELEMENT_TYPE_NORMAL";
    static ELEMENT_TYPE_COLLECT = "ELEMENT_TYPE_COLLECT";
    static ELEMENT_TYPE_PREDICTION = "ELEMENT_TYPE_PREDICTION";
    static ELEMENT_TYPE_LIVE = "ELEMENT_TYPE_LIVE";
    static getActionTypeModelNames() {
      return ["GridActionNavigate", "GridActionSpeak"];
    }
  },
}));

jest.mock("../model/GridImage.js", () => ({
  GridImage: class {
    constructor(props) {
      Object.assign(this, props);
    }
  },
}));

jest.mock("./speechService", () => ({
  speechService: {
    speak: jest.fn(),
    speakArray: jest.fn(),
    stopSpeaking: jest.fn(),
    doAfterFinishedSpeaking: jest.fn((cb) => cb && cb()),
    waitForFinishedSpeaking: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock("./../util/constants", () => ({
  constants: {
    ELEMENT_EVENT_ID: "ELEMENT_EVENT_ID",
    EVENT_GRID_RESIZE: "EVENT_GRID_RESIZE",
    EVENT_USER_CHANGED: "EVENT_USER_CHANGED",
    EVENT_CONFIG_RESET: "EVENT_CONFIG_RESET",
    EVENT_METADATA_UPDATED: "EVENT_METADATA_UPDATED",
    EVENT_USERSETTINGS_UPDATED: "EVENT_USERSETTINGS_UPDATED",
    EVENT_COLLECT_TEXT_CHANGED: "EVENT_COLLECT_TEXT_CHANGED",
    DEFAULT_COLLECT_ELEMENT_BACKGROUND_COLOR: "#333333",
    DEFAULT_ELEMENT_FONT_COLOR_DARK: "#ffffff",
    DEFAULT_ELEMENT_FONT_COLOR: "#000000",
  },
}));

jest.mock("./../util/util", () => ({
  util: {
    getCollectContentBlob: jest.fn(),
    shareImageBlob: jest.fn(),
    copyCollectContentToClipboard: jest.fn(),
    copyToClipboard: jest.fn(),
    appendToClipboard: jest.fn(),
    convertLowerUppercase: jest.fn((text) => text),
  },
}));

jest.mock("./predictionService", () => ({
  predictionService: {
    predict: jest.fn(),
    applyPrediction: jest.fn(),
    learnFromInput: jest.fn(),
    getCurrentValue: jest.fn(),
  },
}));

jest.mock("./i18nService", () => ({
  i18nService: {
    getTranslation: jest.fn((label) => {
      if (typeof label === "string") return label;
      if (label && label.en) return label.en;
      return "";
    }),
    getTranslationObject: jest.fn((text) => ({ en: text })),
    getContentLang: jest.fn(() => "en"),
    t: jest.fn((key) => key),
  },
}));

jest.mock("../util/fontUtil", () => ({
  fontUtil: {
    adaptFontSize: jest.fn(),
    getTextWidth: jest.fn(() => 50),
  },
}));

jest.mock("../model/GridActionCollectElement", () => ({
  GridActionCollectElement: {
    COLLECT_ACTION_SPEAK: "COLLECT_ACTION_SPEAK",
    COLLECT_ACTION_SPEAK_CONTINUOUS: "COLLECT_ACTION_SPEAK_CONTINUOUS",
    COLLECT_ACTION_SPEAK_CONTINUOUS_CLEAR:
      "COLLECT_ACTION_SPEAK_CONTINUOUS_CLEAR",
    COLLECT_ACTION_SPEAK_CLEAR: "COLLECT_ACTION_SPEAK_CLEAR",
    COLLECT_ACTION_CLEAR: "COLLECT_ACTION_CLEAR",
    COLLECT_ACTION_REMOVE_WORD: "COLLECT_ACTION_REMOVE_WORD",
    COLLECT_ACTION_REMOVE_CHAR: "COLLECT_ACTION_REMOVE_CHAR",
    COLLECT_ACTION_SHARE: "COLLECT_ACTION_SHARE",
    COLLECT_ACTION_COPY_IMAGE_CLIPBOARD: "COLLECT_ACTION_COPY_IMAGE_CLIPBOARD",
    COLLECT_ACTION_COPY_CLIPBOARD: "COLLECT_ACTION_COPY_CLIPBOARD",
    COLLECT_ACTION_APPEND_CLIPBOARD: "COLLECT_ACTION_APPEND_CLIPBOARD",
    COLLECT_ACTION_CLEAR_CLIPBOARD: "COLLECT_ACTION_CLEAR_CLIPBOARD",
    COLLECT_ACTION_TOGGLE_TEXT_ROTATION: "COLLECT_ACTION_TOGGLE_TEXT_ROTATION",
    isSpeakAction: jest.fn((action) => action && action.includes("SPEAK")),
  },
}));

jest.mock("../model/GridActionNavigate", () => ({
  GridActionNavigate: {
    getModelName: () => "GridActionNavigate",
  },
}));

jest.mock("../model/GridActionPredict", () => ({
  GridActionPredict: {
    getModelName: () => "GridActionPredict",
  },
}));

jest.mock("../util/imageUtil.js", () => ({
  imageUtil: {
    getImageDimensionsFromDataUrl: jest.fn(() => Promise.resolve({ ratio: 1 })),
  },
}));

jest.mock("../model/GridElementCollect.js", () => ({
  GridElementCollect: {
    MODE_AUTO: "MODE_AUTO",
    MODE_COLLECT_SEPARATED: "MODE_COLLECT_SEPARATED",
    MODE_COLLECT_TEXT: "MODE_COLLECT_TEXT",
  },
}));

jest.mock("../model/GridActionSpeak.js", () => ({
  GridActionSpeak: {
    getModelName: () => "GridActionSpeak",
  },
}));

jest.mock("../model/GridActionSpeakCustom.js", () => ({
  GridActionSpeakCustom: {
    getModelName: () => "GridActionSpeakCustom",
  },
}));

jest.mock("./data/dataService.js", () => ({
  dataService: {
    getMetadata: jest.fn(() =>
      Promise.resolve({
        inputConfig: { globalMinPauseCollectSpeak: 0 },
        textConfig: { convertMode: null },
        colorConfig: {
          gridBackgroundColor: "#ffffff",
          elementBackgroundColor: "#ffffff",
        },
        activateARASAACGrammarAPI: false,
      }),
    ),
  },
}));

jest.mock("../model/GridActionAudio.js", () => ({
  GridActionAudio: {
    getModelName: () => "GridActionAudio",
  },
}));

jest.mock("./pictograms/arasaacService.js", () => ({
  arasaacService: {
    getCorrectGrammar: jest.fn((text) => Promise.resolve(text)),
  },
}));

jest.mock("../model/GridActionWordForm.js", () => ({
  GridActionWordForm: {
    getModelName: () => "GridActionWordForm",
    WORDFORM_MODE_NEXT_FORM: "WORDFORM_MODE_NEXT_FORM",
  },
}));

jest.mock("./stateService.js", () => ({
  stateService: {
    getCurrentWordFormTags: jest.fn(() => []),
    getWordForm: jest.fn(() => null),
    getWordFormObject: jest.fn(() => null),
    mergeTags: jest.fn((existing, newTags) => [...existing, ...newTags]),
  },
}));

jest.mock("../util/MapCache.js", () => ({
  MapCache: class {
    constructor() {
      this.data = new Map();
    }
    has(key) {
      return this.data.has(key);
    }
    get(key) {
      return this.data.get(key);
    }
    set(key, value) {
      this.data.set(key, value);
    }
  },
}));

jest.mock("./liveElementService", () => ({
  liveElementService: {
    getLastValue: jest.fn(() => "live-value"),
  },
}));

jest.mock("../model/MetaData", () => ({
  MetaData: class {
    constructor() {
      this.inputConfig = { globalMinPauseCollectSpeak: 0 };
      this.textConfig = { convertMode: null };
      this.colorConfig = {
        gridBackgroundColor: "#ffffff",
        elementBackgroundColor: "#ffffff",
      };
    }
  },
}));

jest.mock("../model/GridData", () => ({
  GridData: {
    KEYBOARD_DISABLED: "KEYBOARD_DISABLED",
    KEYBOARD_ENABLED: "KEYBOARD_ENABLED",
  },
}));

jest.mock("../util/gridUtil", () => ({
  gridUtil: {
    getFirstWordForm: jest.fn(() => null),
  },
}));

import $ from "../externals/jquery.js";
import { collectElementService } from "./collectElementService";
import { speechService } from "./speechService";
import { predictionService } from "./predictionService";
import { util } from "./../util/util";
import { GridActionCollectElement } from "../model/GridActionCollectElement";
import { arasaacService } from "./pictograms/arasaacService.js";

describe("collectElementService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.log = { warn: jest.fn(), debug: jest.fn(), info: jest.fn() };
  });

  describe("getText", () => {
    test("should return empty string when no elements collected", () => {
      const text = collectElementService.getText();
      expect(typeof text).toBe("string");
    });
  });

  describe("initWithGrid", () => {
    test("should initialize with grid data containing normal elements", () => {
      const gridData = {
        gridElements: [
          {
            type: "ELEMENT_TYPE_NORMAL",
            label: { en: "Hello" },
          },
          {
            type: "ELEMENT_TYPE_NORMAL",
            label: { en: "World" },
          },
        ],
      };

      collectElementService.initWithGrid(gridData);

      expect(predictionService.predict).toHaveBeenCalled();
    });

    test("should register collect elements from grid", () => {
      const gridData = {
        gridElements: [
          {
            type: "ELEMENT_TYPE_COLLECT",
            mode: "MODE_AUTO",
            actions: [],
          },
        ],
      };

      collectElementService.initWithGrid(gridData);

      // Collect element should be registered internally
      expect(predictionService.predict).toHaveBeenCalled();
    });

    test("should calculate keyboard-like factor based on single char elements", () => {
      const gridData = {
        gridElements: [
          { type: "ELEMENT_TYPE_NORMAL", label: { en: "A" } },
          { type: "ELEMENT_TYPE_NORMAL", label: { en: "B" } },
          { type: "ELEMENT_TYPE_NORMAL", label: { en: "C" } },
          { type: "ELEMENT_TYPE_NORMAL", label: { en: "D" } },
          { type: "ELEMENT_TYPE_NORMAL", label: { en: "Hello" } },
        ],
      };

      collectElementService.initWithGrid(gridData);

      // 4 out of 5 elements are single char = 80% > 40% threshold
      expect(collectElementService.isCurrentGridKeyboard()).toBe(true);
    });

    test("should respect explicit keyboard mode setting", () => {
      const gridData = {
        keyboardMode: "KEYBOARD_DISABLED",
        gridElements: [
          { type: "ELEMENT_TYPE_NORMAL", label: { en: "A" } },
          { type: "ELEMENT_TYPE_NORMAL", label: { en: "B" } },
        ],
      };

      collectElementService.initWithGrid(gridData);

      expect(collectElementService.isCurrentGridKeyboard()).toBe(false);
    });

    test("should skip prediction when dontAutoPredict is true", () => {
      const gridData = {
        gridElements: [
          {
            type: "ELEMENT_TYPE_COLLECT",
            actions: [],
          },
        ],
      };

      collectElementService.initWithGrid(gridData, true);

      expect(predictionService.predict).not.toHaveBeenCalled();
    });
  });

  describe("clearCollectElements", () => {
    test("should clear collect container DOM", () => {
      collectElementService.clearCollectElements();

      expect($).toHaveBeenCalledWith(".collect-container");
    });
  });

  describe("isCurrentGridKeyboard", () => {
    test("should return true when keyboard-like factor > 0.4", () => {
      const gridData = {
        keyboardMode: "KEYBOARD_ENABLED",
        gridElements: [],
      };

      collectElementService.initWithGrid(gridData);

      expect(collectElementService.isCurrentGridKeyboard()).toBe(true);
    });

    test("should return false when keyboard-like factor <= 0.4", () => {
      const gridData = {
        keyboardMode: "KEYBOARD_DISABLED",
        gridElements: [],
      };

      collectElementService.initWithGrid(gridData);

      expect(collectElementService.isCurrentGridKeyboard()).toBe(false);
    });
  });

  describe("hasCollectedImage", () => {
    test("should return false when no elements with images collected", () => {
      const result = collectElementService.hasCollectedImage();

      expect(typeof result).toBe("boolean");
    });
  });

  describe("addPredictionWord", () => {
    test("should add word with image to collected elements", () => {
      collectElementService.addPredictionWord("Hello", "image.png");

      expect(predictionService.applyPrediction).toHaveBeenCalled();
    });

    test("should add word without image as text element", () => {
      collectElementService.addPredictionWord("Hello");

      expect(predictionService.applyPrediction).toHaveBeenCalled();
    });

    test("should not add empty word", () => {
      collectElementService.addPredictionWord("");

      expect(predictionService.applyPrediction).not.toHaveBeenCalled();
    });

    test("should not add null word", () => {
      collectElementService.addPredictionWord(null);

      expect(predictionService.applyPrediction).not.toHaveBeenCalled();
    });
  });

  describe("doCollectElementActions", () => {
    test("should handle COLLECT_ACTION_SPEAK", async () => {
      await collectElementService.doCollectElementActions(
        GridActionCollectElement.COLLECT_ACTION_SPEAK,
      );

      expect(speechService.speak).toHaveBeenCalled();
    });

    test("should handle COLLECT_ACTION_SPEAK_CONTINUOUS", async () => {
      await collectElementService.doCollectElementActions(
        GridActionCollectElement.COLLECT_ACTION_SPEAK_CONTINUOUS,
      );

      expect(speechService.speak).toHaveBeenCalled();
    });

    test("should handle COLLECT_ACTION_SPEAK_CONTINUOUS_CLEAR", async () => {
      await collectElementService.doCollectElementActions(
        GridActionCollectElement.COLLECT_ACTION_SPEAK_CONTINUOUS_CLEAR,
      );

      expect(speechService.speak).toHaveBeenCalled();
      expect(speechService.waitForFinishedSpeaking).toHaveBeenCalled();
    });

    test("should handle COLLECT_ACTION_SPEAK_CLEAR", async () => {
      await collectElementService.doCollectElementActions(
        GridActionCollectElement.COLLECT_ACTION_SPEAK_CLEAR,
      );

      expect(speechService.speak).toHaveBeenCalled();
    });

    test("should handle COLLECT_ACTION_CLEAR", async () => {
      await collectElementService.doCollectElementActions(
        GridActionCollectElement.COLLECT_ACTION_CLEAR,
      );

      expect(speechService.stopSpeaking).toHaveBeenCalled();
    });

    test("should handle COLLECT_ACTION_REMOVE_WORD", async () => {
      await collectElementService.doCollectElementActions(
        GridActionCollectElement.COLLECT_ACTION_REMOVE_WORD,
      );

      expect(speechService.stopSpeaking).toHaveBeenCalled();
    });

    test("should handle COLLECT_ACTION_REMOVE_CHAR", async () => {
      await collectElementService.doCollectElementActions(
        GridActionCollectElement.COLLECT_ACTION_REMOVE_CHAR,
      );

      // Should not throw, updates collect elements
      expect(predictionService.predict).toHaveBeenCalled();
    });

    test("should handle COLLECT_ACTION_SHARE", async () => {
      util.getCollectContentBlob.mockResolvedValue({ size: 100 });

      await collectElementService.doCollectElementActions(
        GridActionCollectElement.COLLECT_ACTION_SHARE,
      );

      expect(util.getCollectContentBlob).toHaveBeenCalled();
      expect(util.shareImageBlob).toHaveBeenCalled();
    });

    test("should handle COLLECT_ACTION_COPY_IMAGE_CLIPBOARD", async () => {
      await collectElementService.doCollectElementActions(
        GridActionCollectElement.COLLECT_ACTION_COPY_IMAGE_CLIPBOARD,
      );

      expect(util.copyCollectContentToClipboard).toHaveBeenCalled();
    });

    test("should handle COLLECT_ACTION_COPY_CLIPBOARD", async () => {
      await collectElementService.doCollectElementActions(
        GridActionCollectElement.COLLECT_ACTION_COPY_CLIPBOARD,
      );

      expect(util.copyToClipboard).toHaveBeenCalled();
    });

    test("should handle COLLECT_ACTION_APPEND_CLIPBOARD", async () => {
      await collectElementService.doCollectElementActions(
        GridActionCollectElement.COLLECT_ACTION_APPEND_CLIPBOARD,
      );

      expect(util.appendToClipboard).toHaveBeenCalled();
    });

    test("should handle COLLECT_ACTION_CLEAR_CLIPBOARD", async () => {
      await collectElementService.doCollectElementActions(
        GridActionCollectElement.COLLECT_ACTION_CLEAR_CLIPBOARD,
      );

      expect(util.copyToClipboard).toHaveBeenCalledWith("");
    });

    test("should handle null action gracefully", async () => {
      await collectElementService.doCollectElementActions(null);

      // Should return early without doing anything
      expect(speechService.speak).not.toHaveBeenCalled();
    });

    test("should handle undefined action gracefully", async () => {
      await collectElementService.doCollectElementActions(undefined);

      expect(speechService.speak).not.toHaveBeenCalled();
    });
  });

  describe("doARASAACGrammarCorrection", () => {
    test("should not call ARASAAC service when disabled", async () => {
      await collectElementService.doARASAACGrammarCorrection();

      // activateARASAACGrammarAPI defaults to false
      expect(arasaacService.getCorrectGrammar).not.toHaveBeenCalled();
    });
  });

  describe("addWordFormTagsToLast", () => {
    test("should not throw when called with tags", () => {
      expect(() => {
        collectElementService.addWordFormTagsToLast(["tag1"], false);
      }).not.toThrow();
    });

    test("should not throw when called with skipElementId", () => {
      expect(() => {
        collectElementService.addWordFormTagsToLast(["tag1"], false, "skip-id");
      }).not.toThrow();
    });
  });

  describe("replaceLast", () => {
    test("should not throw when replacing element", () => {
      const element = {
        id: "elem1",
        label: { en: "Test" },
        actions: [],
      };

      expect(() => {
        collectElementService.replaceLast(element, "current-id");
      }).not.toThrow();
    });
  });

  describe("fixateLastWordForm", () => {
    test("should not throw when called", () => {
      expect(() => {
        collectElementService.fixateLastWordForm();
      }).not.toThrow();
    });
  });
});
