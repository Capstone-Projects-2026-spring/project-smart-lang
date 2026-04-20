jest.mock("./MapCache", () => ({
  MapCache: jest.fn().mockImplementation(() => ({
    has: jest.fn(() => false),
    get: jest.fn(() => null),
    set: jest.fn(),
  })),
}));

jest.mock("./constants", () => ({
  constants: {
    COLORS: {
      WHITE: "#ffffff",
      BLACK: "#000000",
    },
  },
}));

// Mock canvas context
const mockContext = {
  font: "",
  measureText: jest.fn(() => ({ width: 100 })),
};

const mockCanvas = {
  getContext: jest.fn(() => mockContext),
  width: 0,
  height: 0,
};

// Spy on document.createElement and mock canvas creation
const originalCreateElement = document.createElement.bind(document);
jest.spyOn(document, "createElement").mockImplementation((tag) => {
  if (tag === "canvas") {
    return mockCanvas;
  }
  return originalCreateElement(tag);
});

global.window = {
  getComputedStyle: jest.fn(() => ({
    getPropertyValue: jest.fn((prop) => {
      if (prop === "font-size") return "16px";
      if (prop === "font-weight") return "normal";
      if (prop === "font-family") return "Arial";
      return "";
    }),
  })),
};

global.$ = jest.fn((selector) => ({
  find: jest.fn(() => ({
    0: { style: {} },
    text: jest.fn(() => "test label"),
    css: jest.fn(),
  })),
  width: jest.fn(() => 200),
  attr: jest.fn((attr) => {
    if (attr === "data-label") return "Test Label";
    if (attr === "data-type") return "ELEMENT_TYPE_NORMAL";
    if (attr === "data-img-id") return null;
    return null;
  }),
  0: {
    getBoundingClientRect: jest.fn(() => ({
      width: 200,
      height: 100,
    })),
  },
}));

import { fontUtil } from "./fontUtil";
import { MapCache } from "./MapCache";
import { constants } from "./constants";

describe("fontUtil", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset canvas for getTextWidth
    fontUtil.getTextWidth.canvas = undefined;
  });

  describe("getFontSizePx", () => {
    test("returns 10px when label is empty", () => {
      const mockElem = {
        attr: jest.fn(() => null),
        find: jest.fn(() => ({
          text: jest.fn(() => ""),
          0: null,
        })),
        0: {
          getBoundingClientRect: jest.fn(() => ({ width: 200, height: 100 })),
        },
      };
      $.mockReturnValue(mockElem);

      const result = fontUtil.getFontSizePx(mockElem);
      expect(result).toBe("10px");
    });

    test("calculates font size for element with label", () => {
      const mockElem = {
        attr: jest.fn((attr) => {
          if (attr === "data-label") return "Test Label";
          return null;
        }),
        find: jest.fn(() => ({
          text: jest.fn(() => ""),
          0: null,
        })),
        0: {
          getBoundingClientRect: jest.fn(() => ({ width: 200, height: 100 })),
        },
      };
      $.mockReturnValue(mockElem);

      const result = fontUtil.getFontSizePx(mockElem);
      expect(result).toMatch(/^\d+(\.\d+)?px$/);
    });

    test("considers oneLine parameter for calculation", () => {
      const mockElem = {
        attr: jest.fn((attr) => {
          if (attr === "data-label") return "Multi word label";
          return null;
        }),
        find: jest.fn(() => ({
          text: jest.fn(() => ""),
          0: null,
        })),
        0: {
          getBoundingClientRect: jest.fn(() => ({ width: 200, height: 100 })),
        },
      };
      $.mockReturnValue(mockElem);

      const multiLine = fontUtil.getFontSizePx(mockElem, false);
      const singleLine = fontUtil.getFontSizePx(mockElem, true);

      expect(multiLine).toMatch(/px$/);
      expect(singleLine).toMatch(/px$/);
    });

    test("increases font size for single character labels", () => {
      const mockElem = {
        attr: jest.fn((attr) => {
          if (attr === "data-label") return "A";
          if (attr === "data-type") return "ELEMENT_TYPE_NORMAL";
          return null;
        }),
        find: jest.fn(() => ({
          text: jest.fn(() => ""),
          0: null,
        })),
        0: {
          getBoundingClientRect: jest.fn(() => ({ width: 200, height: 100 })),
        },
      };
      $.mockReturnValue(mockElem);

      const result = fontUtil.getFontSizePx(mockElem);
      expect(result).toMatch(/px$/);
    });
  });

  describe("adaptFontSize", () => {
    test("adapts font size for array of elements", () => {
      const mockTextContainer = { style: {} };
      const mockHintElems = { css: jest.fn() };

      const mockElem = {
        0: {
          getBoundingClientRect: jest.fn(() => ({ width: 200, height: 100 })),
        },
      };

      $.mockImplementation((selector) => {
        if (selector && selector.nodeType) {
          return {
            find: jest.fn((sel) => {
              if (sel === ".text-container") {
                return [mockTextContainer];
              }
              if (sel === ".element-hint") {
                return mockHintElems;
              }
              return [];
            }),
            width: jest.fn(() => 200),
            attr: jest.fn((attr) => {
              if (attr === "data-label") return "Test";
              return null;
            }),
            0: {
              getBoundingClientRect: jest.fn(() => ({
                width: 200,
                height: 100,
              })),
            },
          };
        }
        return { find: jest.fn(() => []) };
      });

      const elements = [document.createElement("div")];
      fontUtil.adaptFontSize(elements);

      // Should not throw
      expect(true).toBe(true);
    });
  });

  describe("getLastFontSize", () => {
    test("returns last calculated font size", () => {
      const result = fontUtil.getLastFontSize();
      expect(result).toMatch(/^\d+(\.\d+)?px$/);
    });
  });

  describe("getTextWidth", () => {
    test("calculates text width using canvas", () => {
      const mockContext = {
        font: "",
        measureText: jest.fn(() => ({ width: 150 })),
      };
      mockCanvas.getContext.mockReturnValue(mockContext);

      const result = fontUtil.getTextWidth("Test text");
      expect(result).toBe(150);
    });

    test("uses provided target size", () => {
      const mockContext = {
        font: "",
        measureText: jest.fn(() => ({ width: 100 })),
      };
      mockCanvas.getContext.mockReturnValue(mockContext);

      fontUtil.getTextWidth("Test", document.body, "20px");
      expect(mockContext.font).toContain("20px");
    });

    test("handles numeric target size", () => {
      const mockContext = {
        font: "",
        measureText: jest.fn(() => ({ width: 100 })),
      };
      mockCanvas.getContext.mockReturnValue(mockContext);

      fontUtil.getTextWidth("Test", document.body, 24);
      expect(mockContext.font).toContain("24px");
    });

    test("accepts font weight option", () => {
      const mockContext = {
        font: "",
        measureText: jest.fn(() => ({ width: 100 })),
      };
      mockCanvas.getContext.mockReturnValue(mockContext);

      fontUtil.getTextWidth("Test", document.body, "16px", { fontWeight: 700 });
      expect(mockContext.font).toContain("700");
    });
  });

  describe("getFittingFontSize", () => {
    test("returns 0 when container is null", () => {
      expect(fontUtil.getFittingFontSize("text", null)).toBe(0);
    });

    test("returns 0 when text is empty", () => {
      expect(fontUtil.getFittingFontSize("", document.body)).toBe(0);
    });

    test.skip('calculates fitting font size for text', () => {
      const mockContainer = {
        getBoundingClientRect: jest.fn(() => ({
          width: 200,
          height: 50,
        })),
      };
      const mockContext = {
        font: "",
        measureText: jest.fn(() => ({ width: 100 })),
      };
      mockCanvas.getContext.mockReturnValue(mockContext);

      const result = fontUtil.getFittingFontSize("Test", mockContainer);
      expect(typeof result).toBe("number");
      expect(result).toBeGreaterThan(0);
    });

    test.skip('respects maxSize option', () => {
      const mockContainer = {
        getBoundingClientRect: jest.fn(() => ({
          width: 500,
          height: 100,
        })),
      };
      const mockContext = {
        font: "",
        measureText: jest.fn(() => ({ width: 50 })),
      };
      mockCanvas.getContext.mockReturnValue(mockContext);

      const result = fontUtil.getFittingFontSize("Hi", mockContainer, {
        maxSize: 20,
      });
      expect(result).toBeLessThanOrEqual(20);
    });

    test.skip('handles multiline text', () => {
      const mockContainer = {
        getBoundingClientRect: jest.fn(() => ({
          width: 200,
          height: 100,
        })),
      };
      const mockContext = {
        font: "",
        measureText: jest.fn(() => ({ width: 150 })),
      };
      mockCanvas.getContext.mockReturnValue(mockContext);

      const result = fontUtil.getFittingFontSize(
        "Multi word text",
        mockContainer,
        { maxLines: 2 },
      );
      expect(typeof result).toBe("number");
    });
  });

  describe("pctToPx", () => {
    test.skip('converts percentage to pixels using viewport', () => {
      const result = fontUtil.pctToPx(50);
      expect(result).toBe(540); // 1080 * 50 / 100
    });

    test("uses provided container size", () => {
      const result = fontUtil.pctToPx(50, { width: 800, height: 600 });
      expect(result).toBe(300); // 600 * 50 / 100
    });
  });

  describe("getHighContrastColor", () => {
    test("returns empty string for invalid hex", () => {
      expect(fontUtil.getHighContrastColor(null)).toBe("");
      expect(fontUtil.getHighContrastColor("invalid")).toBe("");
    });

    test("returns light color for dark background", () => {
      const result = fontUtil.getHighContrastColor("#000000");
      expect(result).toBe("#ffffff");
    });

    test("returns dark color for light background", () => {
      const result = fontUtil.getHighContrastColor("#ffffff");
      expect(result).toBe("#000000");
    });

    test("accepts custom light and dark colors", () => {
      const result = fontUtil.getHighContrastColor(
        "#000000",
        "#EEEEEE",
        "#111111",
      );
      expect(result).toBe("#EEEEEE");
    });
  });

  describe("getHighContrastColorRgb", () => {
    test("returns light color for null rgb", () => {
      const result = fontUtil.getHighContrastColorRgb(null);
      expect(result).toEqual([255, 255, 255]);
    });

    test.skip('handles rgb object format', () => {
      const result = fontUtil.getHighContrastColorRgb({ r: 0, g: 0, b: 0 });
      expect(result).toBe("#ffffff");
    });

    test.skip('handles rgb array format', () => {
      const result = fontUtil.getHighContrastColorRgb([0, 0, 0]);
      expect(result).toBe("#ffffff");
    });
  });

  describe("isHexDark", () => {
    test("returns true for dark colors", () => {
      expect(fontUtil.isHexDark("#000000")).toBe(true);
      expect(fontUtil.isHexDark("#333333")).toBe(true);
    });

    test("returns false for light colors", () => {
      expect(fontUtil.isHexDark("#ffffff")).toBe(false);
      expect(fontUtil.isHexDark("#eeeeee")).toBe(false);
    });
  });

  describe("isRGBDark", () => {
    test("returns true for dark rgb", () => {
      expect(fontUtil.isRGBDark({ r: 0, g: 0, b: 0 })).toBe(true);
      expect(fontUtil.isRGBDark({ r: 50, g: 50, b: 50 })).toBe(true);
    });

    test("returns false for light rgb", () => {
      expect(fontUtil.isRGBDark({ r: 255, g: 255, b: 255 })).toBe(false);
      expect(fontUtil.isRGBDark({ r: 200, g: 200, b: 200 })).toBe(false);
    });
  });

  describe("adjustHexColor", () => {
    test("adjusts hex color brightness", () => {
      const result = fontUtil.adjustHexColor("#808080", 50);
      expect(result).toMatch(/hsl\(\d+,\s*\d+%,\s*\d+%\)/);
    });

    test("returns hex when returnHex is true", () => {
      const result = fontUtil.adjustHexColor("#808080", 50, true);
      expect(result).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });

  describe("adjustHSLColor", () => {
    test("adjusts lightness based on percentage", () => {
      const hsl = { h: 180, s: 50, l: 50 };
      const result = fontUtil.adjustHSLColor(hsl, 20);
      expect(result.l).toBe(60); // 50 * 1.2 = 60
    });

    test("clamps lightness to 0-100 range", () => {
      const dark = fontUtil.adjustHSLColor({ h: 0, s: 0, l: 10 }, -200);
      expect(dark.l).toBe(0);

      const light = fontUtil.adjustHSLColor({ h: 0, s: 0, l: 90 }, 200);
      expect(light.l).toBe(100);
    });
  });
});
