import { beforeEach, describe, expect, it, vi } from "vitest";

import type { INativeSDK } from "../interfaces.js";
import { BroadcastMsg, PitCommandMode } from "./constants.js";
import { PitCommand } from "./PitCommand.js";

function createMockNative(): INativeSDK {
  return {
    startup: vi.fn(),
    shutdown: vi.fn(),
    isConnected: vi.fn(),
    getHeader: vi.fn(),
    getData: vi.fn(),
    waitForData: vi.fn(),
    getSessionInfoStr: vi.fn(),
    getVarHeaderEntry: vi.fn(),
    varNameToIndex: vi.fn(),
    broadcastMsg: vi.fn(),
    sendChatMessage: vi.fn(),
  };
}

describe("PitCommand", () => {
  let mockNative: INativeSDK;
  let pitCommand: PitCommand;

  beforeEach(() => {
    mockNative = createMockNative();
    pitCommand = new PitCommand(mockNative);
  });

  describe("clear", () => {
    it("should send clear command", () => {
      pitCommand.clear();

      expect(mockNative.broadcastMsg).toHaveBeenCalledWith(BroadcastMsg.PitCommand, PitCommandMode.Clear, 0, 0);
    });
  });

  describe("fuel", () => {
    it("should send fuel command with amount", () => {
      pitCommand.fuel(50);

      expect(mockNative.broadcastMsg).toHaveBeenCalledWith(BroadcastMsg.PitCommand, PitCommandMode.Fuel, 50, 0);
    });

    it("should default to 0 liters", () => {
      pitCommand.fuel();

      expect(mockNative.broadcastMsg).toHaveBeenCalledWith(BroadcastMsg.PitCommand, PitCommandMode.Fuel, 0, 0);
    });
  });

  describe("clearFuel", () => {
    it("should send clear fuel command", () => {
      pitCommand.clearFuel();

      expect(mockNative.broadcastMsg).toHaveBeenCalledWith(BroadcastMsg.PitCommand, PitCommandMode.ClearFuel, 0, 0);
    });
  });

  describe("tire commands", () => {
    it("should send left front command with pressure", () => {
      pitCommand.leftFront(200);

      expect(mockNative.broadcastMsg).toHaveBeenCalledWith(BroadcastMsg.PitCommand, PitCommandMode.LF, 200, 0);
    });

    it("should send right front command", () => {
      pitCommand.rightFront(200);

      expect(mockNative.broadcastMsg).toHaveBeenCalledWith(BroadcastMsg.PitCommand, PitCommandMode.RF, 200, 0);
    });

    it("should send left rear command", () => {
      pitCommand.leftRear(200);

      expect(mockNative.broadcastMsg).toHaveBeenCalledWith(BroadcastMsg.PitCommand, PitCommandMode.LR, 200, 0);
    });

    it("should send right rear command", () => {
      pitCommand.rightRear(200);

      expect(mockNative.broadcastMsg).toHaveBeenCalledWith(BroadcastMsg.PitCommand, PitCommandMode.RR, 200, 0);
    });

    it("should default tire pressure to 0", () => {
      pitCommand.leftFront();

      expect(mockNative.broadcastMsg).toHaveBeenCalledWith(BroadcastMsg.PitCommand, PitCommandMode.LF, 0, 0);
    });
  });

  describe("clearTires", () => {
    it("should send clear tires command", () => {
      pitCommand.clearTires();

      expect(mockNative.broadcastMsg).toHaveBeenCalledWith(BroadcastMsg.PitCommand, PitCommandMode.ClearTires, 0, 0);
    });
  });

  describe("fastRepair", () => {
    it("should send fast repair command", () => {
      pitCommand.fastRepair();

      expect(mockNative.broadcastMsg).toHaveBeenCalledWith(BroadcastMsg.PitCommand, PitCommandMode.FR, 0, 0);
    });
  });

  describe("clearFastRepair", () => {
    it("should send clear fast repair command", () => {
      pitCommand.clearFastRepair();

      expect(mockNative.broadcastMsg).toHaveBeenCalledWith(BroadcastMsg.PitCommand, PitCommandMode.ClearFR, 0, 0);
    });
  });

  describe("tireCompound", () => {
    it("should send tire compound command", () => {
      pitCommand.tireCompound(1);

      expect(mockNative.broadcastMsg).toHaveBeenCalledWith(BroadcastMsg.PitCommand, PitCommandMode.TC, 1, 0);
    });
  });

  describe("windshield", () => {
    it("should send windshield command", () => {
      pitCommand.windshield();

      expect(mockNative.broadcastMsg).toHaveBeenCalledWith(BroadcastMsg.PitCommand, PitCommandMode.WS, 0, 0);
    });
  });

  describe("clearWindshield", () => {
    it("should send clear windshield command", () => {
      pitCommand.clearWindshield();

      expect(mockNative.broadcastMsg).toHaveBeenCalledWith(BroadcastMsg.PitCommand, PitCommandMode.ClearWS, 0, 0);
    });
  });

  describe("convenience methods", () => {
    it("allTires should call all four tire commands", () => {
      pitCommand.allTires(200);

      expect(mockNative.broadcastMsg).toHaveBeenCalledTimes(4);
      expect(mockNative.broadcastMsg).toHaveBeenCalledWith(BroadcastMsg.PitCommand, PitCommandMode.LF, 200, 0);
      expect(mockNative.broadcastMsg).toHaveBeenCalledWith(BroadcastMsg.PitCommand, PitCommandMode.RF, 200, 0);
      expect(mockNative.broadcastMsg).toHaveBeenCalledWith(BroadcastMsg.PitCommand, PitCommandMode.LR, 200, 0);
      expect(mockNative.broadcastMsg).toHaveBeenCalledWith(BroadcastMsg.PitCommand, PitCommandMode.RR, 200, 0);
    });

    it("frontTires should call front tire commands", () => {
      pitCommand.frontTires(200);

      expect(mockNative.broadcastMsg).toHaveBeenCalledTimes(2);
      expect(mockNative.broadcastMsg).toHaveBeenCalledWith(BroadcastMsg.PitCommand, PitCommandMode.LF, 200, 0);
      expect(mockNative.broadcastMsg).toHaveBeenCalledWith(BroadcastMsg.PitCommand, PitCommandMode.RF, 200, 0);
    });

    it("rearTires should call rear tire commands", () => {
      pitCommand.rearTires(200);

      expect(mockNative.broadcastMsg).toHaveBeenCalledTimes(2);
      expect(mockNative.broadcastMsg).toHaveBeenCalledWith(BroadcastMsg.PitCommand, PitCommandMode.LR, 200, 0);
      expect(mockNative.broadcastMsg).toHaveBeenCalledWith(BroadcastMsg.PitCommand, PitCommandMode.RR, 200, 0);
    });

    it("leftTires should call left side tire commands", () => {
      pitCommand.leftTires(200);

      expect(mockNative.broadcastMsg).toHaveBeenCalledTimes(2);
      expect(mockNative.broadcastMsg).toHaveBeenCalledWith(BroadcastMsg.PitCommand, PitCommandMode.LF, 200, 0);
      expect(mockNative.broadcastMsg).toHaveBeenCalledWith(BroadcastMsg.PitCommand, PitCommandMode.LR, 200, 0);
    });

    it("rightTires should call right side tire commands", () => {
      pitCommand.rightTires(200);

      expect(mockNative.broadcastMsg).toHaveBeenCalledTimes(2);
      expect(mockNative.broadcastMsg).toHaveBeenCalledWith(BroadcastMsg.PitCommand, PitCommandMode.RF, 200, 0);
      expect(mockNative.broadcastMsg).toHaveBeenCalledWith(BroadcastMsg.PitCommand, PitCommandMode.RR, 200, 0);
    });
  });

  describe("return values", () => {
    it("all methods should return true (broadcast always succeeds)", () => {
      expect(pitCommand.clear()).toBe(true);
      expect(pitCommand.fuel(50)).toBe(true);
      expect(pitCommand.clearFuel()).toBe(true);
      expect(pitCommand.leftFront()).toBe(true);
      expect(pitCommand.rightFront()).toBe(true);
      expect(pitCommand.leftRear()).toBe(true);
      expect(pitCommand.rightRear()).toBe(true);
      expect(pitCommand.clearTires()).toBe(true);
      expect(pitCommand.fastRepair()).toBe(true);
      expect(pitCommand.clearFastRepair()).toBe(true);
      expect(pitCommand.tireCompound(0)).toBe(true);
      expect(pitCommand.windshield()).toBe(true);
      expect(pitCommand.clearWindshield()).toBe(true);
    });
  });
});
