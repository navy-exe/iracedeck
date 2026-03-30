# Calculated Race Position

**Issue:** #233
**Date:** 2026-03-30

## Problem

iRacing's native `PlayerCarPosition` and `CarIdxPosition` telemetry variables can lag behind real-time track state. Position should be calculated from `CarIdxLapCompleted + CarIdxLapDistPct` for more accurate, real-time race positions.

## Design

### Utility Function

**File:** `packages/iracing-sdk/src/position-utils.ts`

```typescript
export function calculateRacePositions(telemetry: TelemetryData | null): number[]
```

**Algorithm:**

1. Read `CarIdxLapCompleted[]` and `CarIdxLapDistPct[]` from telemetry
2. For each car index, determine if active: `lapCompleted >= 0` AND `lapDistPct >= 0`
3. For each active car, compute score: `lapCompleted + lapDistPct`
4. Sort active cars by score descending (highest score = P1). Tiebreaker: lower `carIdx` wins (deterministic ordering to prevent position flickering)
5. Return `number[]` indexed by `carIdx` — value is 1-based position, `0` for inactive cars

The score formula naturally handles all scenarios:
- **Grid:** all cars at lap 0, `lapDistPct` varies by grid slot — correct order
- **Mid-race:** `10 + 0.8 > 10 + 0.3 > 9 + 0.9` — correct
- **`lapDistPct > 1.0`:** can happen at angled start/finish lines — harmless, just adds to score

### Session Type Gating

The utility is a pure calculation with no session awareness. Consumers gate by session type:
- **Race sessions** (`SessionType === "Race"`): use `calculateRacePositions()`
- **Non-race sessions** (practice, qualifying): use native `CarIdxPosition`/`PlayerCarPosition`

Session type is determined from `SessionInfo.Sessions[SessionNum].SessionType`.

### Consumer Changes

#### session-info.ts (position mode)

Currently reads `telemetry.PlayerCarPosition`. Changes:

1. Check if current session is a race
2. If race: call `calculateRacePositions(telemetry)` and look up `result[playerCarIdx]`
3. If not race: use `telemetry.PlayerCarPosition` as today

`playerCarIdx` and session type are read from `this.sdkController.getSessionInfo()`, following the existing pattern used by `countActiveCars()` in the same file.

#### template-context.ts

Three functions change to accept a pre-computed positions array instead of reading `CarIdxPosition` directly:

1. **`findDriverByRacePosition()`** — receives positions array, uses it to find player position and car at offset
2. **`buildDriverFields()`** — receives positions array, looks up `positions[driver.CarIdx]`
3. **`buildSelfFields()`** — receives positions array, uses it instead of `PlayerCarPosition`/`CarIdxPosition`

**`buildTemplateContext()`** is the orchestrator:
- Determines session type
- Computes positions array once (calculated for race, native `CarIdxPosition` for non-race)
- Passes it to all helper functions

## Testing

### position-utils.test.ts (new)

| Scenario | Description |
|----------|-------------|
| Basic ordering | 3 cars with different scores — verify correct P1/P2/P3 |
| Same laps, different dist pct | Tiebreaker by `lapDistPct` |
| Inactive filtering | Cars with `lapCompleted < 0` or `lapDistPct < 0` get position `0` |
| Grid scenario | All lap 0, positions by dist pct only |
| Null/missing telemetry | Returns empty array |
| Mixed active/inactive | Some cars active, some inactive |

### template-context.test.ts (update existing)

- Update `findDriverByRacePosition` tests to pass positions array
- Add test: race session uses calculated positions for self/race_ahead/race_behind
- Add test: non-race session uses native `CarIdxPosition`

### session-info.test.ts (update existing)

- Test position mode uses calculated position in race session
- Test position mode uses native `PlayerCarPosition` in non-race session

## Notes

- **Pace car handling:** The positions array includes entries for all car indices including the pace car. This is filtered at lookup time — `findDriverByRacePosition()` only iterates over `drivers` (which excludes pace car/spectators via `extractDrivers()`), so the pace car never appears in results.
- **Pre-green-flag:** Before cars roll, multiple cars may have identical scores (all `0.0`). The carIdx tiebreaker provides deterministic ordering but may not match the official grid order. This is acceptable — iRacing's native `CarIdxPosition` is similarly unreliable before the green flag.

## Scope

- **In scope:** overall race position calculation, session-info.ts, template-context.ts
- **Out of scope:** class position (see #234)
