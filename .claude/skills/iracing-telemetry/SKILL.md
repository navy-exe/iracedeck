---
name: iracing-telemetry
description: Use when looking up iRacing telemetry variable names, types, units, or descriptions, or when implementing actions that consume live telemetry data
---

# iRacing Telemetry Variable Reference

## Data File

Complete variable definitions (429 variables): `docs/reference/telemetry-vars.json`

Source: https://github.com/bengsfort/irsdk-node/blob/main/packages/irsdk-node-types/cache.telemetry-vars.json

Each variable entry:
```json
"Speed": {
  "description": "GPS vehicle speed",
  "length": 1,
  "countAsTime": false,
  "unit": "m/s",
  "type": "number"
}
```

## How to Use

When asked about telemetry variables:
1. Read `docs/reference/telemetry-vars.json` and search by variable name or description keyword
2. Report: name, type, unit, length, description
3. Check if the variable is already typed in `packages/iracing-native/src/defines.ts` (`TelemetryData` interface)
4. If not typed yet, show how to add it to `TelemetryData` with the correct TypeScript type

## Length Values

| Length | Meaning | TypeScript Type |
|--------|---------|-----------------|
| 1 | Scalar value | `number` or `boolean` |
| 64 | Per-car array (indexed by car index) | `number[]` or `boolean[]` |
| 6 | High-frequency 360Hz samples (`countAsTime: true`) | `number[]` |

## Variable Categories

| Category | Pattern | Count | Examples |
|----------|---------|-------|----------|
| Tire/Shock | `LF*`, `RF*`, `LR*`, `RR*`, `CF*`, `CR*` | 88 | `LFtempCM`, `RRwearL`, `LFshockDefl` |
| In-Car Adjustments | `dc*` | 42 | `dcBrakeBias`, `dcTractionControl`, `dcDRSToggle` |
| Lap/Timing | `Lap*`, `Race*` | 28 | `Lap`, `LapBestLapTime`, `LapDistPct` |
| Per-Car Arrays | `CarIdx*` | 27 | `CarIdxPosition`, `CarIdxLapDistPct`, `CarIdxGear` |
| Pit Adjustments | `dp*` | 24 | `dpFuelAddKg`, `dpRFTireChange`, `dpWingFront` |
| Player Car | `Player*` | 22 | `PlayerCarPosition`, `PlayerCarMyIncidentCount` |
| High-Freq 360Hz | `*_ST` | 17 | `LatAccel_ST`, `LFshockDefl_ST` |
| Pit Service | `Pit*`, `FastRepair*` | 16 | `PitSvFlags`, `PitSvFuel`, `PitRepairLeft` |
| Steering/FFB | `Steering*` | 14 | `SteeringWheelAngle`, `SteeringWheelTorque` |
| Session | `Session*` | 14 | `SessionFlags`, `SessionTimeRemain`, `SessionState` |
| Environment | `Air*`, `Wind*`, `Track*`, `Solar*`, `Fog*` | 14 | `AirTemp`, `TrackWetness`, `WindVel` |
| Camera/Replay | `Cam*`, `Replay*` | 11 | `CamCarIdx`, `ReplayPlaySpeed` |
| Hybrid/ERS | `Energy*`, `Power*`, `DRS_*` | 10 | `EnergyERSBatteryPct`, `PowerMGU_K` |
| Other | Various | 102 | `Speed`, `RPM`, `FuelLevel`, `Gear`, `Brake`, `Throttle` |

## Bitfield & Enum Mapping

Variables with `irsdk_*` unit values map to TypeScript enums in `packages/iracing-native/src/defines.ts`:

| JSON Unit | TypeScript Enum | Used By Variables |
|-----------|----------------|-------------------|
| `irsdk_Flags` | `Flags` | `SessionFlags`, `CarIdxSessionFlags` |
| `irsdk_EngineWarnings` | `EngineWarnings` | `EngineWarnings` |
| `irsdk_PitSvFlags` | `PitSvFlags` | `PitSvFlags` |
| `irsdk_PitSvStatus` | `PitSvStatus` | `PitSvStatus` |
| `irsdk_SessionState` | `SessionState` | `SessionState` |
| `irsdk_TrkLoc` | `TrkLoc` | `PlayerTrackSurface`, `CarIdxTrackSurface` |
| `irsdk_TrkSurf` | `TrkSurf` | `PlayerTrackSurfaceMaterial`, `CarIdxTrackSurfaceMaterial` |
| `irsdk_PaceMode` | `PaceMode` | `PaceMode` |
| `irsdk_PaceFlags` | `PaceFlags` | `CarIdxPaceFlags` |
| `irsdk_TrackWetness` | `TrackWetness` | `TrackWetness` |
| `irsdk_CarLeftRight` | `CarLeftRight` | `CarLeftRight` |
| `irsdk_CameraState` | `CameraState` | `CamCameraState` |
| `irsdk_IncidentFlags` | `IncidentFlags` | (per-car incident data) |

Use `hasFlag()` from `@iracedeck/iracing-sdk` to check bitfield values.

## Common Units

| Unit | Meaning | Count |
|------|---------|-------|
| *(empty)* | Dimensionless / enum / boolean | 172 |
| `%` | Percentage (0-1 or 0-100, check description) | 42 |
| `m` | Meters | 37 |
| `m/s` | Meters per second | 35 |
| `s` | Seconds | 25 |
| `C` | Celsius | 17 |
| `rad` | Radians | 10 |
| `revs/min` | RPM | 8 |
| `kPa` | Kilopascals | 8 |
| `bar` | Bar (pressure) | 7 |

## Key Project Files

| File | Role |
|------|------|
| `packages/iracing-native/src/defines.ts` | `TelemetryData` interface, enums, bitfield definitions |
| `packages/iracing-sdk/src/IRacingSDK.ts` | Parses telemetry from shared memory buffer |
| `packages/iracing-sdk/src/SDKController.ts` | 4Hz update loop, subscription management |
| `packages/iracing-sdk/src/telemetry-snapshot.ts` | CLI tool to capture live telemetry (`--vars=Speed,Gear`) |
