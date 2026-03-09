import type { TelemetryData } from "@iracedeck/iracing-sdk";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { extractPresetValue, generateTelemetryDisplaySvg, PRESET_MODES } from "./telemetry-display.js";

vi.mock("@elgato/streamdeck", () => ({
  default: {
    logger: {
      createScope: vi.fn(() => ({
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
        trace: vi.fn(),
      })),
    },
  },
  action: () => (target: unknown) => target,
}));

vi.mock("../../icons/session-info.svg", () => ({
  default:
    '<svg xmlns="http://www.w3.org/2000/svg">{{backgroundColor}} {{titleLabel}} {{value}} {{valueFontSize}} {{textColor}}</svg>',
}));

vi.mock("@iracedeck/iracing-sdk", () => ({
  buildTemplateContext: vi.fn(() => ({
    telemetry: { Speed: "156.79", OilTemp: "95" },
    sessionInfo: {},
  })),
  resolveTemplate: vi.fn((template: string) => template.replace("{{telemetry.Speed}}", "156.79")),
  DisplayUnits: { English: 0, Metric: 1 },
}));

vi.mock("../shared/index.js", () => ({
  ConnectionStateAwareAction: class MockConnectionStateAwareAction {
    sdkController = {
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      getCurrentTelemetry: vi.fn(() => null),
    };
    updateConnectionState = vi.fn();
    setKeyImage = vi.fn();
    updateKeyImage = vi.fn();
  },
  createSDLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    trace: vi.fn(),
  })),
  LogLevel: { Info: 2 },
  renderIconTemplate: vi.fn((template: string, data: Record<string, string>) => {
    let result = template;

    for (const [key, value] of Object.entries(data)) {
      result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
    }

    return result;
  }),
  svgToDataUri: vi.fn((svg: string) => `data:image/svg+xml,${encodeURIComponent(svg)}`),
}));

describe("TelemetryDisplay", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("PRESET_MODES", () => {
    it("should have all expected modes", () => {
      expect(Object.keys(PRESET_MODES).sort()).toEqual(
        ["brake-bias", "gear", "oil-temp", "speed", "water-temp"].sort(),
      );
    });
  });

  describe("extractPresetValue", () => {
    it("should return placeholder when no telemetry", () => {
      const result = extractPresetValue("speed", null);

      expect(result).toEqual({ title: "SPEED", value: "---" });
    });

    it("should return placeholder for unknown mode", () => {
      const result = extractPresetValue("unknown", null);

      expect(result).toEqual({ title: "---", value: "---" });
    });

    it("should format speed in metric", () => {
      const telemetry = { Speed: 10, DisplayUnits: 1 } as unknown as TelemetryData;
      const result = extractPresetValue("speed", telemetry);

      expect(result.title).toBe("SPEED");
      expect(result.value).toBe("36 km/h");
    });

    it("should format speed in imperial", () => {
      const telemetry = { Speed: 10, DisplayUnits: 0 } as unknown as TelemetryData;
      const result = extractPresetValue("speed", telemetry);

      expect(result.title).toBe("SPEED");
      expect(result.value).toBe("22 mph");
    });

    it("should format oil temperature", () => {
      const telemetry = { OilTemp: 95.7 } as unknown as TelemetryData;
      const result = extractPresetValue("oil-temp", telemetry);

      expect(result).toEqual({ title: "OIL TEMP", value: "96°C" });
    });

    it("should format water temperature", () => {
      const telemetry = { WaterTemp: 78.3 } as unknown as TelemetryData;
      const result = extractPresetValue("water-temp", telemetry);

      expect(result).toEqual({ title: "WATER TEMP", value: "78°C" });
    });

    it("should format brake bias", () => {
      const telemetry = { dcBrakeBias: 52.35 } as unknown as TelemetryData;
      const result = extractPresetValue("brake-bias", telemetry);

      expect(result).toEqual({ title: "BRAKE BIAS", value: "52.4%" });
    });

    it("should format gear as number", () => {
      const telemetry = { Gear: 4 } as unknown as TelemetryData;
      const result = extractPresetValue("gear", telemetry);

      expect(result).toEqual({ title: "GEAR", value: "4" });
    });

    it("should format gear 0 as N", () => {
      const telemetry = { Gear: 0 } as unknown as TelemetryData;
      const result = extractPresetValue("gear", telemetry);

      expect(result).toEqual({ title: "GEAR", value: "N" });
    });

    it("should format gear -1 as R", () => {
      const telemetry = { Gear: -1 } as unknown as TelemetryData;
      const result = extractPresetValue("gear", telemetry);

      expect(result).toEqual({ title: "GEAR", value: "R" });
    });

    it("should return placeholder when field is missing", () => {
      const telemetry = {} as unknown as TelemetryData;
      const result = extractPresetValue("speed", telemetry);

      expect(result).toEqual({ title: "SPEED", value: "---" });
    });
  });

  describe("generateTelemetryDisplaySvg", () => {
    it("should produce a data URI", () => {
      const result = generateTelemetryDisplaySvg("SPEED", "100 km/h", {
        mode: "speed",
        customTemplate: "",
        customTitle: "",
        backgroundColor: "#2a3444",
        textColor: "#ffffff",
        fontSize: 18,
      });

      expect(result).toContain("data:image/svg+xml");
    });

    it("should use custom colors", () => {
      const result = generateTelemetryDisplaySvg("TEST", "42", {
        mode: "custom",
        customTemplate: "42",
        customTitle: "TEST",
        backgroundColor: "#ff0000",
        textColor: "#00ff00",
        fontSize: 24,
      });

      expect(result).toContain(encodeURIComponent("#ff0000"));
      expect(result).toContain(encodeURIComponent("#00ff00"));
      expect(result).toContain(encodeURIComponent("24"));
    });
  });
});
