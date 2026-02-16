import { convertServiceLocal } from '../service/data/convertServiceLocal.js';
import {VoiceConfig} from "./VoiceConfig.js";
import { IntegrationConfigLocal } from './IntegrationConfigLocal';

class SettingsUserLocal {

    /**
     * @param settings.modelVersion current model version string for local storage models
     * @param settings.modelVersionDb current model version string for database models
     * @param settings.contentLang
     * @param settings.lastContentLang
     * @param settings.username
     * @param settings.password
     * @param settings.metadata
     * @param settings.voiceConfig
     * @param settings.originGridsetFilename
     * @param settings.isEmpty true if this user configuration is empty
     * @param settings.systemVolume
     * @param settings.systemVolumeMuted
     * @param settings.integrations
     */
    constructor(settings) {
        settings = settings || {};
        this.modelVersion = settings.modelVersion;

        this.modelVersionDb = settings.modelVersionDb;
        this.contentLang = settings.contentLang;
        this.lastContentLang = settings.lastContentLang;
        this.username = settings.username;
        this.password = settings.password;
        this.metadata = settings.metadata;
        this.voiceConfig = settings.voiceConfig && Object.keys(settings.voiceConfig).length ? new VoiceConfig(settings.voiceConfig) : {};
        this.originGridsetFilename = settings.originGridsetFilename;
        this.isEmpty = settings.isEmpty !== undefined ? settings.isEmpty : true;
        this.systemVolume = settings.systemVolume !== undefined ? settings.systemVolume : 100;
        this.systemVolumeMuted = settings.systemVolumeMuted || false;
        this.integrations = settings.integrations || new IntegrationConfigLocal();

        convertServiceLocal.updateDataModel(this);
    }
}

export { SettingsUserLocal };