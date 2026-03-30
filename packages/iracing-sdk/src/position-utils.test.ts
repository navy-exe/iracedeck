import { describe, expect, it } from "vitest";

import { calculateRacePositions } from "./position-utils.js";
import type { TelemetryData } from "./types.js";

function makeTelemetry(overrides: Partial<TelemetryData> = {}): TelemetryData {
  return {
    CarIdxLapCompleted: [4, 5, 3],
    CarIdxLapDistPct: [0.5, 0.7, 0.3],
    ...overrides,
  } as TelemetryData;
}

describe("calculateRacePositions", () => {
  it("should rank cars by lapsCompleted + lapDistPct descending", () => {
    const result = calculateRacePositions(makeTelemetry());
    expect(result[0]).toBe(2);
    expect(result[1]).toBe(1);
    expect(result[2]).toBe(3);
  });

  it("should use lapDistPct as tiebreaker within same lap", () => {
    const telemetry = makeTelemetry({
      CarIdxLapCompleted: [5, 5, 5],
      CarIdxLapDistPct: [0.3, 0.9, 0.6],
    });
    const result = calculateRacePositions(telemetry);
    expect(result[0]).toBe(3);
    expect(result[1]).toBe(1);
    expect(result[2]).toBe(2);
  });

  it("should use lower carIdx as tiebreaker for identical scores", () => {
    const telemetry = makeTelemetry({
      CarIdxLapCompleted: [5, 5],
      CarIdxLapDistPct: [0.5, 0.5],
    });
    const result = calculateRacePositions(telemetry);
    expect(result[0]).toBe(1);
    expect(result[1]).toBe(2);
  });

  it("should assign 0 to inactive cars with lapCompleted < 0", () => {
    const telemetry = makeTelemetry({
      CarIdxLapCompleted: [4, -1, 3],
      CarIdxLapDistPct: [0.5, 0.7, 0.3],
    });
    const result = calculateRacePositions(telemetry);
    expect(result[0]).toBe(1);
    expect(result[1]).toBe(0);
    expect(result[2]).toBe(2);
  });

  it("should assign 0 to inactive cars with lapDistPct < 0", () => {
    const telemetry = makeTelemetry({
      CarIdxLapCompleted: [4, 5, 3],
      CarIdxLapDistPct: [0.5, -1, 0.3],
    });
    const result = calculateRacePositions(telemetry);
    expect(result[0]).toBe(1);
    expect(result[1]).toBe(0);
    expect(result[2]).toBe(2);
  });

  it("should handle grid scenario (all lap 0)", () => {
    const telemetry = makeTelemetry({
      CarIdxLapCompleted: [0, 0, 0],
      CarIdxLapDistPct: [0.8, 0.9, 0.7],
    });
    const result = calculateRacePositions(telemetry);
    expect(result[0]).toBe(2);
    expect(result[1]).toBe(1);
    expect(result[2]).toBe(3);
  });

  it("should return empty array for null telemetry", () => {
    expect(calculateRacePositions(null)).toEqual([]);
  });

  it("should return empty array when CarIdxLapCompleted is missing", () => {
    const telemetry = makeTelemetry({
      CarIdxLapCompleted: undefined,
      CarIdxLapDistPct: [0.5],
    });
    expect(calculateRacePositions(telemetry)).toEqual([]);
  });

  it("should return empty array when CarIdxLapDistPct is missing", () => {
    const telemetry = makeTelemetry({
      CarIdxLapCompleted: [4],
      CarIdxLapDistPct: undefined,
    });
    expect(calculateRacePositions(telemetry)).toEqual([]);
  });

  it("should handle mixed active and inactive cars", () => {
    const telemetry = makeTelemetry({
      CarIdxLapCompleted: [-1, 5, 3, -1, 4],
      CarIdxLapDistPct: [0.5, 0.7, 0.3, -1, 0.6],
    });
    const result = calculateRacePositions(telemetry);
    expect(result[0]).toBe(0);
    expect(result[1]).toBe(1);
    expect(result[2]).toBe(3);
    expect(result[3]).toBe(0);
    expect(result[4]).toBe(2);
  });

  it("should handle lapDistPct slightly above 1.0", () => {
    const telemetry = makeTelemetry({
      CarIdxLapCompleted: [10, 10],
      CarIdxLapDistPct: [1.02, 0.98],
    });
    const result = calculateRacePositions(telemetry);
    expect(result[0]).toBe(1);
    expect(result[1]).toBe(2);
  });
});
