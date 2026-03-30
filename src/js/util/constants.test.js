import { constants } from './constants';

describe('constants', () => {
    test('ELEMENT_EVENT_ID is defined', () => {
        expect(constants.ELEMENT_EVENT_ID).toBe('ELEMENT_EVENT_ID');
    });

    test('MODEL_VERSION is valid JSON', () => {
        const version = JSON.parse(constants.MODEL_VERSION);
        expect(version).toHaveProperty('major');
        expect(version).toHaveProperty('minor');
        expect(version).toHaveProperty('patch');
    });

    test('LOCAL_NOLOGIN_USERNAME is defined', () => {
        expect(constants.LOCAL_NOLOGIN_USERNAME).toBe('default-user');
    });

    test('USERNAME_REGEX validates usernames correctly', () => {
        expect(constants.USERNAME_REGEX.test('validuser')).toBe(true);
        expect(constants.USERNAME_REGEX.test('user123')).toBe(true);
        expect(constants.USERNAME_REGEX.test('user-name')).toBe(true);
        expect(constants.USERNAME_REGEX.test('user_name')).toBe(true);
        expect(constants.USERNAME_REGEX.test('ab')).toBe(false); // too short
        expect(constants.USERNAME_REGEX.test('UPPERCASE')).toBe(false); // no uppercase
        expect(constants.USERNAME_REGEX.test('-invalid')).toBe(false); // cannot start with -
    });

    test('EMOJI_REGEX matches emojis', () => {
        expect('🙂'.match(constants.EMOJI_REGEX)).toBeTruthy();
        expect('👍'.match(constants.EMOJI_REGEX)).toBeTruthy();
    });

    test('VALIDATION constants are defined', () => {
        expect(constants.VALIDATION_ERROR_REGEX).toBe('VALIDATION_ERROR_REGEX');
        expect(constants.VALIDATION_ERROR_EXISTING).toBe('VALIDATION_ERROR_EXISTING');
        expect(constants.VALIDATION_ERROR_FAILED).toBe('VALIDATION_ERROR_FAILED');
        expect(constants.VALIDATION_VALID).toBe('VALIDATION_VALID');
    });

    test('MODAL_TYPE constants are defined', () => {
        expect(constants.MODAL_TYPE_SUCCESS).toBe('success');
        expect(constants.MODAL_TYPE_QUESTION).toBe('question');
        expect(constants.MODAL_TYPE_WARNING).toBe('warning');
        expect(constants.MODAL_TYPE_INFO).toBe('info');
    });

    test('BUTTONS presets are defined', () => {
        expect(constants.BUTTONS_OK).toBe('ok');
        expect(constants.BUTTONS_YES_NO).toBe('yesno');
        expect(constants.BUTTONS_OK_CANCEL).toBe('okcancel');
    });

    test('EVENT constants are defined', () => {
        expect(constants.EVENT_DB_CONNECTION_LOST).toBe('EVENT_DB_CONNECTION_LOST');
        expect(constants.EVENT_GRID_LOADED).toBe('EVENT_GRID_LOADED');
        expect(constants.EVENT_USER_CHANGED).toBe('EVENT_USER_CHANGED');
    });

    test('DB_SYNC_STATE constants are defined', () => {
        expect(constants.DB_SYNC_STATE_SYNCINC).toBe('DB_SYNC_STATE_SYNCINC');
        expect(constants.DB_SYNC_STATE_SYNCED).toBe('DB_SYNC_STATE_SYNCED');
        expect(constants.DB_SYNC_STATE_STOPPED).toBe('DB_SYNC_STATE_STOPPED');
        expect(constants.DB_SYNC_STATE_FAIL).toBe('DB_SYNC_STATE_FAIL');
    });

    test('COLORS object has correct values', () => {
        expect(constants.COLORS.WHITE).toBe('#ffffff');
        expect(constants.COLORS.BLACK).toBe('#000000');
        expect(constants.COLORS.GRAY).toBe('#808080');
        expect(constants.COLORS.TRANSPARENT).toBe('transparent');
    });

    test('VOICE_TYPE constants are defined', () => {
        expect(constants.VOICE_TYPE_NATIVE).toBe('VOICE_TYPE_NATIVE');
        expect(constants.VOICE_TYPE_RESPONSIVEVOICE).toBe('VOICE_TYPE_RESPONSIVEVOICE');
        expect(constants.VOICE_TYPE_EXTERNAL_PLAYING).toBe('VOICE_TYPE_EXTERNAL_PLAYING');
    });

    test('BOARD_TYPES array contains expected values', () => {
        expect(constants.BOARD_TYPES).toContain(constants.BOARD_TYPE_SELFCONTAINED);
        expect(constants.BOARD_TYPES).toContain(constants.BOARD_TYPE_SINGLE);
    });

    test('PROP_TRANSFER_TYPES are defined', () => {
        expect(constants.PROP_TRANSFER_TYPES.BOOLEAN).toBe('BOOLEAN');
        expect(constants.PROP_TRANSFER_TYPES.COLOR).toBe('COLOR');
        expect(constants.PROP_TRANSFER_TYPES.PERCENTAGE).toBe('PERCENTAGE');
        expect(constants.PROP_TRANSFER_TYPES.TEXT).toBe('TEXT');
        expect(constants.PROP_TRANSFER_TYPES.NUMBER).toBe('NUMBER');
    });

    test('TRANSFER_PROPS has expected structure', () => {
        expect(constants.TRANSFER_PROPS.COLOR_CATEGORY).toHaveProperty('path', 'colorCategory');
        expect(constants.TRANSFER_PROPS.BACKGROUND_COLOR).toHaveProperty('path', 'backgroundColor');
        expect(constants.TRANSFER_PROPS.HIDDEN).toHaveProperty('type', constants.PROP_TRANSFER_TYPES.BOOLEAN);
    });

    test('DEFAULT_COLOR_SCHEMES has valid structure', () => {
        expect(constants.DEFAULT_COLOR_SCHEMES).toBeInstanceOf(Array);
        expect(constants.DEFAULT_COLOR_SCHEMES.length).toBeGreaterThan(0);
        
        const firstScheme = constants.DEFAULT_COLOR_SCHEMES[0];
        expect(firstScheme).toHaveProperty('name');
        expect(firstScheme).toHaveProperty('categories');
        expect(firstScheme).toHaveProperty('colors');
        expect(firstScheme.colors).toBeInstanceOf(Array);
    });

    test('WORDFORM_TAGS is defined and includes BASE', () => {
        expect(constants.WORDFORM_TAGS).toBeInstanceOf(Array);
        expect(constants.WORDFORM_TAGS).toContain(constants.WORDFORM_TAG_BASE);
        expect(constants.WORDFORM_TAGS).toContain('SINGULAR');
        expect(constants.WORDFORM_TAGS).toContain('PLURAL');
    });

    test('ARASAAC constants are defined', () => {
        expect(constants.ARASAAC_AUTHOR).toBe('ARASAAC - CC (BY-NC-SA)');
        expect(constants.ARASAAC_LICENSE_URL).toBe('https://arasaac.org/terms-of-use');
    });

    test('browser detection flags are boolean', () => {
        expect(typeof constants.IS_FIREFOX).toBe('boolean');
        expect(typeof constants.IS_SAFARI).toBe('boolean');
        expect(typeof constants.IS_MAC).toBe('boolean');
    });

    test('environment flags are boolean', () => {
        expect(typeof constants.IS_ENVIRONMENT_DEV).toBe('boolean');
        expect(typeof constants.IS_ENVIRONMENT_BETA).toBe('boolean');
        expect(typeof constants.IS_ENVIRONMENT_PROD).toBe('boolean');
    });

    test('color scheme categories are arrays', () => {
        expect(constants.CS_FITZGERALD_CATEGORIES).toBeInstanceOf(Array);
        expect(constants.CS_GOOSSENS_CATEGORIES).toBeInstanceOf(Array);
        expect(constants.CS_MONTESSORI_CATEGORIES).toBeInstanceOf(Array);
    });

    test('CS_MAPPING_TO_FITZGERALD maps correctly', () => {
        expect(constants.CS_MAPPING_TO_FITZGERALD.CC_ADJECTIVE).toBe(constants.CC_DESCRIPTOR);
        expect(constants.CS_MAPPING_TO_FITZGERALD.CC_ADVERB).toBe(constants.CC_DESCRIPTOR);
    });
});
