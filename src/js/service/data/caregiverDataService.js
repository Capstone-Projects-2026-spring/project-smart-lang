import { databaseService } from './databaseService';
import { UserProfile } from '../../model/UserProfile';
import { SuggestedWord } from '../../model/SuggestedWord';
import { encryptionService } from './encryptionService';
import { localStorageService } from './localStorageService';
import { arasaacService } from '../pictograms/arasaacService';

let caregiverDataService = {};
const CAREGIVER_PROFILES_KEY = 'AG_CAREGIVER_PROFILES';
const CAREGIVER_SUGGESTED_WORDS_KEY = 'AG_CAREGIVER_SUGGESTED_WORDS';

function normalizeUsername(username) {
    return (username || '').trim().toLowerCase();
}

function getLocalCaregiverProfiles() {
    const profiles = localStorageService.getJSON(CAREGIVER_PROFILES_KEY);
    return Array.isArray(profiles) ? profiles : [];
}

function saveLocalCaregiverProfiles(profiles) {
    localStorageService.saveJSON(CAREGIVER_PROFILES_KEY, profiles || []);
}

function upsertLocalCaregiverProfile(profile) {
    if (!profile) {
        return;
    }
    const normalizedUsername = normalizeUsername(profile.username);
    const existing = getLocalCaregiverProfiles();
    const withoutSame = existing.filter(p => normalizeUsername(p.username) !== normalizedUsername);
    withoutSame.push(JSON.parse(JSON.stringify(profile)));
    saveLocalCaregiverProfiles(withoutSame);
}

function getAllCaregiverProfilesCombined(dbProfiles) {
    const normalizedDbProfiles = Array.isArray(dbProfiles)
        ? dbProfiles
        : dbProfiles
            ? [dbProfiles]
            : [];
    const localProfiles = getLocalCaregiverProfiles();
    return normalizedDbProfiles.concat(localProfiles).filter(Boolean);
}

function getLocalSuggestedWords() {
    const words = localStorageService.getJSON(CAREGIVER_SUGGESTED_WORDS_KEY);
    return Array.isArray(words) ? words : [];
}

function saveLocalSuggestedWords(words) {
    localStorageService.saveJSON(CAREGIVER_SUGGESTED_WORDS_KEY, words || []);
}

function upsertLocalSuggestedWord(suggestedWord) {
    if (!suggestedWord) {
        return;
    }
    const incoming = JSON.parse(JSON.stringify(suggestedWord));
    const existing = getLocalSuggestedWords();
    const withoutSameId = existing.filter(word => word.id !== incoming.id);
    withoutSameId.push(incoming);
    saveLocalSuggestedWords(withoutSameId);
}

function mergeSuggestedWords(dbWords, localWords) {
    const combined = (dbWords || []).concat(localWords || []);
    const deduped = new Map();
    combined.forEach((word) => {
        if (!word || !word.id) {
            return;
        }
        const current = deduped.get(word.id);
        const currentTime = current ? (current.lastModified || current.createdAt || 0) : 0;
        const wordTime = word ? (word.lastModified || word.createdAt || 0) : 0;
        if (!current || wordTime >= currentTime) {
            deduped.set(word.id, word);
        }
    });
    return Array.from(deduped.values());
}

function textIncludesSearch(value, lowerSearchTerm) {
    const text = typeof value === 'object'
        ? Object.values(value || {}).join(' ').toLowerCase()
        : (value || '').toString().toLowerCase();
    return text.includes(lowerSearchTerm);
}

function toApiSuggestedWord(apiItem, searchTerm, index) {
    const url = apiItem && apiItem.url ? apiItem.url : null;
    const fallbackId = `api_arasaac_${searchTerm}_${index}`;
    let idFromUrl = '';
    if (url && url.includes('/api/pictograms/')) {
        idFromUrl = url.substring(url.lastIndexOf('/api/pictograms/') + '/api/pictograms/'.length, url.indexOf('?') > -1 ? url.indexOf('?') : url.length);
    }
    return new SuggestedWord({
        id: idFromUrl ? `api_arasaac_${idFromUrl}` : fallbackId,
        label: searchTerm,
        description: `ARASAAC API result`,
        category: 'api',
        image: url ? { url: url } : null,
        createdAt: Date.now(),
        lastModified: Date.now(),
        isActive: true,
        tags: ['api', 'arasaac']
    });
}

async function getApiSuggestedWords(searchTerm) {
    try {
        if (!searchTerm || !searchTerm.trim()) {
            return [];
        }
        const apiResults = await arasaacService.query(searchTerm.trim());
        const list = Array.isArray(apiResults) ? apiResults : [];
        return list.map((item, index) => toApiSuggestedWord(item, searchTerm.trim(), index));
    } catch (error) {
        console.warn('Failed to fetch suggestion words from API:', error);
        return [];
    }
}

/**
 * Saves a user profile (caregiver or student) to the database
 * @param {UserProfile} userProfile - the user profile to save
 * @return {Promise} resolves when save is complete
 */
caregiverDataService.saveUserProfile = function (userProfile) {
    if (userProfile && userProfile.role === 'caregiver') {
        userProfile.username = normalizeUsername(userProfile.username);
        upsertLocalCaregiverProfile(userProfile);
    }

    return databaseService.saveObject(UserProfile, userProfile)
        .then(result => result)
        .catch(error => {
            if (userProfile && userProfile.role === 'caregiver') {
                console.warn('Database save failed for caregiver profile, using local fallback.', error);
                return Promise.resolve();
            }
            throw error;
        });
};

/**
 * Gets a caregiver profile by username
 * @param {string} username - the username to search for
 * @return {Promise<UserProfile|null>} resolves to the caregiver profile or null if not found
 */
caregiverDataService.getCaregiverByUsername = async function (username) {
    try {
        const normalizedUsername = normalizeUsername(username);
        if (!normalizedUsername) {
            return null;
        }
        let allProfiles = null;
        try {
            allProfiles = await databaseService.getObject(UserProfile);
        } catch (error) {
            console.warn('Unable to read caregiver profiles from database. Using local fallback.', error);
        }
        
        const profilesArray = getAllCaregiverProfilesCombined(allProfiles);
        const caregiver = profilesArray
            .filter(
                profile => normalizeUsername(profile.username) === normalizedUsername && profile.role === 'caregiver'
            )
            .sort((a, b) => {
                const aHasHash = a && a.passwordHash ? 1 : 0;
                const bHasHash = b && b.passwordHash ? 1 : 0;
                if (aHasHash !== bHasHash) {
                    return bHasHash - aHasHash;
                }
                return (b.lastModified || b.createdAt || 0) - (a.lastModified || a.createdAt || 0);
            })[0];
        
        return caregiver ? new UserProfile(caregiver) : null;
    } catch (error) {
        console.error('Error getting caregiver by username:', error);
        return null;
    }
};

/**
 * Verifies caregiver credentials against all matching caregiver records.
 * This supports legacy duplicate records by selecting the newest profile whose hash matches.
 * @param {string} username - caregiver username
 * @param {string} plainPassword - plaintext password to verify
 * @return {Promise<UserProfile|null>} resolves to matching caregiver profile or null
 */
caregiverDataService.verifyCaregiverCredentials = async function (username, plainPassword) {
    try {
        const normalizedUsername = normalizeUsername(username);
        if (!normalizedUsername || !plainPassword) {
            return null;
        }

        let allProfiles = null;
        try {
            allProfiles = await databaseService.getObject(UserProfile);
        } catch (error) {
            console.warn('Unable to verify caregiver against database profiles. Using local fallback.', error);
        }

        const profilesArray = getAllCaregiverProfilesCombined(allProfiles);
        const matchingProfiles = profilesArray
            .filter(
                profile => normalizeUsername(profile.username) === normalizedUsername && profile.role === 'caregiver'
            )
            .sort((a, b) => (b.lastModified || b.createdAt || 0) - (a.lastModified || a.createdAt || 0));

        if (!matchingProfiles.length) {
            return null;
        }

        const rawHash = encryptionService.getUserPasswordHash(plainPassword);
        const trimmedHash = encryptionService.getUserPasswordHash((plainPassword || '').trim());
        const normalizedPlainPassword = (plainPassword || '').trim();
        const validProfile = matchingProfiles.find(profile => {
            const storedHash = profile.passwordHash || '';
            return storedHash === rawHash || storedHash === trimmedHash || storedHash === plainPassword || storedHash === normalizedPlainPassword;
        });

        return validProfile ? new UserProfile(validProfile) : null;
    } catch (error) {
        console.error('Error verifying caregiver credentials:', error);
        return null;
    }
};

/**
 * Gets a user profile by ID
 * @param {string} id - the user profile ID
 * @return {Promise<UserProfile|null>} resolves to the user profile or null if not found
 */
caregiverDataService.getUserProfile = async function (id) {
    try {
        const profile = await databaseService.getSingleObject(UserProfile, id);
        return profile ? new UserProfile(profile) : null;
    } catch (error) {
        console.error('Error getting user profile:', error);
        return null;
    }
};

/**
 * Gets all caregiver profiles
 * @return {Promise<UserProfile[]>} resolves to array of caregiver profiles
 */
caregiverDataService.getAllCaregivers = async function () {
    try {
        const allProfiles = await databaseService.getObject(UserProfile);
        if (!allProfiles) {
            return [];
        }
        
        const profilesArray = Array.isArray(allProfiles) ? allProfiles : [allProfiles];
        return profilesArray
            .filter(profile => profile.role === 'caregiver')
            .map(profile => new UserProfile(profile));
    } catch (error) {
        console.error('Error getting all caregivers:', error);
        return [];
    }
};

/**
 * Gets all students associated with a caregiver
 * @param {string} caregiverId - the caregiver ID
 * @return {Promise<UserProfile[]>} resolves to array of student profiles
 */
caregiverDataService.getCaregiverStudents = async function (caregiverId) {
    try {
        const caregiver = await caregiverDataService.getUserProfile(caregiverId);
        if (!caregiver || !caregiver.studentIds || caregiver.studentIds.length === 0) {
            return [];
        }
        
        const allProfiles = await databaseService.getObject(UserProfile);
        if (!allProfiles) {
            return [];
        }
        
        const profilesArray = Array.isArray(allProfiles) ? allProfiles : [allProfiles];
        return profilesArray
            .filter(profile => caregiver.studentIds.includes(profile.id))
            .map(profile => new UserProfile(profile));
    } catch (error) {
        console.error('Error getting caregiver students:', error);
        return [];
    }
};

/**
 * Saves a suggested word to the database
 * @param {SuggestedWord} suggestedWord - the suggested word to save
 * @return {Promise} resolves when save is complete
 */
caregiverDataService.saveSuggestedWord = function (suggestedWord) {
    upsertLocalSuggestedWord(suggestedWord);
    return databaseService.saveObject(SuggestedWord, suggestedWord).catch((error) => {
        console.warn('Database save failed for suggested word, using local fallback.', error);
        return Promise.resolve();
    });
};

/**
 * Gets all suggested words from the database
 * @return {Promise<SuggestedWord[]>} resolves to array of suggested words
 */
caregiverDataService.getAllSuggestedWords = async function () {
    try {
        let dbWords = [];
        try {
            const allWords = await databaseService.getObject(SuggestedWord);
            const wordsArray = Array.isArray(allWords) ? allWords : allWords ? [allWords] : [];
            dbWords = wordsArray;
        } catch (dbError) {
            console.warn('Unable to read suggested words from database. Using local fallback.', dbError);
        }

        const localWords = getLocalSuggestedWords();
        const mergedWords = mergeSuggestedWords(dbWords, localWords);

        if (dbWords.length) {
            saveLocalSuggestedWords(mergedWords);
        }

        return mergedWords.map(word => new SuggestedWord(word));
    } catch (error) {
        console.error('Error getting all suggested words:', error);
        return getLocalSuggestedWords().map(word => new SuggestedWord(word));
    }
};

/**
 * Searches suggested words by label or description
 * @param {string} searchTerm - the search term
 * @return {Promise<SuggestedWord[]>} resolves to array of matching suggested words
 */
caregiverDataService.searchSuggestedWords = async function (searchTerm) {
    try {
        const allWords = await caregiverDataService.getAllSuggestedWords();
        if (!searchTerm || searchTerm.trim() === '') {
            return allWords;
        }
        
        const lowerSearchTerm = searchTerm.toLowerCase();
        const localMatches = allWords.filter(word => {
            const tags = (word.tags || []).join(' ').toLowerCase();
            return textIncludesSearch(word.label, lowerSearchTerm) ||
                   textIncludesSearch(word.description, lowerSearchTerm) ||
                   tags.includes(lowerSearchTerm);
        });

        const apiWords = await getApiSuggestedWords(searchTerm);
        return mergeSuggestedWords(localMatches, apiWords).map(word => new SuggestedWord(word));
    } catch (error) {
        console.error('Error searching suggested words:', error);
        return [];
    }
};

/**
 * Deletes a user profile from the database
 * @param {string} id - the user profile ID to delete
 * @return {Promise} resolves when deletion is complete
 */
caregiverDataService.deleteUserProfile = function (id) {
    return databaseService.removeObject(id);
};

/**
 * Deletes a suggested word from the database
 * @param {string} id - the suggested word ID to delete
 * @return {Promise} resolves when deletion is complete
 */
caregiverDataService.deleteSuggestedWord = function (id) {
    const existing = getLocalSuggestedWords();
    saveLocalSuggestedWords(existing.filter(word => word.id !== id));
    return databaseService.removeObject(id).catch(() => Promise.resolve());
};

/**
 * Updates a caregiver's student list
 * @param {string} caregiverId - the caregiver ID
 * @param {string[]} studentIds - array of student IDs
 * @return {Promise} resolves when update is complete
 */
caregiverDataService.updateCaregiverStudents = async function (caregiverId, studentIds) {
    try {
        const caregiver = await caregiverDataService.getUserProfile(caregiverId);
        if (!caregiver) {
            throw new Error('Caregiver not found');
        }
        
        caregiver.studentIds = studentIds;
        await caregiverDataService.saveUserProfile(caregiver);
        return Promise.resolve();
    } catch (error) {
        console.error('Error updating caregiver students:', error);
        return Promise.reject(error);
    }
};

/**
 * Gets a student profile by PIN
 * @param {string} pin - student PIN
 * @return {Promise<UserProfile|null>} resolves to student profile or null
 */
caregiverDataService.getStudentByPin = async function (pin) {
    try {
        const normalizedPin = (pin || '').trim();
        if (!normalizedPin) {
            return null;
        }
        const allProfiles = await databaseService.getObject(UserProfile);
        if (!allProfiles) {
            return null;
        }
        const profilesArray = Array.isArray(allProfiles) ? allProfiles : [allProfiles];
        const student = profilesArray.find(
            profile => profile.role === 'student' && (profile.pin || '').trim() === normalizedPin
        );
        return student ? new UserProfile(student) : null;
    } catch (error) {
        console.error('Error getting student by PIN:', error);
        return null;
    }
};

/**
 * Adds a student to caregiver by student PIN
 * @param {string} caregiverId - caregiver ID
 * @param {string} pin - student PIN
 * @return {Promise<UserProfile>} resolves to linked student profile
 */
caregiverDataService.addStudentToCaregiverByPin = async function (caregiverId, pin) {
    const caregiver = await caregiverDataService.getUserProfile(caregiverId);
    if (!caregiver || caregiver.role !== 'caregiver') {
        throw new Error('Caregiver not found');
    }

    const student = await caregiverDataService.getStudentByPin(pin);
    if (!student) {
        throw new Error('Student not found');
    }

    const currentStudentIds = Array.isArray(caregiver.studentIds) ? caregiver.studentIds : [];
    if (!currentStudentIds.includes(student.id)) {
        currentStudentIds.push(student.id);
        caregiver.studentIds = currentStudentIds;
        caregiver.lastModified = Date.now();
        await caregiverDataService.saveUserProfile(caregiver);
    }

    if (student.caregiverId !== caregiverId) {
        student.caregiverId = caregiverId;
        student.lastModified = Date.now();
        await caregiverDataService.saveUserProfile(student);
    }

    return student;
};

/**
 * Removes a linked student from caregiver
 * @param {string} caregiverId - caregiver ID
 * @param {string} studentId - student ID
 * @return {Promise<void>}
 */
caregiverDataService.removeStudentFromCaregiver = async function (caregiverId, studentId) {
    const caregiver = await caregiverDataService.getUserProfile(caregiverId);
    if (!caregiver || caregiver.role !== 'caregiver') {
        throw new Error('Caregiver not found');
    }

    const currentStudentIds = Array.isArray(caregiver.studentIds) ? caregiver.studentIds : [];
    caregiver.studentIds = currentStudentIds.filter(id => id !== studentId);
    caregiver.lastModified = Date.now();
    await caregiverDataService.saveUserProfile(caregiver);

    const student = await caregiverDataService.getUserProfile(studentId);
    if (student && student.caregiverId === caregiverId) {
        student.caregiverId = null;
        student.lastModified = Date.now();
        await caregiverDataService.saveUserProfile(student);
    }
};

export { caregiverDataService };
