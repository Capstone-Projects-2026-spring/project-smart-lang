import $ from "./externals/jquery.js";
import Navigo from "navigo";

import { dataService } from "./service/data/dataService.js";

import GridView from "../vue-components/views/gridView.vue";
import LoginView from "../vue-components/views/loginView.vue";
import { databaseService } from "./service/data/databaseService";
import { localStorageService } from "./service/data/localStorageService";
import { MainVue } from "./vue/mainVue";
import { constants } from "./util/constants.js";
import { urlParamService } from "./service/urlParamService";
import { i18nService } from "./service/i18nService";
import { authService } from "./service/authService";

let Router = {};
let navigoInstance = null;
let injectId = null;
let lastHash = null;
let routingEndabled = true;
let _initialized = false;
let _currentView = null;
let _currentVueApp = null;
let _gridHistory = [];
let _locked = false;

Router.VIEWS = {
  GridView: GridView,
  LoginView: LoginView,
};

Router.init = function (injectIdParam, initialHash) {
  if (!routingEndabled) {
    return;
  }
  _initialized = true;
  injectId = injectIdParam;
  navigoInstance = new Navigo(null, true);
  navigoInstance.on({
    login: function () {
      loadVueView(LoginView, {}, "#login");
    },
    main: function () {
      toMainInternal();
    },
    "grid/:gridId": function (params, query) {
      log.debug("route grid with ID: " + params.gridId);
      let passParams = urlParamService.getSearchQueryParams(params);
      loadVueView(GridView, passParams, "#main");
    },
    "grid/name/:gridName": function (params) {
      log.debug("route grid with Name: " + params.gridName);
      dataService.getGrids().then((result) => {
        let gridsWithName = result.filter(
          (grid) => i18nService.getTranslation(grid.label) === params.gridName,
        );
        let id = gridsWithName[0] ? gridsWithName[0].id : null;
        if (id) {
          loadVueView(
            GridView,
            {
              gridId: id,
            },
            "#main",
          );
        } else {
          log.warn(`no grid with name ${params.gridName} found!`);
          toMainInternal();
        }
      });
    },
    "*": function () {
      Router.toMain();
    },
  });
  navigoInstance.hooks({
    before: function (done, params) {
      let hash = location.hash;
      $(document).trigger(constants.EVENT_NAVIGATE);
      let validForLocked =
        hash.startsWith("#main") || hash.startsWith("#grid/") || hash.startsWith("#login");
      if (_locked && !validForLocked) {
        done(constants.IS_SAFARI ? undefined : false);
        if (constants.IS_SAFARI) {
          return setTimeout(() => {
            Router.toMain();
          }, 100);
        }
        return Router.toMain();
      }
      if (_currentView && _currentView.destroy) {
        _currentView.destroy();
        _currentView = null;
      }
      if (_currentVueApp) {
        _currentVueApp.$destroy();
      }
      let validHash = getValidHash();
      if (location.hash !== validHash) {
        done(false);
        Router.to(validHash);
      } else {
        done();
      }
    },
    after: function (params) {},
    leave: function (params) {},
  });
  if (initialHash) {
    Router.to(initialHash);
  }
  navigoInstance.resolve();
};

Router.isInitialized = function () {
  return _initialized;
};

Router.to = function (hash, options) {
  options = options || {};
  lastHash = options.reset ? null : location.hash;
  let url = getFullUrl(hash);
  if (options.noHistory) {
    location.replace(url);
  } else {
    location.assign(url);
  }
};

Router.toMain = function () {
  Router.to("#main" + "?date=" + new Date().getTime());
};

Router.toLastOpenedGrid = function () {
  dataService.getMetadata().then((metadata) => {
    Router.toGrid(metadata.lastOpenedGridId);
  });
};

Router.toGrid = function (id, props) {
  if (id) {
    Router.addToGridHistory(id);
    props = props || {};
    urlParamService.setParamsToSearchQuery(props);
    let hash = `#grid/${id}`;

    if (_currentView === GridView) {
      dataService.getGrid(id, false, true).then((gridData) => {
        if (!gridData) {
          return;
        }
        if (history && history.replaceState) {
          history.replaceState(null, null, getFullUrl(`#grid/${id}`));
        }
        $(document).trigger(constants.EVENT_NAVIGATE_GRID_IN_VIEWMODE, [
          gridData,
          props,
        ]);
      });
    } else {
      let noHistory = location.hash.startsWith("#main");
      Router.to(hash, { noHistory: noHistory });
    }
  }
};

Router.back = function () {
  if (lastHash && lastHash !== location.hash) {
    Router.to(lastHash, { reset: true });
  } else {
    this.toMain();
  }
};

Router.isOnGridView = function () {
  return window.location.hash.indexOf("#grid/") !== -1;
};

Router.isOnEditPage = function () {
  return false;
};

Router.toEditGrid = function (gridId) {
  // No edit mode in stripped app — just navigate to the grid in view mode
  Router.toGrid(gridId);
};

Router.toLogin = function () {
  Router.to("#login");
};

Router.getCurrentView = function () {
  return _currentView;
};

Router.addToGridHistory = function (gridId) {
  if (
    _gridHistory.length > 0 &&
    _gridHistory[_gridHistory.length - 1] === gridId
  ) {
    return;
  }
  if (_gridHistory.indexOf(gridId) !== -1) {
    _gridHistory = [gridId];
    return;
  }
  _gridHistory.push(gridId);
};

Router.toLastGrid = function () {
  if (_gridHistory.length === 1) {
    return;
  }
  _gridHistory.pop();
  let toId = _gridHistory.pop();
  Router.toGrid(toId);
};

function getValidHash() {
  return location.hash || "#login";
}

function getHash() {
  let hash = location.hash;
  let index = hash.lastIndexOf("/");
  index = index > -1 ? index : hash.length;
  return hash.substring(0, index);
}

function getFullUrl(hash) {
  return location.origin + location.pathname + location.search + hash;
}

function loadVueView(viewObject, properties, menuItemToHighlight) {
  if (!routingEndabled) {
    return;
  }

  _currentView = viewObject;
  if (viewObject !== GridView) {
    $("#touchElement").hide();
  }

  setMenuItemSelected(menuItemToHighlight || getHash());
  log.debug("loading view: " + viewObject.__file);
  MainVue.setViewComponent(viewObject, properties);
}

function setMenuItemSelected(hash) {
  $("nav button").removeClass("selected");
  $(`nav a[href='${hash}'] button`).addClass("selected");
}

function toMainInternal() {
  if (!routingEndabled) {
    return;
  }
  if (!authService.isLoggedIn()) {
    loadVueView(LoginView, {}, "#login");
    return;
  }
  dataService.getMetadata().then((metadata) => {
    let gridId = metadata
      ? metadata.homeGridId || metadata.lastOpenedGridId
      : null;
    if (gridId) {
      return Router.toGrid(gridId);
    }
    loadVueView(GridView);
  });
}

$(document).on(constants.EVENT_UI_LOCKED, () => {
  _locked = true;
});

$(document).on(constants.EVENT_UI_UNLOCKED, () => {
  _locked = false;
});

export { Router };
