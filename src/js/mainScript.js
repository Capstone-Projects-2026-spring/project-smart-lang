import $ from "./externals/jquery.js";
import { localStorageService } from "./service/data/localStorageService.js";
import { Router } from "./router.js";
import { VuePluginManager } from "./vue/vuePluginManager";
import { MainVue } from "./vue/mainVue";

import "./../css/gridlist.css";
import "./../css/jquery.contextMenu.css";
import "./../css/holy-grail.css";
import { loginService } from "./service/loginService";
import { authService } from "./service/authService";
import { constants } from "./util/constants";
import { keyboardShortcuts } from "./service/keyboardShortcuts";
import { notificationService } from "./service/notificationService.js";
import { dataService } from "./service/data/dataService";
import { predictionService } from "./service/predictionService";
import { firestoreSyncService } from "./service/firestoreSyncService";

const TARGET_GRIDSET_FILENAME = "Global-Core_Communicator_ARASAAC_EN.grd.json";
const GRIDSET_URL = "app/gridsets/" + TARGET_GRIDSET_FILENAME;
const OAUTH_DB_PREFIX = "oauth-";
let _isApplyingCloudBoard = false;

async function init() {
  log.setLevel(log.levels.INFO);
  log.info("AAC Communicator starting...");
  initServiceWorker();
  VuePluginManager.init();
  keyboardShortcuts.init();
  notificationService.init();
  await MainVue.init();

  // If user is not authenticated, redirect to login page
  if (!authService.isLoggedIn()) {
    if (!Router.isInitialized()) {
      Router.init("#injectView", "#login");
    }
    return;
  }

  let autologinUser = getOauthLocalDbUser();
  if (!autologinUser) {
    throw new Error(
      "No authenticated user UID found for local database setup.",
    );
  }
  localStorageService.setAutologinUser(autologinUser);
  if (localStorageService.isSavedLocalUser(autologinUser)) {
    await loginService.loginStoredUser(autologinUser, true);
  } else {
    await loginService.registerOffline(autologinUser, autologinUser);
  }

  // Always check if grids exist — import if missing (handles failed first imports)
  let grids = await dataService.getGrids();
  if (!grids || grids.length === 0) {
    log.info("No grids found, importing default gridset...");
    await importDefaultGridset();
  }

  // Cache pictogram images as base64 in PouchDB for reliable offline use.
  // Runs in the background — does not block app startup.
  dataService
    .cacheAllImageData()
    .catch((e) => log.warn("Image data caching failed:", e));

  // Init prediction engine (loads n-gram model from localStorage)
  await predictionService.init();
  log.info("Prediction service initialized.");

  // === Cloud Sync: Firestore integration ===
  await initCloudSync();

  localStorageService.setLastActiveUser(autologinUser);
  if (!Router.isInitialized()) {
    Router.init("#injectView", "#main");
  }
}

async function importDefaultGridset() {
  // Directly construct the preview object instead of relying on boardService metadata
  // (dev mode uses beta metadata which may not contain the target gridset)
  let preview = {
    filename: TARGET_GRIDSET_FILENAME,
    url: GRIDSET_URL,
    generateGlobalGrid: false,
    translate: false,
  };
  try {
    await dataService.importBackupFromPreview(preview);
    log.info("Default gridset imported successfully.");
  } catch (e) {
    log.error("Failed to import default gridset:", e);
  }
}

/**
 * Initializes Firestore cloud sync based on user role.
 * - Caregivers: register their profile in Firestore
 * - Students: register their profile and listen for board pushes from caregivers
 */
async function initCloudSync() {
  try {
    if (authService.isCaregiver()) {
      await firestoreSyncService.ensureCaregiverProfile();
      log.info("Caregiver profile synced to Firestore.");
    } else if (authService.isStudent()) {
      let studentId = await firestoreSyncService.ensureStudentProfile();
      if (!studentId) {
        studentId = firestoreSyncService.getCurrentStudentId();
      }
      log.info("Student profile synced to Firestore.");
      if (studentId) {
        let syncSequenceKey = `SMART_LANG_LAST_BOARD_SYNC_${studentId}`;
        let getLastAppliedSequence = () => {
          return Number(localStorage.getItem(syncSequenceKey) || "0");
        };
        let getIncomingSequence = (assignmentData) => {
          let version = Number(assignmentData?.version || 0);
          if (version > 0) {
            return version;
          }
          return assignmentData?.updatedAt
            ? assignmentData.updatedAt.toMillis()
            : 0;
        };
        let applyAssignmentIfNew = async (assignmentData, reloadOnSuccess) => {
          if (!assignmentData || _isApplyingCloudBoard) return;
          let hasPayload = assignmentData.visibilityConfig || assignmentData.boardData;
          if (!hasPayload) return;

          let incomingSequence = getIncomingSequence(assignmentData);
          if (incomingSequence <= getLastAppliedSequence()) return;

          _isApplyingCloudBoard = true;
          try {
            if (assignmentData.type === "visibility" && assignmentData.visibilityConfig) {
              await applyVisibilityConfig(assignmentData.visibilityConfig);
            } else if (assignmentData.boardData) {
              // Legacy: full board import from before visibility-only approach
              await dataService.importBackupData(assignmentData.boardData, { skipDelete: false });
            }
            localStorage.setItem(syncSequenceKey, String(incomingSequence));
            if (reloadOnSuccess) window.location.reload();
          } finally {
            _isApplyingCloudBoard = false;
          }
        };

        // Check for any existing assignment that's newer than our local state
        let assignment = await firestoreSyncService.getLatestBoardAssignment(studentId);
        await applyAssignmentIfNew(assignment, false);

        // Listen for future pushes from the caregiver
        firestoreSyncService.listenForBoardUpdates(
          studentId,
          async (assignmentData) => {
            await applyAssignmentIfNew(assignmentData, true);
          },
        );
        log.info("Listening for board updates from caregiver.");
      }
    }
  } catch (e) {
    log.warn("Cloud sync initialization failed (app will work offline):", e);
  }
}

/**
 * Applies a visibility config from the caregiver to the student's local grids.
 * The config is keyed by grid LABEL (not ID) because each device generates
 * different IDs when importing the same default gridset.
 * Each hidden element is described by { label, x, y } for unambiguous matching.
 *
 * @param {Object} visibilityConfig - { [gridLabel]: { label, x, y }[] }
 */
async function applyVisibilityConfig(visibilityConfig) {
  let grids = await dataService.getGrids(true);

  // Iterate over ALL local grids — not just grids in the config.
  // Grids absent from the config have zero hidden elements (everything visible).
  for (let grid of grids) {
    let label = getFirstLabel(grid.label);
    let hiddenElements = (label && visibilityConfig[label]) || [];

    // Build a set of hidden element keys for fast lookup
    let hiddenKeys = new Set(
      hiddenElements.map((h) => `${h.label || ""}|${h.x}|${h.y}`)
    );

    let changed = false;
    for (let elem of grid.gridElements || []) {
      let elemKey = `${getFirstLabel(elem.label)}|${elem.x}|${elem.y}`;
      let shouldHide = hiddenKeys.has(elemKey);
      if (!!elem.hidden !== shouldHide) {
        elem.hidden = shouldHide || undefined;
        changed = true;
      }
    }
    if (changed) {
      await dataService.saveGrid(grid);
    }
  }
}

/**
 * Extracts the first non-empty translation string from an i18n label object.
 * @param {Object|string} labelObj e.g. { en: "Hello" }
 * @returns {string}
 */
function getFirstLabel(labelObj) {
  if (!labelObj) return "";
  if (typeof labelObj === "string") return labelObj;
  for (let key of Object.keys(labelObj)) {
    if (labelObj[key]) return labelObj[key];
  }
  return "";
}

function getOauthLocalDbUser() {
  let uid = authService.getUid();
  if (!uid) {
    return null;
  }
  let normalizedUid = String(uid)
    .trim()
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .toLowerCase();
  if (!normalizedUid) {
    return null;
  }
  return `${OAUTH_DB_PREFIX}${normalizedUid}`;
}

init();

function initServiceWorker() {
  if (!constants.IS_ENVIRONMENT_PROD && !constants.FORCE_USE_SW) {
    log.warn(
      "Not installing Service Worker because on development environment.",
    );
    return;
  }
  if ("serviceWorker" in navigator) {
    if (window.loaded) {
      installServiceWorker();
    } else {
      window.addEventListener("load", () => {
        installServiceWorker();
      });
    }
  }

  function installServiceWorker() {
    if (!navigator.serviceWorker) {
      log.warn("ServiceWorker not supported!");
      return;
    }
    navigator.serviceWorker
      .register("./serviceWorker.js", {
        updateViaCache: "none",
      })
      .then((reg) => {
        setInterval(() => {
          log.debug("Check for serviceworker update...");
          reg.update();
        }, 1000 * 60 * 15);
      });
  }
}
