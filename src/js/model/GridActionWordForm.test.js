jest.mock("../externals/objectmodel", () => {
  const Model = (definition) => {
    return class {
      static definition = definition;

      static defaults(defaults) {
        this._defaults = defaults;
      }

      constructor(properties = {}) {
        Object.assign(this, this.constructor._defaults || {}, properties);
      }
    };
  };
  Model.Array = () => Array;
  return { Model };
});

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
    generateId: jest.fn(() => "grid-action-word-form-1-100"),
  },
}));

import { GridActionWordForm } from "./GridActionWordForm";
import { constants } from "../util/constants";

describe("GridActionWordForm", () => {
  test("exposes model name and mode constants", () => {
    expect(GridActionWordForm.getModelName()).toBe("GridActionWordForm");
    expect(GridActionWordForm.WORDFORM_MODE_CHANGE_ELEMENTS).toBe(
      "WORDFORM_MODE_CHANGE_ELEMENTS",
    );
    expect(GridActionWordForm.WORDFORM_MODE_CHANGE_BAR).toBe(
      "WORDFORM_MODE_CHANGE_BAR",
    );
    expect(GridActionWordForm.WORDFORM_MODE_CHANGE_EVERYWHERE).toBe(
      "WORDFORM_MODE_CHANGE_EVERYWHERE",
    );
    expect(GridActionWordForm.WORDFORM_MODE_NEXT_FORM).toBe(
      "WORDFORM_MODE_NEXT_FORM",
    );
    expect(GridActionWordForm.WORDFORM_MODE_RESET_FORMS).toBe(
      "WORDFORM_MODE_RESET_FORMS",
    );
    expect(GridActionWordForm.MODES).toHaveLength(5);
    expect(GridActionWordForm.MODES_SECONDARY).toHaveLength(3);
  });

  test("applies defaults and generated id", () => {
    const action = new GridActionWordForm({});
    expect(action.id).toBe("grid-action-word-form-1-100");
    expect(action.modelName).toBe("GridActionWordForm");
    expect(action.modelVersion).toBe(constants.MODEL_VERSION);
    expect(action.type).toBe(GridActionWordForm.WORDFORM_MODE_CHANGE_ELEMENTS);
    expect(action.tags).toEqual([]);
  });

  test("supports custom values", () => {
    const action = new GridActionWordForm({
      id: "w-1",
      type: GridActionWordForm.WORDFORM_MODE_NEXT_FORM,
      tags: ["a"],
      toggle: true,
    });
    expect(action.id).toBe("w-1");
    expect(action.type).toBe(GridActionWordForm.WORDFORM_MODE_NEXT_FORM);
    expect(action.tags).toEqual(["a"]);
    expect(action.toggle).toBe(true);
  });
});
