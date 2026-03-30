jest.mock("../externals/objectmodel", () => {
  class MockModel {
    static definition = {};

    static defaults(defaults) {
      this._defaults = defaults;
    }

    static extend(extension) {
      return class extends MockModel {
        static definition = { ...this.definition, ...extension };
      };
    }

    constructor(properties = {}) {
      Object.assign(this, this.constructor._defaults || {}, properties);
    }
  }

  const ModelFactory = (definition) => {
    return class extends MockModel {
      static definition = definition;
    };
  };

  ModelFactory.Array = (itemType) => Array;

  return { Model: ModelFactory };
});

// Mock global log
global.log = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

jest.mock("../util/modelUtil", () => ({
  modelUtil: {
    setDefaults: jest.fn((properties = {}, base = {}, modelClass = {}) => {
      const copy = { ...properties };
      const needed = Object.keys(modelClass.definition || {});
      Object.keys(base || {}).forEach((key) => {
        if (needed.includes(key) && copy[key] === undefined) {
          copy[key] = base[key];
        }
      });
      return copy;
    }),
    generateId: jest.fn(() => "grid-element-1-100"),
  },
}));

jest.mock("../util/constants", () => ({
  constants: {
    MODEL_VERSION: '{"major": 6, "minor": 0, "patch": 0}',
  },
}));

jest.mock("./GridImage", () => ({
  GridImage: class {
    constructor(props = {}) {
      Object.assign(this, props);
    }
  },
}));

jest.mock("./GridActionSpeak", () => ({
  GridActionSpeak: class {
    static getModelName() {
      return "GridActionSpeak";
    }
    constructor() {
      this.modelName = "GridActionSpeak";
    }
  },
}));

jest.mock("./GridActionSpeakCustom", () => ({
  GridActionSpeakCustom: class {
    static getModelName() {
      return "GridActionSpeakCustom";
    }
  },
}));

jest.mock("./GridActionNavigate", () => ({
  GridActionNavigate: class {
    static getModelName() {
      return "GridActionNavigate";
    }
  },
}));

jest.mock("./GridActionPredict", () => ({
  GridActionPredict: class {
    static getModelName() {
      return "GridActionPredict";
    }
  },
}));

jest.mock("./GridActionCollectElement", () => ({
  GridActionCollectElement: class {
    static getModelName() {
      return "GridActionCollectElement";
    }
  },
}));

jest.mock("./GridActionChangeLang", () => ({
  GridActionChangeLang: class {
    static getModelName() {
      return "GridActionChangeLang";
    }
  },
}));

jest.mock("./GridActionOpenWebpage", () => ({
  GridActionOpenWebpage: class {
    static getModelName() {
      return "GridActionOpenWebpage";
    }
  },
}));

jest.mock("./GridActionAudio", () => ({
  GridActionAudio: class {
    static getModelName() {
      return "GridActionAudio";
    }
  },
}));

jest.mock("./GridActionHTTP", () => ({
  GridActionHTTP: class {
    static getModelName() {
      return "GridActionHTTP";
    }
  },
}));

jest.mock("./GridActionWordForm", () => ({
  GridActionWordForm: class {
    static getModelName() {
      return "GridActionWordForm";
    }
  },
}));

jest.mock("./GridActionSystem", () => ({
  GridActionSystem: class {
    static getModelName() {
      return "GridActionSystem";
    }
    static canBeTested = true;
  },
}));

jest.mock("./GridActionPredefined", () => ({
  GridActionPredefined: class {
    static getModelName() {
      return "GridActionPredefined";
    }
    static canBeTested = true;
  },
}));

jest.mock("./GridActionVocabLevelToggle", () => ({
  GridActionVocabLevelToggle: class {
    static getModelName() {
      return "GridActionVocabLevelToggle";
    }
  },
}));

import { GridElement } from "./GridElement";
import { constants } from "../util/constants";
import { modelUtil } from "../util/modelUtil";

describe("GridElement", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("getModelName returns correct name", () => {
    expect(GridElement.getModelName()).toBe("GridElement");
  });

  test("constructor applies defaults and auto-generates id", () => {
    const element = new GridElement({});
    expect(element.modelName).toBe("GridElement");
    expect(element.modelVersion).toBe(constants.MODEL_VERSION);
    expect(element.id).toBe("grid-element-1-100");
  });

  test("constructor keeps provided id", () => {
    const element = new GridElement({ id: "my-element-id" });
    expect(element.id).toBe("my-element-id");
  });

  test("constructor creates default action when not provided", () => {
    const element = new GridElement({});
    expect(element.actions).toBeDefined();
    expect(Array.isArray(element.actions)).toBe(true);
  });

  test("hasSetPosition returns true when x and y are set", () => {
    const element = new GridElement({ x: 0, y: 0 });
    expect(element.hasSetPosition()).toBe(true);
  });

  test("hasSetPosition returns false when x or y is null", () => {
    const element = new GridElement({ x: null, y: 0 });
    expect(element.hasSetPosition()).toBe(false);
  });

  test("hasSetPosition returns false when x or y is undefined", () => {
    const element = new GridElement({ x: 0, y: undefined });
    expect(element.hasSetPosition()).toBe(false);
  });

  test("getNavigateGridId returns grid id from navigate action", () => {
    const element = new GridElement({
      actions: [{ modelName: "GridActionNavigate", toGridId: "target-grid" }],
    });
    expect(element.getNavigateGridId()).toBe("target-grid");
  });

  test("getNavigateGridId returns null when no navigate action", () => {
    const element = new GridElement({
      actions: [{ modelName: "GridActionSpeak" }],
    });
    expect(element.getNavigateGridId()).toBe(null);
  });

  test("getActionTypes returns array of action classes", () => {
    const types = GridElement.getActionTypes();
    expect(Array.isArray(types)).toBe(true);
    expect(types.length).toBeGreaterThan(0);
  });

  test("getActionTypeModelNames returns array of model names", () => {
    const names = GridElement.getActionTypeModelNames();
    expect(Array.isArray(names)).toBe(true);
    expect(names).toContain("GridActionSpeak");
    expect(names).toContain("GridActionNavigate");
  });

  test("getActionClass returns constructor for valid modelName", () => {
    const ActionClass = GridElement.getActionClass("GridActionSpeak");
    expect(ActionClass).toBeDefined();
    expect(ActionClass.getModelName()).toBe("GridActionSpeak");
  });

  test("getActionInstance returns instance for valid modelName", () => {
    const instance = GridElement.getActionInstance("GridActionSpeak");
    expect(instance).toBeDefined();
  });

  test("canActionClassBeTested returns true for testable actions", () => {
    expect(GridElement.canActionClassBeTested("GridActionSystem")).toBe(true);
  });

  test("canActionClassBeTested returns true when action class not found", () => {
    expect(GridElement.canActionClassBeTested("NonExistent")).toBe(true);
  });

  test("static element type constants are defined", () => {
    expect(GridElement.ELEMENT_TYPE_NORMAL).toBe("ELEMENT_TYPE_NORMAL");
    expect(GridElement.ELEMENT_TYPE_COLLECT).toBe("ELEMENT_TYPE_COLLECT");
    expect(GridElement.ELEMENT_TYPE_PREDICTION).toBe("ELEMENT_TYPE_PREDICTION");
    expect(GridElement.ELEMENT_TYPE_LIVE).toBe("ELEMENT_TYPE_LIVE");
    expect(GridElement.ELEMENT_TYPE_DYNAMIC_GRID_PLACEHOLDER).toBe(
      "ELEMENT_TYPE_DYNAMIC_GRID_PLACEHOLDER",
    );
    expect(GridElement.ELEMENT_TYPE_UI_FILLER).toBe("ELEMENT_TYPE_UI_FILLER");
  });

  test("ID_PREFIX is defined", () => {
    expect(GridElement.ID_PREFIX).toBe("grid-element");
  });

  test("DEFAULTS contains expected properties", () => {
    expect(GridElement.DEFAULTS.modelName).toBe("GridElement");
    expect(GridElement.DEFAULTS.width).toBe(1);
    expect(GridElement.DEFAULTS.height).toBe(1);
    expect(GridElement.DEFAULTS.type).toBe("ELEMENT_TYPE_NORMAL");
  });

  test("copies values from elementToCopy through setDefaults", () => {
    const copy = {
      id: "copied-id",
      label: { de: "Kopie" },
      modelVersion: constants.MODEL_VERSION,
    };
    const element = new GridElement(
      { modelName: GridElement.getModelName() },
      copy,
    );
    expect(element.label).toEqual({ de: "Kopie" });
  });
});
