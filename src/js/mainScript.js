import $ from "./externals/jquery.js";
import { localStorageService } from "./service/data/localStorageService.js";
import { Router } from "./router.js";
import { VuePluginManager } from "./vue/vuePluginManager";
import { MainVue } from "./vue/mainVue";

import "./../css/gridlist.css";
import "./../css/jquery.contextMenu.css";
import "./../css/holy-grail.css";
import { loginService } from "./service/loginService";
import { constants } from "./util/constants";
import { keyboardShortcuts } from "./service/keyboardShortcuts";
import { notificationService } from "./service/notificationService.js";
import { dataService } from "./service/data/dataService";
import { predictionService } from "./service/predictionService";

const TARGET_GRIDSET_FILENAME = "Global-Core_Communicator_ARASAAC_EN.grd.json";
// TODO: replace with self-hosted board repository URL
const GRIDSET_URL =
  "https://asterics.github.io/AsTeRICS-Grid-Boards/communicators/Global-Core%20Communicator%20ARASAAC/en/Global-Core_Communicator_ARASAAC_EN.grd.json";
const AAC_USERNAME = "aac-user";

async function init() {
  log.setLevel(log.levels.INFO);
  log.info("AAC Communicator starting...");
  initServiceWorker();
  VuePluginManager.init();
  keyboardShortcuts.init();
  notificationService.init();
  await MainVue.init();

  let autologinUser = localStorageService.getAutologinUser();

  if (autologinUser) {
    // User already exists, just login
    await loginService.loginStoredUser(autologinUser, true);
  } else {
    // First launch: create offline user
    await loginService.registerOffline(AAC_USERNAME, AAC_USERNAME);
    autologinUser = AAC_USERNAME;
  }

  // Always check if grids exist — import if missing (handles failed first imports)
  let grids = await dataService.getGrids();
  if (!grids || grids.length === 0) {
    log.info("No grids found, importing default gridset...");
    await importDefaultGridset();
  }

  // Init prediction engine (loads n-gram model from localStorage)
  await predictionService.init();
  log.info("Prediction service initialized.");

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
