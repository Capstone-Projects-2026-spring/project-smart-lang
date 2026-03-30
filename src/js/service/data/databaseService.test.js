// Mocks first, then imports
const mockTrigger = jest.fn();
const mockJquery = jest.fn(() => ({
  trigger: mockTrigger,
}));
mockJquery.trigger = mockTrigger;

jest.mock("../../externals/jquery.js", () => ({
  default: mockJquery,
}));

jest.mock("../urlParamService", () => ({
  urlParamService: {
    shouldResetDatabase: jest.fn(() => false),
  },
}));

jest.mock("../../model/MetaData", () => ({
  MetaData: jest.fn().mockImplementation(() => ({
    id: "metadata-test-id",
    modelName: "MetaData",
  })),
}));
// Add static method to MetaData
const MockMetaData = require("../../model/MetaData").MetaData;
MockMetaData.getIdPrefix = jest.fn(() => "metadata");

jest.mock("./encryptionService", () => ({
  encryptionService: {
    setEncryptionProperties: jest.fn(),
    resetEncryptionProperties: jest.fn(),
  },
}));

jest.mock("./pouchDbService", () => ({
  pouchDbService: {
    getOpenedDatabaseName: jest.fn(() => null),
    isSyncEnabled: jest.fn(() => false),
    initDatabase: jest.fn(() => Promise.resolve()),
    createDatabase: jest.fn(() => Promise.resolve()),
    deleteDatabase: jest.fn(() => Promise.resolve()),
    closeCurrentDatabase: jest.fn(() => Promise.resolve()),
    resetDatabase: jest.fn(() => Promise.resolve()),
    all: jest.fn(() => Promise.resolve([])),
    allArray: jest.fn(() => Promise.resolve([])),
    save: jest.fn(() => Promise.resolve()),
    remove: jest.fn(() => Promise.resolve()),
    bulkDocs: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock("./convertServiceDb", () => ({
  convertServiceDb: {
    convertDatabaseToLiveObjects: jest.fn((data) => data),
    convertLiveToDatabaseObjects: jest.fn((data) => {
      if (Array.isArray(data)) {
        return data.map((item) => ({
          ...item,
          _id: item.id,
          encryptedDataBase64: "encrypted",
        }));
      }
      return {
        ...data,
        _id: data.id,
        encryptedDataBase64: "encrypted",
      };
    }),
  },
}));

jest.mock("./localStorageService", () => ({
  localStorageService: {
    getSavedLocalUsers: jest.fn(() => []),
    setUserModelVersion: jest.fn(),
  },
}));

jest.mock("../../util/util", () => ({
  util: {
    splitInChunks: jest.fn((arr, size) => {
      const chunks = [];
      for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
      }
      return chunks.length ? chunks : [arr];
    }),
  },
}));

jest.mock("../../util/constants", () => ({
  constants: {
    EVENT_USER_CHANGING: "EVENT_USER_CHANGING",
    EVENT_USER_CHANGED: "EVENT_USER_CHANGED",
  },
}));

// Mock global log
global.log = {
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  debug: jest.fn(),
};

import { databaseService } from "./databaseService";
import { pouchDbService } from "./pouchDbService";
import { encryptionService } from "./encryptionService";
import { convertServiceDb } from "./convertServiceDb";
import { localStorageService } from "./localStorageService";
import { urlParamService } from "../urlParamService";
import { MetaData } from "../../model/MetaData";
import $ from "../../externals/jquery.js";

// Mock object type for testing
class MockObjectType {
  constructor(props, existing) {
    Object.assign(this, existing || {}, props);
  }
  static getIdPrefix() {
    return "mock";
  }
  static getModelName() {
    return "MockObject";
  }
}

describe("databaseService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset pouchDbService mocks to default behavior
    pouchDbService.getOpenedDatabaseName.mockReturnValue(null);
    pouchDbService.isSyncEnabled.mockReturnValue(false);
    pouchDbService.initDatabase.mockReturnValue(Promise.resolve());
    pouchDbService.createDatabase.mockReturnValue(Promise.resolve());
    pouchDbService.all.mockReturnValue(Promise.resolve([]));
    pouchDbService.allArray.mockReturnValue(Promise.resolve([]));
    pouchDbService.save.mockReturnValue(Promise.resolve());
    pouchDbService.remove.mockReturnValue(Promise.resolve());
    pouchDbService.bulkDocs.mockReturnValue(Promise.resolve());
  });

  describe("getObject", () => {
    test("returns null when database not initialized", async () => {
      const result = await databaseService.getObject(MockObjectType, "test-id");
      expect(result).toBeNull();
    });

    test("queries and returns objects after initialization", async () => {
      // Initialize the database first
      pouchDbService.allArray.mockResolvedValueOnce([{ id: "metadata-1" }]);
      await databaseService.initForUser("testUser", "hashedPw", null, false);

      const mockData = [
        { id: "mock-1", name: "Object 1" },
        { id: "mock-2", name: "Object 2" },
      ];
      pouchDbService.all.mockResolvedValueOnce(mockData);
      convertServiceDb.convertDatabaseToLiveObjects.mockReturnValueOnce(
        mockData,
      );

      const result = await databaseService.getObject(MockObjectType);

      expect(pouchDbService.all).toHaveBeenCalledWith("mock", undefined);
      expect(result).toEqual(mockData);
    });

    test("queries single object by id", async () => {
      pouchDbService.allArray.mockResolvedValueOnce([{ id: "metadata-1" }]);
      await databaseService.initForUser("testUser", "hashedPw", null, false);

      const mockData = { id: "mock-123", name: "Test Object" };
      pouchDbService.all.mockResolvedValueOnce(mockData);
      convertServiceDb.convertDatabaseToLiveObjects.mockReturnValueOnce(
        mockData,
      );

      const result = await databaseService.getObject(
        MockObjectType,
        "mock-123",
      );

      expect(pouchDbService.all).toHaveBeenCalledWith("mock", "mock-123");
    });

    test("passes onlyShortVersion option", async () => {
      pouchDbService.allArray.mockResolvedValueOnce([{ id: "metadata-1" }]);
      await databaseService.initForUser("testUser", "hashedPw", null, false);

      pouchDbService.all.mockResolvedValueOnce([]);

      await databaseService.getObject(MockObjectType, null, true);

      expect(
        convertServiceDb.convertDatabaseToLiveObjects,
      ).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ onlyShortVersion: true }),
      );
    });

    test("rejects when objectType missing getIdPrefix", async () => {
      pouchDbService.allArray.mockResolvedValueOnce([{ id: "metadata-1" }]);
      await databaseService.initForUser("testUser", "hashedPw", null, false);

      const invalidType = {};

      await expect(
        databaseService.getObject(invalidType),
      ).rejects.toBeUndefined();
      expect(log.warn).toHaveBeenCalledWith(
        "missing method getIdPrefix() in allObjects()",
      );
    });

    test("updates model version in localStorage when changed", async () => {
      pouchDbService.allArray.mockResolvedValueOnce([{ id: "metadata-1" }]);
      pouchDbService.getOpenedDatabaseName.mockReturnValue("testUser");
      await databaseService.initForUser("testUser", "hashedPw", null, false);

      const mockData = { id: "mock-1", modelVersion: '{"major": 5}' };
      pouchDbService.all.mockResolvedValueOnce(mockData);
      convertServiceDb.convertDatabaseToLiveObjects.mockReturnValueOnce(
        mockData,
      );

      await databaseService.getObject(MockObjectType);

      expect(localStorageService.setUserModelVersion).toHaveBeenCalledWith(
        "testUser",
        '{"major": 5}',
      );
    });
  });

  describe("getSingleObject", () => {
    test("returns single object from result", async () => {
      pouchDbService.allArray.mockResolvedValueOnce([{ id: "metadata-1" }]);
      await databaseService.initForUser("testUser", "hashedPw", null, false);

      const mockData = { id: "mock-1", name: "Single Object" };
      pouchDbService.all.mockResolvedValueOnce(mockData);
      convertServiceDb.convertDatabaseToLiveObjects.mockReturnValueOnce(
        mockData,
      );

      const result = await databaseService.getSingleObject(
        MockObjectType,
        "mock-1",
      );

      expect(result).toEqual(mockData);
    });

    test("returns first element when result is array", async () => {
      pouchDbService.allArray.mockResolvedValueOnce([{ id: "metadata-1" }]);
      await databaseService.initForUser("testUser", "hashedPw", null, false);

      const mockData = [
        { id: "mock-1", name: "First" },
        { id: "mock-2", name: "Second" },
      ];
      pouchDbService.all.mockResolvedValueOnce(mockData);
      convertServiceDb.convertDatabaseToLiveObjects.mockReturnValueOnce(
        mockData,
      );

      const result = await databaseService.getSingleObject(MockObjectType);

      expect(result).toEqual({ id: "mock-1", name: "First" });
    });

    test("returns null when no objects found", async () => {
      pouchDbService.allArray.mockResolvedValueOnce([{ id: "metadata-1" }]);
      await databaseService.initForUser("testUser", "hashedPw", null, false);

      pouchDbService.all.mockResolvedValueOnce(null);
      convertServiceDb.convertDatabaseToLiveObjects.mockReturnValueOnce(null);

      const result = await databaseService.getSingleObject(
        MockObjectType,
        "nonexistent",
      );

      expect(result).toBeNull();
    });
  });

  describe("saveObject", () => {
    beforeEach(async () => {
      pouchDbService.allArray.mockResolvedValueOnce([{ id: "metadata-1" }]);
      await databaseService.initForUser("testUser", "hashedPw", null, false);
    });

    test("creates new object when not existing", async () => {
      const newObject = { id: "mock-new", name: "New Object" };
      pouchDbService.all.mockResolvedValueOnce(null);
      convertServiceDb.convertDatabaseToLiveObjects.mockReturnValueOnce(null);

      await databaseService.saveObject(MockObjectType, newObject, false);

      expect(pouchDbService.save).toHaveBeenCalled();
    });

    test("updates existing object", async () => {
      const existingObject = {
        id: "mock-1",
        _id: "mock-1",
        _rev: "rev-1",
        name: "Existing",
      };
      const updatedData = { id: "mock-1", name: "Updated" };

      pouchDbService.all.mockResolvedValueOnce(existingObject);
      convertServiceDb.convertDatabaseToLiveObjects.mockReturnValueOnce(
        existingObject,
      );

      await databaseService.saveObject(MockObjectType, updatedData, false);

      expect(pouchDbService.save).toHaveBeenCalled();
      expect(log.debug).toHaveBeenCalledWith(
        expect.stringContaining("already existing"),
      );
    });

    test("does not create new object when onlyUpdate is true", async () => {
      const newObject = { id: "mock-new", name: "New Object" };
      pouchDbService.all.mockResolvedValueOnce(null);
      convertServiceDb.convertDatabaseToLiveObjects.mockReturnValueOnce(null);

      await expect(
        databaseService.saveObject(MockObjectType, newObject, true),
      ).rejects.toBeUndefined();

      expect(pouchDbService.save).not.toHaveBeenCalled();
      expect(log.warn).toHaveBeenCalledWith(
        expect.stringContaining("no existing"),
      );
    });

    test("rejects when data is null", async () => {
      await expect(
        databaseService.saveObject(MockObjectType, null, false),
      ).rejects.toBeUndefined();

      expect(log.error).toHaveBeenCalled();
    });

    test("rejects when objectType is null", async () => {
      await expect(
        databaseService.saveObject(null, { id: "1" }, false),
      ).rejects.toBeUndefined();
    });

    test("rejects when trying to save short version", async () => {
      const shortVersion = { id: "mock-1", isShortVersion: true };

      await expect(
        databaseService.saveObject(MockObjectType, shortVersion, false),
      ).rejects.toBeUndefined();

      expect(log.warn).toHaveBeenCalledWith(
        expect.stringContaining("short versions"),
      );
    });
  });

  describe("bulkSave", () => {
    beforeEach(async () => {
      pouchDbService.allArray.mockResolvedValueOnce([{ id: "metadata-1" }]);
      await databaseService.initForUser("testUser", "hashedPw", null, false);
    });

    test("saves multiple objects at once", async () => {
      const objects = [
        { id: "mock-1", name: "Object 1" },
        { id: "mock-2", name: "Object 2" },
      ];

      await databaseService.bulkSave(objects);

      expect(pouchDbService.bulkDocs).toHaveBeenCalled();
    });

    test("resolves immediately for empty list", async () => {
      await expect(databaseService.bulkSave([])).resolves.toBeUndefined();
      expect(pouchDbService.bulkDocs).not.toHaveBeenCalled();
    });

    test("resolves immediately for null list", async () => {
      await expect(databaseService.bulkSave(null)).resolves.toBeUndefined();
      expect(pouchDbService.bulkDocs).not.toHaveBeenCalled();
    });

    test("does not save short versions", async () => {
      const objects = [{ id: "mock-1", isShortVersion: true }];

      await databaseService.bulkSave(objects);

      expect(pouchDbService.bulkDocs).not.toHaveBeenCalled();
      expect(log.warn).toHaveBeenCalledWith("not saving short version!");
    });

    test("splits large batches into chunks", async () => {
      // Create objects with many grid elements to trigger chunking
      const objects = [];
      for (let i = 0; i < 5; i++) {
        objects.push({
          id: `grid-${i}`,
          gridElements: new Array(300).fill({ id: `elem-${i}` }),
        });
      }

      await databaseService.bulkSave(objects);

      // Should have called bulkDocs multiple times for chunks
      expect(pouchDbService.bulkDocs).toHaveBeenCalled();
    });
  });

  describe("bulkDelete", () => {
    test("deletes multiple objects at once", async () => {
      const objects = [
        { id: "mock-1", _rev: "rev-1" },
        { id: "mock-2", _rev: "rev-2" },
      ];

      await databaseService.bulkDelete(objects);

      expect(pouchDbService.bulkDocs).toHaveBeenCalledWith([
        { _id: "mock-1", _rev: "rev-1", _deleted: true },
        { _id: "mock-2", _rev: "rev-2", _deleted: true },
      ]);
    });

    test("resolves immediately for empty list", async () => {
      await expect(databaseService.bulkDelete([])).resolves.toBeUndefined();
      expect(pouchDbService.bulkDocs).not.toHaveBeenCalled();
    });

    test("resolves immediately for null list", async () => {
      await expect(databaseService.bulkDelete(null)).resolves.toBeUndefined();
      expect(pouchDbService.bulkDocs).not.toHaveBeenCalled();
    });
  });

  describe("removeObject", () => {
    test("removes object by id", async () => {
      await databaseService.removeObject("mock-123");

      expect(pouchDbService.remove).toHaveBeenCalledWith("mock-123");
    });
  });

  describe("initForUser", () => {
    test("initializes database for user", async () => {
      pouchDbService.allArray.mockResolvedValueOnce([]);

      await databaseService.initForUser("testUser", "hashedPw", null, false);

      expect(pouchDbService.initDatabase).toHaveBeenCalledWith(
        "testUser",
        null,
        false,
      );
      expect(encryptionService.setEncryptionProperties).toHaveBeenCalled();
      expect($(document).trigger).toHaveBeenCalled();
    });

    test("creates metadata if not existing", async () => {
      pouchDbService.allArray.mockResolvedValueOnce([]);

      await databaseService.initForUser("testUser", "hashedPw", null, false);

      expect(MetaData).toHaveBeenCalled();
      expect(pouchDbService.save).toHaveBeenCalledWith(
        "metadata",
        expect.objectContaining({ id: "metadata-test-id" }),
      );
    });

    test("skips re-init if user already opened with same sync state", async () => {
      pouchDbService.getOpenedDatabaseName.mockReturnValue("testUser");
      pouchDbService.isSyncEnabled.mockReturnValue(false);

      await databaseService.initForUser("testUser", "hashedPw", null, false);

      // Should resolve immediately without calling initDatabase
      expect(pouchDbService.initDatabase).not.toHaveBeenCalled();
    });

    test("re-initializes when sync state changes", async () => {
      pouchDbService.getOpenedDatabaseName.mockReturnValue("testUser");
      pouchDbService.isSyncEnabled.mockReturnValue(false);
      pouchDbService.allArray.mockResolvedValueOnce([{ id: "metadata-1" }]);

      await databaseService.initForUser(
        "testUser",
        "hashedPw",
        "http://remote.db",
        false,
      );

      expect(pouchDbService.initDatabase).toHaveBeenCalled();
    });

    test("identifies local users correctly", async () => {
      localStorageService.getSavedLocalUsers.mockReturnValueOnce(["localUser"]);
      pouchDbService.allArray.mockResolvedValueOnce([{ id: "metadata-1" }]);

      await databaseService.initForUser("localUser", "hashedPw", null, false);

      expect(encryptionService.setEncryptionProperties).toHaveBeenCalledWith(
        "hashedPw",
        expect.any(Array),
        true,
      );
    });

    test("resets database when URL param indicates", async () => {
      urlParamService.shouldResetDatabase.mockReturnValueOnce(true);
      pouchDbService.allArray.mockResolvedValueOnce([]);

      await databaseService.initForUser("testUser", "hashedPw", null, false);

      expect(pouchDbService.resetDatabase).toHaveBeenCalledWith("testUser");
    });

    test("handles multiple metadata objects by sorting and using oldest", async () => {
      const metadataObjects = [{ id: "metadata-2" }, { id: "metadata-1" }];
      pouchDbService.allArray.mockResolvedValueOnce(metadataObjects);

      await databaseService.initForUser("testUser", "hashedPw", null, false);

      // Should set encryption with sorted metadata IDs
      expect(encryptionService.setEncryptionProperties).toHaveBeenCalledWith(
        "hashedPw",
        ["metadata-1", "metadata-2"],
        false,
      );
      expect(log.warn).toHaveBeenCalledWith("found duplicated metadata!");
    });
  });

  describe("registerForUser", () => {
    test("creates new database for user registration", async () => {
      pouchDbService.allArray.mockResolvedValueOnce([]);

      await databaseService.registerForUser("newUser", "hashedPw", null, false);

      expect(pouchDbService.createDatabase).toHaveBeenCalledWith(
        "newUser",
        null,
        false,
      );
      expect(encryptionService.setEncryptionProperties).toHaveBeenCalled();
    });

    test("skips if user database already open with correct sync state", async () => {
      pouchDbService.getOpenedDatabaseName.mockReturnValue("existingUser");
      pouchDbService.isSyncEnabled.mockReturnValue(false);

      await databaseService.registerForUser(
        "existingUser",
        "hashedPw",
        null,
        false,
      );

      expect(pouchDbService.createDatabase).not.toHaveBeenCalled();
    });
  });

  describe("deleteDatabase", () => {
    test("deletes database for user", async () => {
      await databaseService.deleteDatabase("testUser");

      expect(pouchDbService.deleteDatabase).toHaveBeenCalledWith("testUser");
    });

    test("does nothing for null user", async () => {
      await databaseService.deleteDatabase(null);

      expect(pouchDbService.deleteDatabase).not.toHaveBeenCalled();
    });
  });

  describe("closeCurrentDatabase", () => {
    test("closes the current database", async () => {
      await databaseService.closeCurrentDatabase();

      expect(pouchDbService.closeCurrentDatabase).toHaveBeenCalled();
    });
  });

  describe("getCurrentUsedDatabase", () => {
    test("returns current database name", () => {
      pouchDbService.getOpenedDatabaseName.mockReturnValue("currentUser");

      const result = databaseService.getCurrentUsedDatabase();

      expect(result).toBe("currentUser");
    });

    test("returns null when no database open", () => {
      pouchDbService.getOpenedDatabaseName.mockReturnValue(null);

      const result = databaseService.getCurrentUsedDatabase();

      expect(result).toBeNull();
    });
  });

  describe("error handling", () => {
    test("getObject rejects on database error", async () => {
      pouchDbService.allArray.mockResolvedValueOnce([{ id: "metadata-1" }]);
      await databaseService.initForUser("testUser", "hashedPw", null, false);

      pouchDbService.all.mockRejectedValueOnce(new Error("Database error"));

      await expect(databaseService.getObject(MockObjectType)).rejects.toEqual(
        new Error("Database error"),
      );
    });

    test("saveObject rejects on save error", async () => {
      pouchDbService.allArray.mockResolvedValueOnce([{ id: "metadata-1" }]);
      await databaseService.initForUser("testUser", "hashedPw", null, false);

      pouchDbService.all.mockResolvedValueOnce(null);
      convertServiceDb.convertDatabaseToLiveObjects.mockReturnValueOnce(null);
      pouchDbService.save.mockRejectedValueOnce(new Error("Save failed"));

      await expect(
        databaseService.saveObject(MockObjectType, { id: "test" }, false),
      ).rejects.toEqual(new Error("Save failed"));
    });
  });

  describe("edge cases", () => {
    test("handles empty metadata list gracefully", async () => {
      pouchDbService.allArray.mockResolvedValueOnce([]);

      await databaseService.initForUser("testUser", "hashedPw", null, false);

      // Should create new metadata
      expect(MetaData).toHaveBeenCalled();
    });

    test("handles undefined onlyRemote parameter", async () => {
      pouchDbService.allArray.mockResolvedValueOnce([{ id: "metadata-1" }]);

      await databaseService.initForUser(
        "testUser",
        "hashedPw",
        "http://remote.db",
      );

      expect(pouchDbService.initDatabase).toHaveBeenCalledWith(
        "testUser",
        "http://remote.db",
        undefined,
      );
    });
  });
});
