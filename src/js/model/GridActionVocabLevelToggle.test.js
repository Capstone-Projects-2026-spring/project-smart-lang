jest.mock("../externals/objectmodel", () => ({
  Model: (definition) => {
    return class {
      static definition = definition;

      static defaults(defaults) {
        this._defaults = defaults;
      }

      constructor(properties = {}) {
        Object.assign(this, this.constructor._defaults || {}, properties);
      }
    };
  },
}));

jest.mock("../util/modelUtil", () => ({
  modelUtil: {
    setDefaults: jest.fn((props = {}, base = {}, modelClass = {}) => {
      const copy = { ...props };
      const needed = Object.keys(modelClass.definition || {});
      Object.keys(base || {}).forEach((key) => {
        if (needed.includes(key) && copy[key] === undefined) {
          copy[key] = base[key];
        }
      });
      return copy;
    }),
    generateId: jest.fn(() => "grid-action-vocab-level-toggle-1-100"),
  },
}));

import { GridActionVocabLevelToggle } from "./GridActionVocabLevelToggle";
import { constants } from "../util/constants";

describe("GridActionVocabLevelToggle", () => {
  test("exposes model name, modes and flags", () => {
    expect(GridActionVocabLevelToggle.getModelName()).toBe(
      "GridActionVocabLevelToggle",
    );
    expect(GridActionVocabLevelToggle.canBeTested).toBe(false);
    expect(GridActionVocabLevelToggle.modes.TOGGLE_TO_FULL).toBe(
      "TOGGLE_TO_FULL",
    );
    expect(GridActionVocabLevelToggle.getModes()).toEqual(["TOGGLE_TO_FULL"]);
  });

  test("applies defaults and generated id", () => {
    const action = new GridActionVocabLevelToggle({});
    expect(action.id).toBe("grid-action-vocab-level-toggle-1-100");
    expect(action.modelName).toBe("GridActionVocabLevelToggle");
    expect(action.modelVersion).toBe(constants.MODEL_VERSION);
    expect(action.mode).toBe(GridActionVocabLevelToggle.modes.TOGGLE_TO_FULL);
  });

  test("supports custom id and mode", () => {
    const action = new GridActionVocabLevelToggle({
      id: "v-1",
      mode: GridActionVocabLevelToggle.modes.TOGGLE_TO_FULL,
    });
    expect(action.id).toBe("v-1");
    expect(action.mode).toBe("TOGGLE_TO_FULL");
  });
});
