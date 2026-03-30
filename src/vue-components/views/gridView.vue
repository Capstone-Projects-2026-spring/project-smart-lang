<template>
  <div class="box" id="gridView" v-cloak>
    <header
      class="srow header"
      role="toolbar"
      v-if="metadata"
      v-show="!metadata.fullscreen"
    >
      <header-icon class="left"></header-icon>
      <div class="btn-group left"></div>
      <button
        tabindex="32"
        @click="systemActionService.enterFullscreen()"
        class="spaced small"
        :aria-label="$t('fullscreen')"
      >
        <i class="fas fa-expand" />
        <span class="hide-mobile">{{ $t("fullscreen") }}</span>
      </button>
      <div v-if="studentId" class="student-header-group">
        <span
          class="student-id-badge"
          @click="copyStudentId"
          :title="studentIdCopyTooltip"
          :aria-label="'Copy Student ID: ' + studentId"
        >
          ID: {{ studentId }}
          <i :class="studentIdCopied ? 'fas fa-check' : 'fas fa-copy'" class="copy-icon"></i>
        </span>
        <button
          class="student-logout-btn"
          @click="studentLogout"
          :aria-label="$t('logout')"
          :title="$t('logout')"
        >
          <i class="fas fa-sign-out-alt"></i>
        </button>
      </div>
    </header>
    <div class="srow content text-content" v-show="!renderGridData">
      <div class="grid-container grid-mask">
        <i class="fas fa-4x fa-spinner fa-spin" style="position: relative" />
      </div>
    </div>

    <direction-input-modal
      v-if="showModal === modalTypes.MODAL_DIRECTION"
      @close="
        showModal = null;
        reloadInputMethods();
      "
    />
    <mouse-modal
      v-if="showModal === modalTypes.MODAL_MOUSE"
      @close="
        showModal = null;
        reloadInputMethods();
      "
    />
    <unlock-modal
      v-if="showModal === modalTypes.MODAL_UNLOCK"
      @unlock="unlock(true)"
      @close="showModal = null"
    />

    <div
      class="srow content spaced"
      v-if="renderGridData && renderGridData.gridElements.length === 0"
    >
      <div style="margin-top: 2em">
        <span>No elements available.</span>
      </div>
    </div>
    <prediction-bar />
    <div
      class="srow content d-flex"
      v-if="renderGridData && renderGridData.gridElements.length > 0"
      style="min-height: 0"
    >
      <app-grid-display
        id="grid-container"
        :grid-data="renderGridData"
        :metadata="metadata"
        :elem-css-fn="
          (elem) =>
            gridUtil.getElemBackgroundCss(
              elem,
              renderGridData,
              globalGridData,
              metadata.colorConfig.gridBackgroundColor,
            )
        "
      />
    </div>
  </div>
</template>

<script>
import $ from "../../js/externals/jquery.js";
import { L } from "../../js/util/lquery.js";
import { actionService } from "../../js/service/actionService";
import { dataService } from "../../js/service/data/dataService";
import { Router } from "./../../js/router.js";
import { MetaData } from "../../js/model/MetaData.js";
import { urlParamService } from "../../js/service/urlParamService";

import { Clicker } from "../../js/input/clicking.js";
import { DirectionInput } from "../../js/input/directionInput";

import HeaderIcon from "../../vue-components/components/headerIcon.vue";
import { constants } from "../../js/util/constants";
import { i18nService } from "../../js/service/i18nService";
import { util } from "../../js/util/util";
import MouseModal from "../modals/input/mouseModal.vue";
import DirectionInputModal from "../modals/input/directionInputModal.vue";
import { speechService } from "../../js/service/speechService";
import { localStorageService } from "../../js/service/data/localStorageService";
import { imageUtil } from "../../js/util/imageUtil";
import { audioUtil } from "../../js/util/audioUtil.js";
import UnlockModal from "../modals/unlockModal.vue";
import { MainVue } from "../../js/vue/mainVue.js";
import { stateService } from "../../js/service/stateService.js";
import { systemActionService } from "../../js/service/systemActionService";
import AppGridDisplay from "../grid-display/appGridDisplay.vue";
import PredictionBar from "../components/predictionBar.vue";
import { gridUtil } from "../../js/util/gridUtil";
import { collectElementService } from "../../js/service/collectElementService";
import { predictionService } from "../../js/service/predictionService";
import { liveElementService } from "../../js/service/liveElementService";
import { GridElement } from "../../js/model/GridElement";
import { authService } from "../../js/service/authService";

let vueApp = null;
let UNLOCK_COUNT = 8;
let modalTypes = {
  MODAL_MOUSE: "MODAL_MOUSE",
  MODAL_DIRECTION: "MODAL_DIRECTION",
  MODAL_UNLOCK: "MODAL_UNLOCK",
};

let vueConfig = {
  props: {
    gridId: String,
    skipThumbnailCheck: Boolean,
  },
  data() {
    return {
      globalGridData: null,
      renderGridData: null,
      metadata: null,
      updatedMetadataDoc: null,
      clicker: null,
      directionInput: null,
      inputMethodsInitialized: false,
      showModal: null,
      modalTypes: modalTypes,
      unlockCount: UNLOCK_COUNT,
      unlockCounter: UNLOCK_COUNT,
      MainVue: MainVue,
      highlightTimeoutHandler: null,
      highlightedElementId: null,
      systemActionService: systemActionService,
      gridUtil: gridUtil,
      studentId: authService.isStudent() ? authService.getStudentId() : null,
      studentIdCopied: false,
    };
  },
  components: {
    AppGridDisplay,
    PredictionBar,
    UnlockModal,
    DirectionInputModal,
    MouseModal,
    HeaderIcon,
  },
  computed: {
    studentIdCopyTooltip() {
      return this.studentIdCopied ? 'Copied!' : 'Copy Student ID';
    },
  },
  methods: {
    copyStudentId() {
      if (this.studentId) {
        navigator.clipboard.writeText(this.studentId).then(() => {
          this.studentIdCopied = true;
          setTimeout(() => {
            this.studentIdCopied = false;
          }, 1500);
        }).catch(err => {
          console.error('Failed to copy student ID:', err);
        });
      }
    },
    async studentLogout() {
      const confirmed = await MainVue.showConfirmBox(
        'Are you sure you want to log-out?',
        {
          buttonPreset: constants.BUTTONS_YES_NO
        }
      );
      if (confirmed) {
        authService.logout();
        window.location.hash = '';
        window.location.reload();
      }
    },
    openModal(modalType) {
      this.showModal = modalType;
      stopInputMethods();
    },
    lock() {
      let thiz = this;
      thiz.metadata.locked = true;
      thiz.unlockCounter = UNLOCK_COUNT;
      dataService.saveMetadata(thiz.metadata).then(() => {
        this.setViewPropsLocked();
      });
    },
    unlock(force) {
      let thiz = this;
      if (!force && localStorageService.getAppSettings().unlockPasscode) {
        thiz.showModal = modalTypes.MODAL_UNLOCK;
        return;
      }
      thiz.unlockCounter--;
      util.debounce(function () {
        thiz.unlockCounter = UNLOCK_COUNT;
      }, 3000);
      if (thiz.unlockCounter === 0 || force) {
        thiz.metadata.locked = false;
        dataService.saveMetadata(thiz.metadata).then(() => {
          this.setViewPropsUnlocked();
        });
      }
    },
    setViewPropsLocked() {
      $(document).trigger(constants.EVENT_SIDEBAR_CLOSE);
      $(document).trigger(constants.EVENT_UI_LOCKED);
      $("#viewPortMeta").attr(
        "content",
        "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
      );
      $("#gridView").on("touchmove", this.preventZoomHandler);
    },
    setViewPropsUnlocked() {
      $(document).trigger(constants.EVENT_SIDEBAR_OPEN);
      $(document).trigger(constants.EVENT_UI_UNLOCKED);
      $("#viewPortMeta").attr("content", "width=device-width, initial-scale=1");
      $("body").attr("touch-action", "");
      $("#gridView").off("touchmove", this.preventZoomHandler);
    },
    preventZoomHandler(event) {
      event.preventDefault();
    },
    reloadInputMethods() {
      this.initInputMethods({ reload: true });
    },
    async initInputMethods(options = {}) {
      options.continueInputMethods = options.continueInputMethods || false;
      options.reload = options.reload || false;
      if (this.inputMethodsInitialized) {
        stopInputMethods();
      }
      if (options.reload) {
        let metadata = await dataService.getMetadata();
        this.metadata = JSON.parse(JSON.stringify(metadata));
        initContextmenu();
      }
      let thiz = this;
      let inputConfig = thiz.metadata.inputConfig;
      let selectionListener = (item) => {
        this.stopHighlightElements();
        L.removeAddClass(item, "selected");
        actionService.doAction(thiz.renderGridData, item.id);
      };
      let activeListener = (items, wrap, restarted) => {
        if (!Array.isArray(items)) {
          items = [items];
        }
        if (
          inputConfig.globalReadActive &&
          items &&
          items.length === 1 &&
          items[0]
        ) {
          let text = items[0].ariaLabel || "";
          let separatorIndex = text.indexOf(", ");
          if (
            !inputConfig.globalReadAdditionalActions &&
            separatorIndex !== -1 &&
            separatorIndex !== 0
          ) {
            text = text.substring(0, separatorIndex);
          }
          speechService.speak(text, {
            rate: inputConfig.globalReadActiveRate || 1,
          });
        }

        if (inputConfig.globalBeepFeedback) {
          if (restarted) {
            audioUtil.beepHighDouble();
          } else if (wrap) {
            audioUtil.beepHigh();
          } else {
            audioUtil.beep();
          }
        }
      };

      if (inputConfig.dirEnabled) {
        thiz.directionInput = DirectionInput.getInstanceFromConfig(
          inputConfig,
          '.element-container:not([data-empty="true"])',
          "scanFocus",
          selectionListener,
        );
        thiz.directionInput.start();
      }

      if (
        inputConfig.mouseclickEnabled ||
        inputConfig.mouseDoubleClickEnabled
      ) {
        thiz.clicker = Clicker.getInstanceFromConfig(
          inputConfig,
          ".element-container",
        );
        thiz.clicker.setSelectionListener(selectionListener);
        thiz.clicker.startClickcontrol();
      }
      this.inputMethodsInitialized = true;
    },
    async onNavigateEvent(event, gridData, params) {
      await this.loadGrid(gridData, { continueInputMethods: true });
    },
    async loadGrid(gridData, options = {}) {
      options.continueInputMethods = options.continueInputMethods || false;
      options.forceReload = options.forceReload || false;
      collectElementService.clearCollectElements();
      if (
        gridData &&
        (options.forceReload ||
          !this.renderGridData ||
          this.renderGridData.id !== gridData.id)
      ) {
        let updateThumbnail =
          gridUtil.hasOutdatedThumbnail(gridData) && !this.skipThumbnailCheck;
        let newHash = updateThumbnail ? gridUtil.getHash(gridData) : null;

        await this.recalculateRenderGrid(gridData);
        Router.addToGridHistory(this.renderGridData.id);

        if (updateThumbnail) {
          imageUtil.allImagesLoaded().then(async () => {
            let screenshot = await imageUtil.getScreenshot("#grid-container");
            let thumbnail = {
              data: screenshot,
              hash: newHash,
            };
            dataService.saveThumbnail(this.renderGridData.id, thumbnail);
          });
        }

        if (this.metadata.lastOpenedGridId !== gridData.id) {
          this.metadata.lastOpenedGridId = gridData.id;
          await dataService.saveMetadata(this.metadata);
        }
      }

      await this.$nextTick();
      initContextmenu();
      this.initInputMethods(options);
      this.highlightElements();
      await predictionService.initWithElements(
        this.renderGridData.gridElements,
      );
      collectElementService.initWithGrid(this.renderGridData);
      liveElementService.initWithElements(this.renderGridData.gridElements);
      $(document).trigger(constants.EVENT_GRID_LOADED);
    },
    highlightElements() {
      clearTimeout(this.highlightTimeoutHandler);
      let params = urlParamService.getSearchQueryParams();
      if (params.highlightIds) {
        $(`#${params.highlightIds[0]}`).addClass("highlight");
        this.highlightTimeoutHandler = setTimeout(() => {
          this.stopHighlightElements();
        }, 15000);
        this.highlightedElementId = params.highlightIds[0];
        params.highlightIds.shift();
        params.highlightIds =
          params.highlightIds.length > 0 ? params.highlightIds : null;
        urlParamService.setParamsToSearchQuery(params);
      }
    },
    stopHighlightElements() {
      if (this.highlightedElementId) {
        $(`#${this.highlightedElementId}`).removeClass("highlight");
        this.highlightedElementId = null;
      }
    },
    async onExternalUpdate(event, updatedIds, updatedDocs, deletedIds) {
      let thiz = this;
      if (!vueApp) {
        setTimeout(() => {
          thiz.onExternalUpdate(event, updatedIds, updatedDocs);
        }, 500);
        return;
      }
      if (deletedIds.includes(vueApp.gridId)) {
        Router.toMain();
        return;
      }
      log.debug("got update event, ids updated:" + updatedIds);
      let updatedGridDoc = updatedDocs.filter(
        (doc) => vueApp.renderGridData && doc.id === vueApp.renderGridData.id,
      )[0];
      let hasUpdatedGlobalGrid =
        updatedDocs.filter(
          (doc) => this.metadata && doc.id === this.metadata.globalGridId,
        ).length > 0;
      this.updatedMetadataDoc =
        updatedDocs.filter(
          (doc) => vueApp.metadata && doc.id === vueApp.metadata.id,
        )[0] || this.updatedMetadataDoc;
      if (updatedGridDoc) {
        vueApp.loadGrid(updatedGridDoc, {
          continueInputMethods: true,
          forceReload: true,
        });
      } else if (hasUpdatedGlobalGrid) {
        let gridData = await dataService.getGrid(
          vueApp.renderGridData.id,
          false,
          true,
        );
        this.globalGridData = await dataService.getGlobalGrid();
        vueApp.loadGrid(gridData, {
          continueInputMethods: true,
          forceReload: true,
        });
      }
      if (localStorageService.getAppSettings().syncNavigation) {
        if (
          this.updatedMetadataDoc &&
          this.updatedMetadataDoc.lastOpenedGridId !== vueApp.renderGridData.id
        ) {
          dataService
            .getGrid(this.updatedMetadataDoc.lastOpenedGridId)
            .then((toGrid) => {
              if (!gridUtil.hasOutdatedThumbnail(toGrid)) {
                Router.toLastOpenedGrid();
              }
            });
          return;
        }
        if (
          this.updatedMetadataDoc &&
          this.updatedMetadataDoc.fullscreen !== vueApp.metadata.fullscreen
        ) {
          if (this.updatedMetadataDoc.fullscreen) {
            systemActionService.enterFullscreen(true);
          } else {
            $(document).trigger(constants.EVENT_SIDEBAR_OPEN);
          }
        }
        if (
          this.updatedMetadataDoc &&
          this.updatedMetadataDoc.locked !== vueApp.metadata.locked
        ) {
          if (this.updatedMetadataDoc.locked) {
            vueApp.lock();
          } else {
            vueApp.unlock(true);
          }
        }
      }
      this.metadata = this.updatedMetadataDoc || this.metadata;
    },
    async recalculateRenderGrid(gridData) {
      let globalGrid = null;
      gridData = gridUtil.fillFreeSpaces(
        gridData,
        GridElement.ELEMENT_TYPE_UI_FILLER,
      );
      if (gridUtil.hasDynamicGridPlaceholder(this.globalGridData)) {
        this.globalGridData = gridUtil.fillFreeSpaces(
          this.globalGridData,
          GridElement.ELEMENT_TYPE_UI_FILLER,
        );
      }
      if (gridData.showGlobalGrid) {
        globalGrid = this.globalGridData;
        if (gridData.globalGridId) {
          globalGrid = await dataService.getGrid(
            gridData.globalGridId,
            false,
            true,
          );
        }
        this.renderGridData = gridUtil.mergeGrids(gridData, globalGrid, {
          globalGridHeightPercentage: this.metadata.globalGridHeightPercentage,
          noDeepCopy: true,
        });
      } else {
        this.renderGridData = gridData;
      }
      this.renderGridData = gridUtil.adaptFirstRowHeight(
        this.renderGridData,
        this.metadata.firstRowHeightFactor,
      );
      this.renderGridData.minColumnCount = gridUtil.getWidthWithBounds(
        this.renderGridData,
      );
      this.renderGridData.rowCount = gridUtil.getHeightWithBounds(
        this.renderGridData,
      );
      this.renderGridData.gridElements =
        this.renderGridData.gridElements.filter((e) => !e.hidden);

      let isToggled = localStorageService.get(
        localStorageService.KEY_CURRENT_TOGGLE_LEVEL,
      );
      let effectiveLevel = isToggled
        ? localStorageService.getJSON(
            localStorageService.KEY_CURRENT_TOGGLE_LEVEL,
          )
        : this.metadata.vocabularyLevel;

      if (effectiveLevel) {
        let globalGridElements = globalGrid ? globalGrid.gridElements : [];
        let globalGridElemIds = globalGridElements.map((e) => e.id);
        let normalGridElements = this.renderGridData.gridElements.filter(
          (e) => !globalGridElemIds.includes(e.id),
        );
        let noneHasVocabLevelGlobal = globalGridElements.every(
          (e) => !e.vocabularyLevel,
        );
        let noneHasVocabLevelNormal = normalGridElements.every(
          (e) => !e.vocabularyLevel,
        );
        this.renderGridData.gridElements =
          this.renderGridData.gridElements.filter((e) => {
            let elemFitsVocabLevel =
              e.vocabularyLevel && e.vocabularyLevel <= effectiveLevel;
            if (globalGridElemIds.includes(e.id)) {
              return (
                noneHasVocabLevelGlobal ||
                elemFitsVocabLevel ||
                e.type !== GridElement.ELEMENT_TYPE_NORMAL
              );
            } else {
              return (
                noneHasVocabLevelNormal ||
                elemFitsVocabLevel ||
                e.type !== GridElement.ELEMENT_TYPE_NORMAL
              );
            }
          });
      }
      stateService.setCurrentGrid(this.renderGridData);
    },
    onSidebarOpen() {
      if (!vueApp || !vueApp.metadata) {
        return;
      }
      vueApp.metadata.fullscreen = false;
      $(document).trigger(constants.EVENT_GRID_RESIZE);
    },
    resizeListener() {
      util.debounce(function () {}, 500);
    },
    contextMenuListener(event) {
      event.preventDefault();
    },
    async metadataUpdated() {
      this.metadata = await dataService.getMetadata();
    },
    async rerenderGrid() {
      if (this.renderGridData) {
        let freshGridData = await dataService.getGrid(this.renderGridData.id);
        await this.loadGrid(freshGridData, { forceReload: true });
      }
    },
  },
  created() {
    $(document).on(constants.EVENT_DB_PULL_UPDATED, this.onExternalUpdate);
    $(document).on(constants.EVENT_SIDEBAR_OPEN, this.onSidebarOpen);
    $(document).on(
      constants.EVENT_NAVIGATE_GRID_IN_VIEWMODE,
      this.onNavigateEvent,
    );
    document.addEventListener("contextmenu", this.contextMenuListener);
    window.addEventListener("resize", this.resizeListener, true);
    $(document).on(constants.EVENT_GRID_RESIZE, this.resizeListener);
    $(document).on(constants.EVENT_METADATA_UPDATED, this.metadataUpdated);
    $(document).on(constants.EVENT_GRID_RERENDER, this.rerenderGrid);
  },
  beforeDestroy() {
    $(document).off(constants.EVENT_DB_PULL_UPDATED, this.onExternalUpdate);
    $(document).off(constants.EVENT_SIDEBAR_OPEN, this.onSidebarOpen);
    $(document).off(
      constants.EVENT_NAVIGATE_GRID_IN_VIEWMODE,
      this.onNavigateEvent,
    );
    document.removeEventListener("contextmenu", this.contextMenuListener);
    window.removeEventListener("resize", this.resizeListener, true);
    $(document).off(constants.EVENT_GRID_RESIZE, this.resizeListener);
    $(document).off(constants.EVENT_METADATA_UPDATED, this.metadataUpdated);
    $(document).off(constants.EVENT_GRID_RERENDER, this.rerenderGrid);
    stopInputMethods();
    this.setViewPropsUnlocked();
    $.contextMenu("destroy");
    liveElementService.stop();
    vueApp = null;
  },
  mounted: async function () {
    vueApp = this;

    let savedMetadata = await dataService.getMetadata();
    let metadata = JSON.parse(JSON.stringify(savedMetadata || new MetaData()));
    metadata.lastOpenedGridId = this.gridId;
    metadata.locked = metadata.locked === undefined ? false : metadata.locked;
    if (metadata.locked) {
      $(document).trigger(constants.EVENT_UI_LOCKED);
    }
    metadata.fullscreen =
      metadata.fullscreen === undefined ? false : metadata.fullscreen;
    metadata.fullscreen = urlParamService.isFullscreen(true)
      ? true
      : metadata.fullscreen;
    metadata.locked = urlParamService.isLocked(true) ? true : metadata.locked;
    metadata.inputConfig.dirEnabled = urlParamService.isDirectionEnabled()
      ? true
      : metadata.inputConfig.dirEnabled;
    dataService.saveMetadata(metadata).then(() => {
      if (metadata.locked) {
        this.setViewPropsLocked();
      }
    });
    this.metadata = metadata;
    this.globalGridData = await dataService.getGlobalGrid();
    let gridData = await dataService.getGrid(this.gridId, false, true);
    if (!gridData) {
      log.warn("grid not found! gridId: " + this.gridId);
      let grids = await dataService.getGrids(false, true);
      if (grids && grids[0]) {
        gridData = await dataService.getGrid(grids[0].id);
      } else {
        log.warn("no grids available");
        return;
      }
    }
    this.loadGrid(gridData);
  },
};

function stopInputMethods() {
  if (!vueApp) {
    return;
  }
  if (vueApp.clicker) vueApp.clicker.destroy();
  if (vueApp.directionInput) vueApp.directionInput.destroy();
  vueApp.inputMethodsInitialized = false;
}

function initContextmenu() {
  $.contextMenu("destroy");
  let CONTEXT_MOUSE = "CONTEXT_MOUSE";
  let CONTEXT_DIRECTION = "CONTEXT_DIRECTION";

  function getName(i18nKey, isActive) {
    let translated = i18nService.t(i18nKey);
    let activeText = isActive ? " " + i18nService.t("activeBracket") : "";
    return `${translated}${activeText}`;
  }

  let inputConfig = vueApp.metadata.inputConfig;
  let mouseTouchEnabled = inputConfig.mouseclickEnabled;
  let contextItems = {
    CONTEXT_MOUSE: {
      name: getName("mousetouchInput", mouseTouchEnabled),
      icon: "fas fa-mouse-pointer",
      className: mouseTouchEnabled ? "boldFont" : "",
    },
    CONTEXT_DIRECTION: {
      name: getName("directionInput", inputConfig.dirEnabled),
      icon: "fas fa-arrows-alt",
      className: inputConfig.dirEnabled ? "boldFont" : "",
    },
  };

  $.contextMenu({
    selector: "#inputConfigButton",
    appendTo: "#inputConfigMenu",
    callback: function (key, options) {
      handleContextMenu(key);
    },
    trigger: "left",
    items: contextItems,
    zIndex: 10,
  });

  function handleContextMenu(key, elementId) {
    switch (key) {
      case CONTEXT_MOUSE: {
        vueApp.openModal(modalTypes.MODAL_MOUSE);
        break;
      }
      case CONTEXT_DIRECTION: {
        vueApp.openModal(modalTypes.MODAL_DIRECTION);
        break;
      }
    }
  }
}

export default vueConfig;
</script>

<style scoped>
.student-header-group {
  display: flex;
  align-items: center;
  margin-left: auto;
  margin-right: 0.5em;
  gap: 0.4em;
}

.student-id-badge {
  display: flex;
  align-items: center;
  gap: 0.4em;
  font-size: 0.72em;
  color: #666;
  font-family: monospace;
  letter-spacing: 0.05em;
  padding: 0.35em 0.6em;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #f9f9f9;
  cursor: pointer;
  transition: all 0.15s;
  user-select: none;
}

.student-id-badge:hover {
  background: #e8f4fd;
  border-color: #3498db;
  color: #3498db;
}

.student-id-badge .copy-icon {
  font-size: 0.9em;
  opacity: 0.6;
}

.student-id-badge:hover .copy-icon {
  opacity: 1;
}

.student-logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.3em 0.5em;
  font-size: 0.85em;
  color: #e74c3c;
  background: transparent;
  border: 1px solid #e74c3c;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.15s, color 0.15s;
}

.student-logout-btn:hover,
.student-logout-btn:focus {
  background: #e74c3c;
  color: #fff;
}

.student-logout-btn:focus {
  outline: 2px solid #c0392b;
  outline-offset: 2px;
}
</style>
