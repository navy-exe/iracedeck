import { beforeEach, describe, expect, it, vi } from "vitest";

import { buildTireToggleMacro, generateTireServiceSvg, TireService } from "./tire-service.js";

const {
  mockSendMessage,
  mockGetCommands,
  mockGetConnectionStatus,
  mockGetCurrentTelemetry,
} = vi.hoisted(() => ({
  mockSendMessage: vi.fn(() => true),
  mockGetCommands: vi.fn(() => ({
    chat: {
      sendMessage: mockSendMessage,
    },
  })),
  mockGetConnectionStatus: vi.fn(() => true),
  mockGetCurrentTelemetry: vi.fn(() => ({ PitSvFlags: 0 })),
}));

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

vi.mock("@iracedeck/iracing-sdk", () => ({
  hasFlag: vi.fn((value: number, flag: number) => (value & flag) !== 0),
  PitSvFlags: {
    LFTireChange: 0x0001,
    RFTireChange: 0x0002,
    LRTireChange: 0x0004,
    RRTireChange: 0x0008,
  },
}));

vi.mock("@iracedeck/stream-deck-shared", () => ({
  ConnectionStateAwareAction: class MockConnectionStateAwareAction {
    sdkController = {
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      getConnectionStatus: mockGetConnectionStatus,
      getCurrentTelemetry: mockGetCurrentTelemetry,
    };
    updateConnectionState = vi.fn();
    setKeyImage = vi.fn();
    updateKeyImage = vi.fn();
    async onWillDisappear() {}
  },
  createSDLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    trace: vi.fn(),
  })),
  getCommands: mockGetCommands,
  LogLevel: { Info: 2 },
  generateIconText: vi.fn(
    (opts: { text: string; fontSize: number; fill: string }) => `<text fill="${opts.fill}">${opts.text}</text>`,
  ),
  renderIconTemplate: vi.fn((_template: string, data: Record<string, string>) => {
    return `<svg>${data.lfColor || ""}|${data.rfColor || ""}|${data.lrColor || ""}|${data.rrColor || ""}|${data.textElement || ""}</svg>`;
  }),
  svgToDataUri: vi.fn((svg: string) => `data:image/svg+xml,${encodeURIComponent(svg)}`),
}));

function fakeEvent(actionId: string, settings: Record<string, unknown> = {}) {
  return {
    action: { id: actionId, setTitle: vi.fn(), setImage: vi.fn(), isKey: () => true },
    payload: { settings },
  };
}

describe("TireService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetConnectionStatus.mockReturnValue(true);
    mockGetCurrentTelemetry.mockReturnValue({ PitSvFlags: 0 });
  });

  describe("buildTireToggleMacro", () => {
    it("should build macro for all tires", () => {
      expect(buildTireToggleMacro({ lf: true, rf: true, lr: true, rr: true })).toBe("#!lf !rf !lr !rr");
    });

    it("should build macro for front tires only", () => {
      expect(buildTireToggleMacro({ lf: true, rf: true, lr: false, rr: false })).toBe("#!lf !rf");
    });

    it("should build macro for left side only", () => {
      expect(buildTireToggleMacro({ lf: true, rf: false, lr: true, rr: false })).toBe("#!lf !lr");
    });

    it("should build macro for single tire", () => {
      expect(buildTireToggleMacro({ lf: false, rf: false, lr: false, rr: true })).toBe("#!rr");
    });

    it("should return null when no tires configured", () => {
      expect(buildTireToggleMacro({ lf: false, rf: false, lr: false, rr: false })).toBeNull();
    });
  });

  describe("generateTireServiceSvg", () => {
    it("should generate a valid data URI", () => {
      const result = generateTireServiceSvg(
        { lf: true, rf: true, lr: true, rr: true },
        { lf: false, rf: false, lr: false, rr: false },
      );
      expect(result).toContain("data:image/svg+xml");
    });

    it("should show red for configured but inactive tires", () => {
      const result = generateTireServiceSvg(
        { lf: true, rf: true, lr: true, rr: true },
        { lf: false, rf: false, lr: false, rr: false },
      );
      const decoded = decodeURIComponent(result);
      expect(decoded).toContain("#FF4444");
      expect(decoded).toContain("No Change");
    });

    it("should show green for configured and active tires", () => {
      const result = generateTireServiceSvg(
        { lf: true, rf: true, lr: true, rr: true },
        { lf: true, rf: true, lr: true, rr: true },
      );
      const decoded = decodeURIComponent(result);
      expect(decoded).toContain("#44FF44");
      expect(decoded).toContain("Change");
    });

    it("should show black for unconfigured tires", () => {
      const result = generateTireServiceSvg(
        { lf: false, rf: false, lr: false, rr: false },
        { lf: true, rf: true, lr: true, rr: true },
      );
      const decoded = decodeURIComponent(result);
      expect(decoded).toContain("#000000ff");
    });

    it("should show Change when any configured tire is on", () => {
      const result = generateTireServiceSvg(
        { lf: true, rf: false, lr: false, rr: false },
        { lf: true, rf: false, lr: false, rr: false },
      );
      const decoded = decodeURIComponent(result);
      expect(decoded).toContain("Change");
      expect(decoded).not.toContain("No Change");
    });

    it("should show No Change when no configured tire is on", () => {
      const result = generateTireServiceSvg(
        { lf: true, rf: true, lr: true, rr: true },
        { lf: false, rf: false, lr: false, rr: false },
      );
      const decoded = decodeURIComponent(result);
      expect(decoded).toContain("No Change");
    });
  });

  describe("key press behavior", () => {
    let action: TireService;

    beforeEach(() => {
      action = new TireService();
    });

    it("should send toggle macro for all configured tires", async () => {
      await action.onKeyDown(fakeEvent("a1", { lf: true, rf: true, lr: true, rr: true }) as any);

      expect(mockSendMessage).toHaveBeenCalledOnce();
      expect(mockSendMessage).toHaveBeenCalledWith("#!lf !rf !lr !rr");
    });

    it("should send toggle macro for only configured tires", async () => {
      await action.onKeyDown(fakeEvent("a1", { lf: true, rf: false, lr: true, rr: false }) as any);

      expect(mockSendMessage).toHaveBeenCalledOnce();
      expect(mockSendMessage).toHaveBeenCalledWith("#!lf !lr");
    });

    it("should not send message when not connected", async () => {
      mockGetConnectionStatus.mockReturnValue(false);

      await action.onKeyDown(fakeEvent("a1", { lf: true, rf: true, lr: true, rr: true }) as any);

      expect(mockSendMessage).not.toHaveBeenCalled();
    });

    it("should not send message when no tires configured", async () => {
      await action.onKeyDown(fakeEvent("a1", { lf: false, rf: false, lr: false, rr: false }) as any);

      expect(mockSendMessage).not.toHaveBeenCalled();
    });

    it("should default to all tires when settings are empty", async () => {
      await action.onKeyDown(fakeEvent("a1", {}) as any);

      expect(mockSendMessage).toHaveBeenCalledOnce();
      expect(mockSendMessage).toHaveBeenCalledWith("#!lf !rf !lr !rr");
    });
  });

  describe("encoder behavior", () => {
    let action: TireService;

    beforeEach(() => {
      action = new TireService();
    });

    it("should send toggle macro on dial down same as key press", async () => {
      await action.onDialDown(fakeEvent("a1", { lf: true, rf: true, lr: true, rr: true }) as any);

      expect(mockSendMessage).toHaveBeenCalledOnce();
      expect(mockSendMessage).toHaveBeenCalledWith("#!lf !rf !lr !rr");
    });
  });
});
