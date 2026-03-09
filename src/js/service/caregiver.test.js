const mockOn = jest.fn();
const mockTrigger = jest.fn();

jest.mock('../externals/jquery.js', () => {
  return jest.fn(() => ({
    on: mockOn,
    trigger: mockTrigger,
  }));
});

const mockSuperlogin = {
  configure: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  getSession: jest.fn(),
};

jest.mock('superlogin-client', () => mockSuperlogin);

const mockDatabaseService = {
  saveObject: jest.fn(),
  getObject: jest.fn(),
  getSingleObject: jest.fn(),
  removeObject: jest.fn(),
  initForUser: jest.fn(),
  closeCurrentDatabase: jest.fn(),
  getCurrentUsedDatabase: jest.fn(),
};

jest.mock('./data/databaseService', () => ({
  databaseService: mockDatabaseService,
}));

const mockEncryptionService = {
  getUserPasswordHash: jest.fn((value) => `hash:${value}`),
};

jest.mock('./data/encryptionService', () => ({
  encryptionService: mockEncryptionService,
}));

const memoryStore = {};
const mockLocalStorageService = {
  getJSON: jest.fn((key) => memoryStore[key]),
  saveJSON: jest.fn((key, value) => {
    memoryStore[key] = value;
  }),
  setLastActiveUser: jest.fn(),
  setAutologinUser: jest.fn(),
  saveUserPassword: jest.fn(),
  isDatabaseSynced: jest.fn(() => false),
  getUserSettings: jest.fn(() => ({ password: 'hash:pass123' })),
  getSavedOnlineUsers: jest.fn(() => []),
  getSavedLocalUsers: jest.fn(() => []),
  isSavedLocalUser: jest.fn(() => false),
};

jest.mock('./data/localStorageService', () => ({
  localStorageService: mockLocalStorageService,
}));

const mockArasaacService = {
  query: jest.fn(),
};

jest.mock('./pictograms/arasaacService', () => ({
  arasaacService: mockArasaacService,
}));

jest.mock('../model/UserProfile', () => ({
  UserProfile: class UserProfile {
    constructor(data) {
      Object.assign(this, data);
    }
  },
}));

jest.mock('../model/SuggestedWord', () => ({
  SuggestedWord: class SuggestedWord {
    constructor(data) {
      Object.assign(this, data);
    }
  },
}));

jest.mock('../router', () => ({
  Router: {
    toMain: jest.fn(),
    toLogin: jest.fn(),
  },
}));

const mockClearTooltip = jest.fn();
jest.mock('../vue/mainVue.js', () => ({
  MainVue: {
    clearTooltip: mockClearTooltip,
  },
}));

jest.mock('../util/util.js', () => ({
  util: {
    sleep: jest.fn(() => Promise.resolve()),
    getRandom: jest.fn(() => 1),
  },
}));

jest.mock('../util/constants', () => ({
  constants: {
    IS_ENVIRONMENT_PROD: false,
    FORCE_CONNECT_DB: false,
    EVENT_USER_CHANGING: 'EVENT_USER_CHANGING',
    EVENT_DB_CONNECTION_LOST: 'EVENT_DB_CONNECTION_LOST',
    EVENT_DB_DATAMODEL_UPDATE: 'EVENT_DB_DATAMODEL_UPDATE',
    USERNAME_REGEX: /^[a-z0-9_]+$/,
    VALIDATION_ERROR_REGEX: 'VALIDATION_ERROR_REGEX',
    VALIDATION_ERROR_EXISTING: 'VALIDATION_ERROR_EXISTING',
    VALIDATION_VALID: 'VALIDATION_VALID',
    VALIDATION_ERROR_FAILED: 'VALIDATION_ERROR_FAILED',
    LOCAL_DEMO_USERNAME: 'local_demo',
  },
}));

const { caregiverDataService } = require('./data/caregiverDataService');
const { loginService } = require('./loginService');
const { UserProfile } = require('../model/UserProfile');

describe('caregiver combined test cases', () => {
  // Suite description:
  // Validates caregiver acceptance scenarios at service level for registration,
  // authentication, session termination, suggestion search, and student linking.
  beforeEach(() => {
    global.log = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
    };

    jest.clearAllMocks();
    Object.keys(memoryStore).forEach((k) => delete memoryStore[k]);

    mockDatabaseService.saveObject.mockResolvedValue(undefined);
    mockDatabaseService.getObject.mockResolvedValue([]);
    mockDatabaseService.getSingleObject.mockResolvedValue(null);
    mockDatabaseService.removeObject.mockResolvedValue(undefined);
    mockDatabaseService.initForUser.mockResolvedValue(undefined);

    mockSuperlogin.login.mockResolvedValue({ userDBs: { aac: 'caregiver-db' } });
    mockArasaacService.query.mockResolvedValue([]);
  });

  test('TC-01: saves caregiver profile with normalized username', async () => {
    // Description: verifies caregiver registration data is normalized before persistence.
    // Arrange
    const profile = { id: 'care-1', username: ' TestUser ', role: 'caregiver' };

    // Act
    await caregiverDataService.saveUserProfile(profile);

    // Assert
    expect(profile.username).toBe('testuser');
    expect(mockDatabaseService.saveObject).toHaveBeenCalledWith(UserProfile, profile);
    expect(mockLocalStorageService.saveJSON).toHaveBeenCalled();
  });

  test('TC-02: signs in caregiver using valid credentials', async () => {
    // Description: verifies caregiver authentication succeeds when username/password are valid.
    // Arrange
    mockDatabaseService.getObject.mockResolvedValue([
      { id: 'care-2', username: 'caregiver1', role: 'caregiver', passwordHash: 'hash:pass123', lastModified: 10 },
    ]);

    // Act
    const result = await caregiverDataService.verifyCaregiverCredentials('caregiver1', 'pass123');

    // Assert
    expect(result).toBeInstanceOf(UserProfile);
    expect(result.id).toBe('care-2');
  });

  test('TC-03: caregiver session termination logs out and clears active session resources', async () => {
    // Description: verifies sign-out clears caregiver session state and closes active resources.
    // Arrange + Act
    await loginService.loginHashedPassword('caregiver1', 'hash:pass123', true);
    loginService.logout();

    // Assert
    expect(mockDatabaseService.closeCurrentDatabase).toHaveBeenCalled();
    expect(mockClearTooltip).toHaveBeenCalled();
    expect(mockSuperlogin.logout).toHaveBeenCalledWith('caregiver1');
    expect(mockTrigger).toHaveBeenCalled();
    expect(loginService.getLoggedInUsername()).toBeUndefined();
  });

  test('TC-04: returns local + API results for suggestion search', async () => {
    // Description: verifies suggestion search combines local caregiver words with API results.
    // Arrange
    mockDatabaseService.getObject.mockResolvedValue([
      { id: 'w-local', label: 'water', description: 'drink', tags: [] },
    ]);
    mockArasaacService.query.mockResolvedValue([
      { url: 'https://api.arasaac.org/api/pictograms/123?download=false' },
    ]);

    // Act
    const results = await caregiverDataService.searchSuggestedWords('water');

    // Assert
    expect(results.some((w) => w.id === 'w-local')).toBe(true);
    expect(results.some((w) => (w.id || '').startsWith('api_arasaac_'))).toBe(true);
  });

  test('TC-05: links student to caregiver by PIN', async () => {
    // Description: verifies student linking by PIN updates caregiver and student records.
    // Arrange
    const caregiver = { id: 'care-5', role: 'caregiver', studentIds: [], lastModified: 1 };
    const student = { id: 'stu-5', role: 'student', pin: '1234', caregiverId: null, lastModified: 1 };

    mockDatabaseService.getSingleObject.mockImplementation(async (_type, id) => {
      if (id === 'care-5') return caregiver;
      if (id === 'stu-5') return student;
      return null;
    });
    mockDatabaseService.getObject.mockResolvedValue([student]);

    // Act
    const linkedStudent = await caregiverDataService.addStudentToCaregiverByPin('care-5', '1234');

    // Assert
    expect(linkedStudent.id).toBe('stu-5');
    expect(mockDatabaseService.saveObject).toHaveBeenCalledWith(UserProfile, expect.objectContaining({ id: 'care-5' }));
    expect(mockDatabaseService.saveObject).toHaveBeenCalledWith(UserProfile, expect.objectContaining({ id: 'stu-5', caregiverId: 'care-5' }));
  });
});
