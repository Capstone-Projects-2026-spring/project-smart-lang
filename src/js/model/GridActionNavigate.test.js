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
    generateId: jest.fn(() => "grid-action-navigate-1-100"),
  },
}));

import { GridActionNavigate } from "./GridActionNavigate";
import { constants } from "../util/constants";

describe("GridActionNavigate", () => {
  test("exposes model name, flags and nav type constants", () => {
    expect(GridActionNavigate.getModelName()).toBe("GridActionNavigate");
    expect(GridActionNavigate.canBeTested).toBe(false);
    expect(GridActionNavigate.NAV_TYPES.TO_GRID).toBe("navigateToGrid");
    expect(GridActionNavigate.NAV_TYPES.TO_HOME).toBe("navigateToHomeGrid");
    expect(GridActionNavigate.NAV_TYPES.TO_LAST).toBe(
      "navigateToLastOpenedGrid",
    );
    expect(GridActionNavigate.NAV_TYPES.OPEN_SEARCH).toBe("navigateToSearch");
  });

  test("applies defaults and generated id", () => {
    const action = new GridActionNavigate({});
    expect(action.id).toBe("grid-action-navigate-1-100");
    expect(action.modelName).toBe("GridActionNavigate");
    expect(action.modelVersion).toBe(constants.MODEL_VERSION);
    expect(action.navType).toBe(GridActionNavigate.NAV_TYPES.TO_GRID);
  });

  test("supports custom values", () => {
    const action = new GridActionNavigate({
      id: "n-1",
      navType: GridActionNavigate.NAV_TYPES.TO_HOME,
      toGridId: "g2",
    });
    expect(action.id).toBe("n-1");
    expect(action.navType).toBe(GridActionNavigate.NAV_TYPES.TO_HOME);
    expect(action.toGridId).toBe("g2");
  });
});
