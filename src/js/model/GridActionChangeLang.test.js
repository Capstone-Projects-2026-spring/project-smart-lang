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
    generateId: jest.fn(() => "grid-action-change-lang-1-100"),
  },
}));

import { GridActionChangeLang } from "./GridActionChangeLang";

describe("GridActionChangeLang", () => {
  test("exposes model name and constants", () => {
    expect(GridActionChangeLang.getModelName()).toBe("GridActionChangeLang");
    expect(GridActionChangeLang.LAST_LANG).toBe("LAST_LANG");
  });

  test("applies defaults and generated id", () => {
    const action = new GridActionChangeLang({});
    expect(action.id).toBe("grid-action-change-lang-1-100");
    expect(action.modelName).toBe("GridActionChangeLang");
  });

  test("supports custom values", () => {
    const action = new GridActionChangeLang({
      id: "c-1",
      language: "en",
      voice: "v1",
    });
    expect(action.id).toBe("c-1");
    expect(action.language).toBe("en");
    expect(action.voice).toBe("v1");
  });
});
