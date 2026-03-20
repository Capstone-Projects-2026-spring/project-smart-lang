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

import { NotificationConfig } from "./NotificationConfig";
import { constants } from "../util/constants";

describe("NotificationConfig", () => {
  test("returns correct model name", () => {
    expect(NotificationConfig.getModelName()).toBe("NotificationConfig");
  });

  test("applies defaults", () => {
    const cfg = new NotificationConfig({});
    expect(cfg.modelName).toBe("NotificationConfig");
    expect(cfg.modelVersion).toBe(constants.MODEL_VERSION);
    expect(cfg.backupNotifyIntervalDays).toBe(7);
    expect(cfg.lastBackupNotification).toBe(0);
    expect(cfg.lastBackup).toBe(0);
  });

  test("allows overrides", () => {
    const cfg = new NotificationConfig({
      backupNotifyIntervalDays: 14,
      lastBackup: 10,
    });
    expect(cfg.backupNotifyIntervalDays).toBe(14);
    expect(cfg.lastBackup).toBe(10);
    expect(cfg.lastBackupNotification).toBe(0);
  });
});
