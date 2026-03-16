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
    generateId: jest.fn(() => "GridActionSystem-1-100"),
  },
}));

import { GridActionSystem } from "./GridActionSystem";
import { constants } from "../util/constants";

describe("GridActionSystem", () => {
  test("exposes model name and actions map", () => {
    expect(GridActionSystem.getModelName()).toBe("GridActionSystem");
    expect(GridActionSystem.canBeTested).toBe(false);
    expect(GridActionSystem.actions.SYS_VOLUME_UP).toBe("SYS_VOLUME_UP");
    expect(GridActionSystem.actions.SYS_VOLUME_DOWN).toBe("SYS_VOLUME_DOWN");
    expect(GridActionSystem.actions.SYS_VOLUME_TOGGLE_MUTE).toBe(
      "SYS_VOLUME_TOGGLE_MUTE",
    );
    expect(GridActionSystem.actions.SYS_ENTER_FULLSCREEN).toBe(
      "SYS_ENTER_FULLSCREEN",
    );
    expect(GridActionSystem.actions.SYS_LEAVE_FULLSCREEN).toBe(
      "SYS_LEAVE_FULLSCREEN",
    );
    expect(GridActionSystem.actions.SYS_UPDATE_LIVE_ELEMENTS).toBe(
      "SYS_UPDATE_LIVE_ELEMENTS",
    );
  });

  test("applies defaults and generated id", () => {
    const action = new GridActionSystem({});
    expect(action.id).toBe("GridActionSystem-1-100");
    expect(action.modelName).toBe("GridActionSystem");
    expect(action.modelVersion).toBe(constants.MODEL_VERSION);
    expect(action.action).toBe(GridActionSystem.actions.SYS_VOLUME_UP);
    expect(action.actionValue).toBe(10);
  });

  test("supports custom values", () => {
    const action = new GridActionSystem({
      id: "sys-1",
      action: GridActionSystem.actions.SYS_VOLUME_DOWN,
      actionValue: 4,
    });
    expect(action.id).toBe("sys-1");
    expect(action.action).toBe(GridActionSystem.actions.SYS_VOLUME_DOWN);
    expect(action.actionValue).toBe(4);
  });
});
