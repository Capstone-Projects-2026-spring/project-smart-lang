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

import { ColorConfig } from './ColorConfig';
import { constants } from '../util/constants';

describe('ColorConfig', () => {
    test('model name and static constants are defined', () => {
        expect(ColorConfig.getModelName()).toBe('ColorConfig');
        expect(ColorConfig.COLOR_MODE_BACKGROUND).toBe('COLOR_MODE_BACKGROUND');
        expect(ColorConfig.COLOR_MODE_BORDER).toBe('COLOR_MODE_BORDER');
        expect(ColorConfig.COLOR_MODE_BOTH).toBe('COLOR_MODE_BOTH');
        expect(ColorConfig.BORDER_WIDTH_BORDER_COLORED).toBe(0.45);
        expect(ColorConfig.BORDER_WIDTH_BG_COLORED).toBe(0.1);
    });

    test('applies default values', () => {
        const cfg = new ColorConfig();
        expect(cfg.modelName).toBe(ColorConfig.getModelName());
        expect(cfg.modelVersion).toBe(constants.MODEL_VERSION);
        expect(cfg.colorSchemesActivated).toBe(true);
        expect(cfg.activeColorScheme).toBe(constants.DEFAULT_COLOR_SCHEMES[0].name);
        expect(cfg.additionalColorSchemes).toEqual([]);
        expect(cfg.elementBackgroundColor).toBe(constants.DEFAULT_ELEMENT_BACKGROUND_COLOR);
        expect(cfg.elementBorderColor).toBe(constants.DEFAULT_ELEMENT_BORDER_COLOR);
        expect(cfg.gridBackgroundColor).toBe(constants.DEFAULT_GRID_BACKGROUND_COLOR);
        expect(cfg.borderWidth).toBe(ColorConfig.BORDER_WIDTH_BG_COLORED);
        expect(cfg.elementMargin).toBe(0.15);
        expect(cfg.borderRadius).toBe(0.4);
        expect(cfg.colorMode).toBe(ColorConfig.COLOR_MODE_BACKGROUND);
    });

    test('allows overriding defaults', () => {
        const cfg = new ColorConfig({ colorMode: ColorConfig.COLOR_MODE_BOTH, borderWidth: 1 });
        expect(cfg.colorMode).toBe(ColorConfig.COLOR_MODE_BOTH);
        expect(cfg.borderWidth).toBe(1);
    });
});
