jest.mock('../externals/objectmodel', () => ({
    Model: (definition) => {
        return class {
            static definition = definition;

            static defaults(defaults) {
                this._defaults = defaults;
            }

            constructor(properties = {}) {
                Object.assign(this, this.constructor._defaults || {}, properties);
            }
        };
    }
}));

import { TextConfig } from './TextConfig';
import { constants } from '../util/constants';

describe('TextConfig', () => {
    test('exposes model name and constants', () => {
        expect(TextConfig.getModelName()).toBe('TextConfig');
        expect(TextConfig.CONVERT_MODE_UPPERCASE).toBe('CONVERT_MODE_UPPERCASE');
        expect(TextConfig.CONVERT_MODE_LOWERCASE).toBe('CONVERT_MODE_LOWERCASE');
        expect(TextConfig.TEXT_POS_ABOVE).toBe('ABOVE');
        expect(TextConfig.TEXT_POS_BELOW).toBe('BELOW');
        expect(TextConfig.TOO_LONG_AUTO).toBe('AUTO');
        expect(TextConfig.TOO_LONG_TRUNCATE).toBe('TRUNCATE');
        expect(TextConfig.TOO_LONG_ELLIPSIS).toBe('ELLIPSIS');
        expect(TextConfig.FONTS).toContain('Arial');
    });

    test('applies defaults', () => {
        const cfg = new TextConfig();
        expect(cfg.modelName).toBe('TextConfig');
        expect(cfg.modelVersion).toBe(constants.MODEL_VERSION);
        expect(cfg.convertMode).toBeNull();
        expect(cfg.fontFamily).toBe('Arial');
        expect(cfg.fontSizePct).toBe(15);
        expect(cfg.lineHeight).toBe(1.5);
        expect(cfg.maxLines).toBe(1);
        expect(cfg.textPosition).toBe(TextConfig.TEXT_POS_BELOW);
        expect(cfg.onlyTextFontSizePct).toBe(35);
        expect(cfg.onlyTextLineHeight).toBe(1.5);
        expect(cfg.fittingMode).toBe(TextConfig.TOO_LONG_AUTO);
        expect(cfg.autoSizeKeyboardLetters).toBe(true);
        expect(cfg.fontColor).toBe(constants.DEFAULT_ELEMENT_FONT_COLOR);
    });

    test('allows overriding defaults', () => {
        const cfg = new TextConfig({
            fontFamily: 'Times',
            maxLines: 3,
            convertMode: TextConfig.CONVERT_MODE_UPPERCASE
        });

        expect(cfg.fontFamily).toBe('Times');
        expect(cfg.maxLines).toBe(3);
        expect(cfg.convertMode).toBe(TextConfig.CONVERT_MODE_UPPERCASE);
    });
});
