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
    generateId: jest.fn(() => "input-config-1-100"),
  },
}));

import { InputConfig } from "./InputConfig";
import { InputEventKey } from "./InputEventKey";
import { constants } from "../util/constants";

describe("InputConfig", () => {
  beforeEach(() => {
    global.log = { warn: jest.fn() };
  });

  test("constants and helper methods", () => {
    expect(InputConfig.UP).toBe("UP");
    expect(InputConfig.DOWN).toBe("DOWN");
    expect(InputConfig.LEFT).toBe("LEFT");
    expect(InputConfig.RIGHT).toBe("RIGHT");
    expect(InputConfig.SELECT).toBe("SELECT");
    expect(InputConfig.getNumConst(4)).toBe("NUM4");
  });

  test("applies defaults and generated id", () => {
    const cfg = new InputConfig({});
    expect(cfg.id).toBe("input-config-1-100");
    expect(cfg.modelName).toBe("InputConfig");
    expect(cfg.modelVersion).toBe(constants.MODEL_VERSION);
    expect(cfg.globalReadActiveRate).toBe(1);
    expect(cfg.mouseclickEnabled).toBe(true);
    expect(cfg.dirWrapAround).toBe(true);
    expect(cfg.dirInputs.length).toBe(5);
  });

  test("getInputEventTypes and getInputEventInstance behavior", () => {
    expect(InputConfig.getInputEventTypes()).toEqual([InputEventKey]);
    const instance = InputConfig.getInputEventInstance("InputEventKey", {
      label: "X",
    });
    expect(instance).toBeInstanceOf(InputEventKey);

    const missing = InputConfig.getInputEventInstance("UnknownType", {});
    expect(missing).toBeUndefined();
    expect(global.log.warn).toHaveBeenCalled();
  });
});
