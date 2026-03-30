import type { TelemetryData } from "./types.js";

/**
 * Calculates race positions from lap completion data.
 *
 * Scores each active car as `CarIdxLapCompleted + CarIdxLapDistPct` and sorts
 * descending to derive 1-based race positions. A car is active when both
 * `lapCompleted >= 0` AND `lapDistPct >= 0`.
 *
 * @returns Array indexed by carIdx — value is 1-based position, 0 for inactive cars.
 */
export function calculateRacePositions(telemetry: TelemetryData | null): number[] {
  if (!telemetry?.CarIdxLapCompleted || !telemetry?.CarIdxLapDistPct) return [];

  const lapCompleted = telemetry.CarIdxLapCompleted as number[];
  const lapDistPct = telemetry.CarIdxLapDistPct as number[];
  const length = Math.min(lapCompleted.length, lapDistPct.length);

  const active: { idx: number; score: number }[] = [];

  for (let i = 0; i < length; i++) {
    if (lapCompleted[i] >= 0 && lapDistPct[i] >= 0) {
      active.push({ idx: i, score: lapCompleted[i] + lapDistPct[i] });
    }
  }

  active.sort((a, b) => b.score - a.score || a.idx - b.idx);

  const result = new Array<number>(length).fill(0);

  for (let rank = 0; rank < active.length; rank++) {
    result[active[rank].idx] = rank + 1;
  }

  return result;
}
