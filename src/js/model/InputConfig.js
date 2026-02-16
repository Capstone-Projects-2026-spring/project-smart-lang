import { modelUtil } from '../util/modelUtil';
import { constants } from '../util/constants';
import { Model } from '../externals/objectmodel';
import { InputEventKey } from './InputEventKey';

class InputConfig extends Model({
    id: String,
    modelName: String,
    modelVersion: String,
    globalReadActive: [Boolean], //read out loud active element(s)?
    globalReadActiveRate: [Number],
    globalReadAdditionalActions: [Boolean],
    globalBeepFeedback: [Boolean],
    globalMinPauseCollectSpeak: [Number],
    mouseclickEnabled: [Boolean],
    mouseDoubleClickEnabled: [Boolean],
    mouseDownInsteadClick: [Boolean],
    dirEnabled: [Boolean],
    dirInputs: [Model.Array(Object)], //array with input events with labels InputConfig.UP/DOWN/LEFT/RIGHT/SELECT
    dirWrapAround: [Boolean],
    dirResetToStart: [Boolean]
}) {
    constructor(properties, elementToCopy) {
        properties = modelUtil.setDefaults(properties, elementToCopy, InputConfig);
        super(properties);
        this.id = this.id || modelUtil.generateId('input-config');
    }

    static getModelName() {
        return 'InputConfig';
    }

    static getInputEventTypes() {
        return [InputEventKey];
    }

    static getInputEventInstance(modelName, options) {
        let constructor = this.getInputEventTypes().filter((type) => type.getModelName() === modelName)[0];
        if (constructor) {
            return new constructor(options);
        } else {
            log.warn('input event type not found: ' + modelName);
        }
    }
}
InputConfig.UP = 'UP';
InputConfig.DOWN = 'DOWN';
InputConfig.LEFT = 'LEFT';
InputConfig.RIGHT = 'RIGHT';
InputConfig.SELECT = 'SELECT';
InputConfig.NEXT = 'NEXT';
InputConfig.NEXT_ELEMENT = 'NEXT_ELEMENT';
InputConfig.PREVIOUS_ELEMENT = 'PREVIOUS_ELEMENT';
InputConfig.GENERAL_INPUT = 'GENERAL_INPUT';
InputConfig.getNumConst = (num) => 'NUM' + num;

InputConfig.DEFAULT_DIR_INPUTS = [
    new InputEventKey({ label: InputConfig.SELECT, keyCode: 32, keyName: 'Space' }),
    new InputEventKey({ label: InputConfig.LEFT, keyCode: 37, keyName: 'ArrowLeft' }),
    new InputEventKey({ label: InputConfig.RIGHT, keyCode: 39, keyName: 'ArrowRight' }),
    new InputEventKey({ label: InputConfig.UP, keyCode: 38, keyName: 'ArrowUp' }),
    new InputEventKey({ label: InputConfig.DOWN, keyCode: 40, keyName: 'ArrowDown' })
];

InputConfig.defaults({
    id: '', //will be replaced by constructor
    modelName: InputConfig.getModelName(),
    modelVersion: constants.MODEL_VERSION,
    globalReadActiveRate: 1,
    globalMinPauseCollectSpeak: 0,
    mouseclickEnabled: true,
    mouseDoubleClickEnabled: false,
    mouseDownInsteadClick: false,
    dirInputs: InputConfig.DEFAULT_DIR_INPUTS,
    dirWrapAround: true
});

export { InputConfig };
