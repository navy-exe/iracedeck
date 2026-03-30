# Calculated Race Position Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace iRacing's native `PlayerCarPosition`/`CarIdxPosition` with a calculated position derived from `CarIdxLapCompleted + CarIdxLapDistPct` for more accurate real-time race positions.

**Architecture:** A pure utility function in `@iracedeck/iracing-sdk` calculates positions by scoring each car as `lapsCompleted + lapDistPct` and sorting descending. Consumers in `template-context.ts` and `session-info.ts` call this during race sessions, falling back to native telemetry for non-race sessions.

**Tech Stack:** TypeScript, Vitest

**Spec:** `docs/superpowers/specs/2026-03-30-calculated-race-position-design.md`

---

## File Structure

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `packages/iracing-sdk/src/position-utils.ts` | Pure function: `calculateRacePositions()` |
| Create | `packages/iracing-sdk/src/position-utils.test.ts` | Unit tests for position calculation |
| Modify | `packages/iracing-sdk/src/index.ts` | Export new function |
| Modify | `packages/iracing-sdk/src/template-context.ts` | Use calculated positions in race sessions |
| Modify | `packages/iracing-sdk/src/template-context.test.ts` | Update tests for new position flow |
| Modify | `packages/actions/src/actions/session-info.ts` | Use calculated positions in position mode |

---

### Task 1: Create `calculateRacePositions` with tests (TDD)

**Files:**
- Create: `packages/iracing-sdk/src/position-utils.test.ts`
- Create: `packages/iracing-sdk/src/position-utils.ts`

- [ ] **Step 1: Write the test file with all test cases**

```typescript
// packages/iracing-sdk/src/position-utils.test.ts
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
    // Car 0: 4 + 0.5 = 4.5 → P2
    // Car 1: 5 + 0.7 = 5.7 → P1
    // Car 2: 3 + 0.3 = 3.3 → P3
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

    // Car 1: 5.9 → P1, Car 2: 5.6 → P2, Car 0: 5.3 → P3
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

    // Identical scores: lower carIdx wins
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

    // Car 1: 0.9 → P1, Car 0: 0.8 → P2, Car 2: 0.7 → P3
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

    // Active: Car 1 (5.7→P1), Car 4 (4.6→P2), Car 2 (3.3→P3)
    // Inactive: Car 0, Car 3
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

    // Car 0: 11.02 → P1, Car 1: 10.98 → P2
    expect(result[0]).toBe(1);
    expect(result[1]).toBe(2);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd packages/iracing-sdk && pnpm test -- --run position-utils.test
```

Expected: FAIL — `calculateRacePositions` not found.

- [ ] **Step 3: Implement `calculateRacePositions`**

```typescript
// packages/iracing-sdk/src/position-utils.ts
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

  // Collect active cars with their scores
  const active: { idx: number; score: number }[] = [];
  for (let i = 0; i < length; i++) {
    if (lapCompleted[i] >= 0 && lapDistPct[i] >= 0) {
      active.push({ idx: i, score: lapCompleted[i] + lapDistPct[i] });
    }
  }

  // Sort by score descending, tiebreaker: lower carIdx first
  active.sort((a, b) => b.score - a.score || a.idx - b.idx);

  // Build result array
  const result = new Array<number>(length).fill(0);
  for (let rank = 0; rank < active.length; rank++) {
    result[active[rank].idx] = rank + 1;
  }

  return result;
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd packages/iracing-sdk && pnpm test -- --run position-utils.test
```

Expected: All tests PASS.

- [ ] **Step 5: Export from package index**

In `packages/iracing-sdk/src/index.ts`, add after the `track-utils` export line:

```typescript
export { calculateRacePositions } from "./position-utils.js";
```

- [ ] **Step 6: Commit**

```bash
git add packages/iracing-sdk/src/position-utils.ts packages/iracing-sdk/src/position-utils.test.ts packages/iracing-sdk/src/index.ts
git commit -m "feat(iracing-sdk): add calculateRacePositions utility (#233)"
```

---

### Task 2: Update `template-context.ts` to use calculated positions

**Files:**
- Modify: `packages/iracing-sdk/src/template-context.ts`
- Modify: `packages/iracing-sdk/src/template-context.test.ts`

**Context:** Three internal functions need to accept a positions array parameter instead of reading `CarIdxPosition` directly. The orchestrator `buildTemplateContextFromData` determines session type and computes positions once.

- [ ] **Step 1: Fix existing test that will break under race session gating**

The existing test "should use player-specific telemetry for self fields" (line 374) uses `makeSessionInfo` which creates a Race session. After our changes, `self.position` would use calculated positions instead of `PlayerCarPosition`. Change this test's session type to Practice so it continues testing the native telemetry fallback path:

In `template-context.test.ts`, change the test at line 374:

```typescript
it("should use player-specific telemetry for self fields in non-race sessions", () => {
  const drivers = [makeDriver({ CarIdx: 0, UserName: "Player" })];
  const sessionInfo = {
    DriverInfo: { DriverCarIdx: 0, Drivers: drivers },
    WeekendInfo: { TrackDisplayName: "Spa", TrackDisplayShortName: "Spa" },
    SessionInfo: { Sessions: [{ SessionType: "Practice", SessionName: "PRACTICE" }] },
  } as unknown as SessionInfo;
  const telemetry = makeTelemetry({
    PlayerCarPosition: 5,
    PlayerCarClassPosition: 3,
    Lap: 12,
    LapCompleted: 11,
    PlayerCarMyIncidentCount: 7,
    CarIdxPosition: [99],
  });

  const ctx = buildTemplateContextFromData(telemetry, sessionInfo);

  expect(ctx["self.position"]).toBe("5");
  expect(ctx["self.class_position"]).toBe("3");
  expect(ctx["self.lap"]).toBe("12");
  expect(ctx["self.laps_completed"]).toBe("11");
  expect(ctx["self.incidents"]).toBe("7");
});
```

- [ ] **Step 2: Write failing tests for race session calculated positions**

Add to the `findDriverByRacePosition` describe block in `template-context.test.ts`:

```typescript
it("should use provided positions array instead of CarIdxPosition", () => {
  const drivers = [
    makeDriver({ CarIdx: 0, UserName: "Player" }),
    makeDriver({ CarIdx: 1, UserName: "Actually First" }),
    makeDriver({ CarIdx: 2, UserName: "Actually Third" }),
  ];

  // CarIdxPosition says car 1 is P1, but our calculated positions say car 2 is P1
  const telemetry = makeTelemetry({ CarIdxPosition: [2, 1, 3] });
  const calculatedPositions = [2, 3, 1]; // Car 2 is P1, Car 0 is P2, Car 1 is P3

  const result = findDriverByRacePosition(0, drivers, telemetry, -1, calculatedPositions);

  expect(result?.UserName).toBe("Actually Third"); // Car 2 at P1, ahead of player at P2
});
```

Add to the `buildTemplateContextFromData` describe block:

```typescript
it("should use calculated positions for race sessions", () => {
  const drivers = [
    makeDriver({ CarIdx: 0, UserName: "Player" }),
    makeDriver({ CarIdx: 1, UserName: "Leader" }),
    makeDriver({ CarIdx: 2, UserName: "Behind" }),
  ];

  // CarIdxPosition says Player is P2, but calculated position (from laps+dist) makes Player P1
  const sessionInfo = makeSessionInfo(drivers, 0);
  const telemetry = makeTelemetry({
    PlayerCarPosition: 2,
    CarIdxPosition: [2, 1, 3],
    // Calculated: Car 0 = 4.5, Car 1 = 5.7, Car 2 = 3.3
    // → Car 1 = P1, Car 0 = P2, Car 2 = P3 (matches CarIdxPosition in this case)
    CarIdxLapCompleted: [10, 5, 3],
    CarIdxLapDistPct: [0.9, 0.1, 0.3],
    // Calculated: Car 0 = 10.9 → P1, Car 1 = 5.1 → P2, Car 2 = 3.3 → P3
  });

  const ctx = buildTemplateContextFromData(telemetry, sessionInfo);

  // self.position should reflect calculated P1, not PlayerCarPosition (2)
  expect(ctx["self.position"]).toBe("1");
  expect(ctx["race_behind.name"]).toBe("Leader"); // Car 1 at P2 is behind player at P1
});

it("should use native CarIdxPosition for non-race sessions", () => {
  const drivers = [
    makeDriver({ CarIdx: 0, UserName: "Player" }),
    makeDriver({ CarIdx: 1, UserName: "Other" }),
  ];

  const sessionInfo = {
    DriverInfo: { DriverCarIdx: 0, Drivers: drivers },
    WeekendInfo: { TrackDisplayName: "Spa", TrackDisplayShortName: "Spa" },
    SessionInfo: { Sessions: [{ SessionType: "Practice", SessionName: "PRACTICE" }] },
  } as unknown as SessionInfo;

  const telemetry = makeTelemetry({
    PlayerCarPosition: 2,
    CarIdxPosition: [2, 1],
    CarIdxLapCompleted: [10, 5],
    CarIdxLapDistPct: [0.9, 0.1],
  });

  const ctx = buildTemplateContextFromData(telemetry, sessionInfo);

  // Non-race: should use PlayerCarPosition (2), not calculated (1)
  expect(ctx["self.position"]).toBe("2");
});
```

- [ ] **Step 3: Run tests to verify new tests fail**

```bash
cd packages/iracing-sdk && pnpm test -- --run template-context.test
```

Expected: FAIL — new tests fail because the functions don't yet accept/use the positions parameter. The modified existing test should still pass.

- [ ] **Step 4: Add session type helper**

Add a private helper function to `template-context.ts` (before `buildSessionFields`):

```typescript
function isRaceSession(sessionInfo: SessionInfo | null, telemetry: TelemetryData | null): boolean {
  if (!sessionInfo) return false;

  const sessions = (sessionInfo as Record<string, unknown>).SessionInfo as Record<string, unknown> | undefined;
  const sessionList = sessions?.Sessions as Array<Record<string, unknown>> | undefined;
  const sessionNum = telemetry?.SessionNum ?? 0;
  const currentSession = sessionList?.[sessionNum as number];

  return (currentSession?.SessionType as string) === "Race";
}
```

- [ ] **Step 5: Update `findDriverByRacePosition` to accept optional positions array**

Change the signature and implementation at line 284:

```typescript
export function findDriverByRacePosition(
  playerCarIdx: number,
  drivers: DriverEntry[],
  telemetry: TelemetryData | null,
  offset: number,
  positions?: number[],
): DriverEntry | null {
  const posArray = positions ?? telemetry?.CarIdxPosition;
  if (!posArray) return null;

  const playerPosition = posArray[playerCarIdx];

  if (!playerPosition || playerPosition < 1) return null;

  const targetPosition = playerPosition + offset;

  if (targetPosition < 1) return null;

  for (const driver of drivers) {
    if (posArray[driver.CarIdx] === targetPosition) {
      return driver;
    }
  }

  return null;
}
```

- [ ] **Step 6: Update `buildDriverFields` to accept optional positions array**

Change the signature at line 311:

```typescript
function buildDriverFields(
  driver: DriverEntry,
  telemetry: TelemetryData | null,
  positions?: number[],
): DriverFields {
  const { firstName, lastName } = splitDriverName(driver.UserName);

  return {
    name: driver.UserName,
    first_name: firstName,
    last_name: lastName,
    abbrev_name: driver.AbbrevName,
    car_number: driver.CarNumber,
    position: positions?.[driver.CarIdx]?.toString() ?? telemetry?.CarIdxPosition?.[driver.CarIdx]?.toString() ?? "",
    class_position: telemetry?.CarIdxClassPosition?.[driver.CarIdx]?.toString() ?? "",
    lap: telemetry?.CarIdxLap?.[driver.CarIdx]?.toString() ?? "",
    laps_completed: telemetry?.CarIdxLapCompleted?.[driver.CarIdx]?.toString() ?? "",
    irating: driver.IRating?.toString() ?? "",
    license: driver.LicString ?? "",
  };
}
```

- [ ] **Step 7: Update `buildSelfFields` to accept optional positions array**

Change the signature at line 329:

```typescript
function buildSelfFields(
  driver: DriverEntry | undefined,
  playerCarIdx: number,
  telemetry: TelemetryData | null,
  positions?: number[],
): SelfDriverFields {
  if (!driver) return { ...EMPTY_SELF_FIELDS };

  const base = buildDriverFields(driver, telemetry, positions);

  return {
    ...base,
    position: positions?.[playerCarIdx]?.toString() ?? telemetry?.PlayerCarPosition?.toString() ?? base.position,
    class_position: telemetry?.PlayerCarClassPosition?.toString() ?? base.class_position,
    lap: telemetry?.Lap?.toString() ?? base.lap,
    laps_completed: telemetry?.LapCompleted?.toString() ?? base.laps_completed,
    incidents: telemetry?.PlayerCarMyIncidentCount?.toString() ?? "",
  };
}
```

- [ ] **Step 8: Update `buildTemplateContextFromData` to compute and pass positions**

Add import at top of file:

```typescript
import { calculateRacePositions } from "./position-utils.js";
```

Update the `buildTemplateContextFromData` function body (lines 172-231):

```typescript
export function buildTemplateContextFromData(
  telemetry: TelemetryData | null,
  sessionInfo: SessionInfo | null,
): TemplateContext {
  const drivers = extractDrivers(sessionInfo);
  const playerCarIdx = extractPlayerCarIdx(sessionInfo);

  // Use calculated positions for race sessions, native for non-race
  const positions = isRaceSession(sessionInfo, telemetry)
    ? calculateRacePositions(telemetry)
    : undefined;

  const selfDriver = drivers.find((d) => d.CarIdx === playerCarIdx);
  const selfFields = buildSelfFields(selfDriver, playerCarIdx, telemetry, positions);

  const trackAhead = findNearestDriverOnTrack(playerCarIdx, drivers, telemetry, "ahead");
  const trackBehind = findNearestDriverOnTrack(playerCarIdx, drivers, telemetry, "behind");
  const raceAhead = findDriverByRacePosition(playerCarIdx, drivers, telemetry, -1, positions);
  const raceBehind = findDriverByRacePosition(playerCarIdx, drivers, telemetry, +1, positions);

  const sessionFields = buildSessionFields(sessionInfo, telemetry);
  const trackFields = buildTrackFields(sessionInfo);

  return {
    ...prefixKeys("self", selfFields as unknown as Record<string, string>),
    ...prefixKeys(
      "track_ahead",
      (trackAhead ? buildDriverFields(trackAhead, telemetry, positions) : { ...EMPTY_DRIVER_FIELDS }) as unknown as Record<
        string,
        string
      >,
    ),
    ...prefixKeys(
      "track_behind",
      (trackBehind ? buildDriverFields(trackBehind, telemetry, positions) : { ...EMPTY_DRIVER_FIELDS }) as unknown as Record<
        string,
        string
      >,
    ),
    ...prefixKeys(
      "race_ahead",
      (raceAhead ? buildDriverFields(raceAhead, telemetry, positions) : { ...EMPTY_DRIVER_FIELDS }) as unknown as Record<
        string,
        string
      >,
    ),
    ...prefixKeys(
      "race_behind",
      (raceBehind ? buildDriverFields(raceBehind, telemetry, positions) : { ...EMPTY_DRIVER_FIELDS }) as unknown as Record<
        string,
        string
      >,
    ),
    ...prefixKeys("session", sessionFields),
    ...prefixKeys("track", trackFields),
    ...prefixKeys(
      "telemetry",
      telemetry ? flattenForDisplay(telemetry as unknown as Record<string, unknown>, { excludePrefix: "CarIdx" }) : {},
    ),
    ...prefixKeys(
      "sessionInfo",
      sessionInfo ? flattenForDisplay(sessionInfo as unknown as Record<string, unknown>) : {},
    ),
  };
}
```

- [ ] **Step 9: Run tests to verify they pass**

```bash
cd packages/iracing-sdk && pnpm test -- --run template-context.test
```

Expected: All tests PASS (both new and existing).

- [ ] **Step 10: Commit**

```bash
git add packages/iracing-sdk/src/template-context.ts packages/iracing-sdk/src/template-context.test.ts
git commit -m "feat(iracing-sdk): use calculated positions in template context for race sessions (#233)"
```

---

### Task 3: Update `session-info.ts` to use calculated positions

**Files:**
- Modify: `packages/actions/src/actions/session-info.ts`
- Modify: `packages/actions/src/actions/session-info.test.ts`

**Context:** The `extractDisplayValue` method reads `telemetry.PlayerCarPosition` for position mode. It needs to use `calculateRacePositions()` during race sessions instead. Session info is already available via `this.sdkController.getSessionInfo()` (same pattern as `countActiveCars()`).

- [ ] **Step 1: Add import**

Add `calculateRacePositions` to the imports from `@iracedeck/iracing-sdk` in `session-info.ts`:

```typescript
import {
  calculateRacePositions,
  DisplayUnits,
  type FlagInfo,
  type SessionInfo as IRacingSessionInfo,
  resolveActiveFlag,
  type TelemetryData,
} from "@iracedeck/iracing-sdk";
```

- [ ] **Step 2: Add helper methods to SessionInfo class**

Add two private methods to the `SessionInfo` class (near `countActiveCars` at line 337):

```typescript
private isRaceSession(telemetry: TelemetryData | null): boolean {
  const sessionInfo = this.sdkController.getSessionInfo();
  if (!sessionInfo) return false;

  const sessions = (sessionInfo as Record<string, unknown>).SessionInfo as Record<string, unknown> | undefined;
  const sessionList = sessions?.Sessions as Array<Record<string, unknown>> | undefined;
  const sessionNum = telemetry?.SessionNum ?? 0;
  const currentSession = sessionList?.[sessionNum as number];

  return (currentSession?.SessionType as string) === "Race";
}

private getPlayerCarIdx(): number {
  const sessionInfo = this.sdkController.getSessionInfo();
  if (!sessionInfo) return -1;

  const driverInfo = (sessionInfo as Record<string, unknown>).DriverInfo as Record<string, unknown> | undefined;

  return (driverInfo?.DriverCarIdx as number) ?? -1;
}
```

- [ ] **Step 3: Update position mode in `extractDisplayValue`**

Replace the position mode block (lines 291-303) with:

```typescript
if (settings.mode === "position") {
  let pos: number | undefined;

  if (this.isRaceSession(telemetry)) {
    const positions = calculateRacePositions(telemetry);
    const playerCarIdx = this.getPlayerCarIdx();

    pos = playerCarIdx >= 0 ? positions[playerCarIdx] : undefined;
    if (pos === 0) pos = undefined; // 0 means inactive
  } else {
    pos = telemetry.PlayerCarPosition;
  }

  if (pos === undefined) return settings.positionShowTotal ? "P-/-" : "P-";

  if (settings.positionShowTotal) {
    const totalCars = this.countActiveCars();

    return totalCars > 0 ? `P${pos}/${totalCars}` : `P${pos}`;
  }

  return `P${pos}`;
}
```

- [ ] **Step 4: Add tests for position mode with calculated positions**

Add to the `telemetry-aware lifecycle` describe block in `session-info.test.ts`:

```typescript
it("should use calculated position in race session", async () => {
  const sessionInfo = {
    DriverInfo: {
      DriverCarIdx: 0,
      Drivers: [
        { CarIdx: 0, UserName: "Player", CarIsPaceCar: 0, IsSpectator: 0 },
        { CarIdx: 1, UserName: "Other", CarIsPaceCar: 0, IsSpectator: 0 },
      ],
    },
    SessionInfo: { Sessions: [{ SessionType: "Race", SessionName: "RACE" }] },
  };

  action["sdkController"].getSessionInfo = vi.fn().mockReturnValue(sessionInfo);

  await action.onWillAppear(fakeEvent("action-1", { mode: "position" }) as any);

  // Trigger telemetry callback with data where calculated P1 differs from PlayerCarPosition
  const telemetryCallback = action["sdkController"].subscribe.mock.calls[0][1];
  await telemetryCallback({
    PlayerCarPosition: 2,
    SessionNum: 0,
    CarIdxLapCompleted: [10, 5],
    CarIdxLapDistPct: [0.9, 0.1],
    // Calculated: Car 0 = 10.9 → P1, Car 1 = 5.1 → P2
  });

  // Verify the icon was updated with P1 (calculated), not P2 (native)
  const lastCall = action["setKeyImage"].mock.calls.at(-1);
  expect(lastCall).toBeDefined();
  const decoded = decodeURIComponent(lastCall![1] as string);
  expect(decoded).toContain("P1");
});

it("should use native position in non-race session", async () => {
  const sessionInfo = {
    DriverInfo: {
      DriverCarIdx: 0,
      Drivers: [
        { CarIdx: 0, UserName: "Player", CarIsPaceCar: 0, IsSpectator: 0 },
        { CarIdx: 1, UserName: "Other", CarIsPaceCar: 0, IsSpectator: 0 },
      ],
    },
    SessionInfo: { Sessions: [{ SessionType: "Practice", SessionName: "PRACTICE" }] },
  };

  action["sdkController"].getSessionInfo = vi.fn().mockReturnValue(sessionInfo);

  await action.onWillAppear(fakeEvent("action-1", { mode: "position" }) as any);

  const telemetryCallback = action["sdkController"].subscribe.mock.calls[0][1];
  await telemetryCallback({
    PlayerCarPosition: 2,
    SessionNum: 0,
    CarIdxLapCompleted: [10, 5],
    CarIdxLapDistPct: [0.9, 0.1],
  });

  // Verify the icon uses P2 (native PlayerCarPosition), not P1 (calculated)
  const lastCall = action["setKeyImage"].mock.calls.at(-1);
  expect(lastCall).toBeDefined();
  const decoded = decodeURIComponent(lastCall![1] as string);
  expect(decoded).toContain("P2");
});
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd packages/actions && pnpm test -- --run session-info.test
```

Expected: All tests PASS. If the new tests fail because the mock's `setKeyImage` args differ from expected, adjust assertions to match the actual icon rendering pipeline (the mock renders SVG via `renderIconTemplate`).

- [ ] **Step 6: Build to verify compilation**

```bash
cd packages/actions && pnpm build
```

Expected: Build succeeds with no type errors.

- [ ] **Step 7: Commit**

```bash
git add packages/actions/src/actions/session-info.ts packages/actions/src/actions/session-info.test.ts
git commit -m "feat(actions): use calculated positions in session-info position mode (#233)"
```

---

### Task 4: Full build verification and final commit

**Files:** None (verification only)

- [ ] **Step 1: Run all tests**

```bash
pnpm test
```

Expected: All tests PASS.

- [ ] **Step 2: Run full build**

```bash
pnpm build
```

Expected: Build succeeds with no errors.

- [ ] **Step 3: Run lint and format**

```bash
pnpm lint:fix && pnpm format:fix
```

Expected: No errors. If any files are changed, commit them:

```bash
git add -A
git commit -m "chore: fix lint/format issues"
```
