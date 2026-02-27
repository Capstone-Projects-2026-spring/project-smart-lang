import { modelUtil } from '../util/modelUtil';
import { GridImage } from './GridImage';
import { Model } from '../externals/objectmodel';

class SuggestedWord extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    label: [Object, String], // Word text
    description: [Object, String],
    category: [String], // 'common', 'eating', 'emotions', 'actions', etc.
    image: [GridImage],
    pronunciation: [Object],
    frequency: [Number], // How often suggested
    createdBy: [String], // Caregiver/Admin ID who created it
    createdAt: [Number],
    lastModified: [Number],
    isActive: [Boolean],
    tags: [Object] // Array of tags for filtering
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, SuggestedWord) || {};
        properties.id = properties.id || modelUtil.generateId(SuggestedWord.getIdPrefix());
        properties.modelName = properties.modelName || 'SuggestedWord';
        properties.modelVersion = properties.modelVersion || '1.0';
        properties.frequency = properties.frequency || 0;
        properties.createdAt = properties.createdAt || Date.now();
        properties.lastModified = properties.lastModified || Date.now();
        properties.isActive = properties.isActive !== undefined ? properties.isActive : true;
        properties.tags = properties.tags || [];
        super(properties);
    }

    static getIdPrefix() {
        return 'suggestedword_';
    }

    static getModelName() {
        return 'SuggestedWord';
    }

    incrementFrequency() {
        this.frequency = (this.frequency || 0) + 1;
        this.lastModified = Date.now();
    }

    addTag(tag) {
        if (!this.tags.includes(tag)) {
            this.tags.push(tag);
            this.lastModified = Date.now();
        }
    }

    removeTag(tag) {
        this.tags = this.tags.filter(t => t !== tag);
        this.lastModified = Date.now();
    }
}

export { SuggestedWord };
