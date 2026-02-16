import $ from '../externals/jquery.js';
import Vue from 'vue';
import VueI18n from 'vue-i18n';
import { i18nService } from '../service/i18nService';
import { constants } from '../util/constants';
import { util } from '../util/util';
import { inputEventHandler } from '../input/inputEventHandler';
import { dataService } from '../service/data/dataService';
import { databaseService } from '../service/data/databaseService';
import { localStorageService } from '../service/data/localStorageService';
import { Router } from '../router';
import NotificationBar from '../../vue-components/components/notificationBar.vue';
import ProgressBarModal from '../../vue-components/modals/progressBarModal.vue';
import SearchModal from '../../vue-components/modals/searchModal.vue';
import MessageBox from '../../vue-components/modals/messageBox.vue';
import { systemActionService } from '../service/systemActionService';

let MainVue = {};
let app = null;
let modalTypes = {
    MODAL_SEARCH: 'MODAL_SEARCH',
    MODAL_PROGRESSBAR: 'MODAL_PROGRESSBAR',
    MODAL_MESSAGEBOX: 'MODAL_MESSAGEBOX'
};

MainVue.setViewComponent = function (component, properties) {
    if (app && app.$refs.notificationBar.tooltipOptions.closeOnNavigate) {
        MainVue.clearTooltip();
    }
    app.setComponent(component, properties);
};

MainVue.isSidebarOpen = function () {
    return app.showSidebar;
};

MainVue.setTooltip = function (html, options) {
    if (!app) {
        return;
    }
    if (app.uiLocked) {
        app.hiddenPopupData = {
            html: html,
            options: options
        };
        return;
    }
    return app.$refs.notificationBar.setTooltip(html, options);
};

MainVue.setTooltipI18n = function (text, options) {
    MainVue.setTooltip(text, options);
};

MainVue.clearTooltip = function () {
    if (!app) {
        return;
    }
    app.hiddenPopupData = null;
    app.$refs.notificationBar.clearTooltip();
};

MainVue.showProgressBar = function (percentage, options) {
    if (!app) {
        return Promise.resolve();
    }
    app.showModal = modalTypes.MODAL_PROGRESSBAR;
    return app.$refs.progressBar.setProgress(percentage, options);
};

MainVue.showSearchModal = function (options) {
    app.showModal = modalTypes.MODAL_SEARCH;
    app.modalOptions = options || {};
};

MainVue.showMessageBox = function (options) {
    if (!app) {
        return Promise.resolve(false);
    }
    app.showModal = modalTypes.MODAL_MESSAGEBOX;
    return new Promise((resolve) => {
        app.$nextTick(() => {
            if (app.$refs.messageBox) {
                app.$refs.messageBox.show(options || {}).then(resolve);
            } else {
                resolve(false);
            }
        });
    });
};

MainVue.showConfirmBox = function (message, options = {}) {
    return MainVue.showMessageBox({
        type: constants.MODAL_TYPE_QUESTION,
        header: options.header,
        message: message,
        buttonPreset: options.buttonPreset || constants.BUTTONS_YES_NO,
        showCloseButton: options.showCloseButton !== undefined ? options.showCloseButton : true
    });
};

MainVue.searchModalOpened = function () {
    return app.showModal === modalTypes.MODAL_SEARCH;
};

MainVue.init = function () {
    Vue.use(VueI18n);
    return i18nService.getVueI18n().then((i18n) => {
        app = new Vue({
            i18n: i18n,
            el: '#app',
            components: { NotificationBar, ProgressBarModal, SearchModal, MessageBox },
            data() {
                return {
                    component: null,
                    properties: null,
                    componentKey: 0,
                    showSidebar: false,
                    currentUser: databaseService.getCurrentUsedDatabase(),
                    isLocalUser: localStorageService.isSavedLocalUser(databaseService.getCurrentUsedDatabase()),
                    syncState: dataService.getSyncState(),
                    constants: constants,
                    tooltipHTML: null,
                    actionLink: null,
                    Router: Router,
                    uiLocked: false,
                    hiddenPopupData: null,
                    modalTypes: modalTypes,
                    showModal: null,
                    modalOptions: {}
                };
            },
            methods: {
                setComponent(component, properties) {
                    this.component = component;
                    this.properties = properties;
                    this.componentKey++;
                },
                closeSidebar() {
                    $(document).trigger(constants.EVENT_SIDEBAR_CLOSE);
                },
                openSidebar() {
                    $(document).trigger(constants.EVENT_SIDEBAR_OPEN);
                },
                toMain() {
                    Router.toMain();
                }
            },
            mounted() {
                let thiz = this;
                $(document).on(constants.EVENT_SIDEBAR_OPEN, () => {
                    if (thiz.showSidebar) {
                        return;
                    }
                    if (!databaseService.getCurrentUsedDatabase()) {
                        thiz.showSidebar = true;
                        this.$nextTick(() => {
                            $(document).trigger(constants.EVENT_SIDEBAR_OPENED);
                            $(document).trigger(constants.EVENT_GRID_RESIZE);
                        });
                        return;
                    }
                    dataService.getMetadata().then((metadata) => {
                        if (!metadata.locked && !metadata.fullscreen) {
                            thiz.showSidebar = true;
                            this.$nextTick(() => {
                                $(document).trigger(constants.EVENT_SIDEBAR_OPENED);
                                $(document).trigger(constants.EVENT_GRID_RESIZE);
                            });
                        }
                    });
                });
                $(document).on(constants.EVENT_SIDEBAR_CLOSE, () => {
                    thiz.showSidebar = false;
                    this.$nextTick(() => {
                        $(document).trigger(constants.EVENT_GRID_RESIZE);
                    });
                });
                $(document).on(constants.EVENT_DB_INITIALIZED, () => {
                    thiz.currentUser = databaseService.getCurrentUsedDatabase();
                    thiz.isLocalUser = localStorageService.isSavedLocalUser(thiz.currentUser);
                });
                $(document).on(constants.EVENT_DB_CLOSED, () => {
                    thiz.currentUser = databaseService.getCurrentUsedDatabase();
                    thiz.isLocalUser = localStorageService.isSavedLocalUser(thiz.currentUser);
                });
                $(document).on(constants.EVENT_DB_SYNC_STATE_CHANGE, (event, syncState) => {
                    thiz.syncState = syncState;
                });
                $(document).on(constants.EVENT_GRID_IMAGES_CACHING, () => {
                    thiz.syncState = constants.DB_SYNC_STATE_SYNCINC;
                });
                $(document).on(constants.EVENT_GRID_IMAGES_CACHED, () => {
                    thiz.syncState = dataService.getSyncState();
                });
                $(document).on(constants.EVENT_UI_UNLOCKED, () => {
                    this.uiLocked = false;
                    if (this.hiddenPopupData) {
                        MainVue.setTooltip(this.hiddenPopupData.html, this.hiddenPopupData.options);
                        this.hiddenPopupData = null;
                    }
                });
                $(document).on(constants.EVENT_UI_LOCKED, () => {
                    this.uiLocked = true;
                    MainVue.clearTooltip();
                });
                thiz.syncState = dataService.getSyncState();
                window.addEventListener('resize', () => {
                    util.debounce(
                        function () {
                            $(document).trigger(constants.EVENT_GRID_RESIZE);
                        },
                        300,
                        constants.EVENT_GRID_RESIZE
                    );
                });
                inputEventHandler.global
                    .onSwipedDown(openSidebarIfFullscreen)
                    .onEscape(openSidebarIfFullscreen)
                    .onExitFullscreen(openSidebarIfFullscreen);
                inputEventHandler.global.startListening();
                thiz.openSidebar();

                async function openSidebarIfFullscreen() {
                    await systemActionService.exitFullscreen();
                    thiz.openSidebar();
                }
            }
        });
        return Promise.resolve();
    });
};

export { MainVue };
