import { beforeEach, describe, expect, it, vi } from "vitest";

import { ConnectionStateAwareAction } from "./connection-state-aware-action.js";

const { mockGetConnectionStatus } = vi.hoisted(() => ({
  mockGetConnectionStatus: vi.fn(() => true),
}));

vi.mock("./sdk-singleton.js", () => ({
  getController: () => ({
    getConnectionStatus: mockGetConnectionStatus,
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  }),
}));

vi.mock("./base-action.js", () => ({
  BaseAction: class MockBaseAction {
    logger = {
      trace: vi.fn(),
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    setActive = vi.fn();
  },
}));

vi.mock("./global-settings.js", async (importOriginal) => {
  const original = (await importOriginal()) as Record<string, unknown>;

  return {
    ...original,
    getGlobalSettings: vi.fn(() => ({})),
    onGlobalSettingsChange: vi.fn(() => vi.fn()),
  };
});

class TestAction extends ConnectionStateAwareAction {
  callUpdateConnectionState(): void {
    this.updateConnectionState();
  }

  callGetConnectionStatus(): boolean {
    return this.getConnectionStatus();
  }
}

function getLogger(action: TestAction) {
  return (action as unknown as { logger: { info: ReturnType<typeof vi.fn> } }).logger;
}

function getSetActive(action: TestAction) {
  return (action as unknown as { setActive: ReturnType<typeof vi.fn> }).setActive;
}

describe("ConnectionStateAwareAction", () => {
  let action: TestAction;

  beforeEach(() => {
    vi.clearAllMocks();
    action = new TestAction();
  });

  describe("updateConnectionState", () => {
    it("should set active when connected", () => {
      mockGetConnectionStatus.mockReturnValue(true);

      action.callUpdateConnectionState();

      expect(getSetActive(action)).toHaveBeenCalledWith(true);
    });

    it("should set inactive when disconnected", () => {
      mockGetConnectionStatus.mockReturnValue(false);

      action.callUpdateConnectionState();

      expect(getSetActive(action)).toHaveBeenCalledWith(false);
    });

    it("should not call setActive when status unchanged", () => {
      mockGetConnectionStatus.mockReturnValue(true);

      action.callUpdateConnectionState();
      vi.clearAllMocks();

      action.callUpdateConnectionState();

      expect(getSetActive(action)).not.toHaveBeenCalled();
    });

    it("should log state transitions", () => {
      mockGetConnectionStatus.mockReturnValue(true);

      action.callUpdateConnectionState();

      expect(getLogger(action).info).toHaveBeenCalledWith("updateConnectionState: null -> true");
    });
  });

  describe("getConnectionStatus", () => {
    it("should return current connection status", () => {
      mockGetConnectionStatus.mockReturnValue(true);
      expect(action.callGetConnectionStatus()).toBe(true);

      mockGetConnectionStatus.mockReturnValue(false);
      expect(action.callGetConnectionStatus()).toBe(false);
    });
  });
});
