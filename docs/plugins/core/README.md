# Core Plugin (`com.iracedeck.sd.core`)

Core driving, cockpit, and interface controls for iRacing. Maps to the "In Car" section of [keyboard shortcuts](../../keyboard-shortcuts.md).

See [Action Types](../action-types.md) for type definitions.

## Overview

| Property | Value |
|----------|-------|
| Plugin ID | `com.iracedeck.sd.core` |
| Actions | 26 |
| Category | Core Driving & Interface |

## Actions

| # | Action | Type | Documentation |
|---|--------|------|---------------|
| 1 | Black Box Selector | Multi-toggle | [Details](actions/black-box-selector.md) |
| 2 | Splits & Reference | Multi-toggle | [Details](actions/splits-delta-cycle.md) |
| 3 | Starter | Button | [Details](actions/starter.md) |
| 4 | Ignition | Button | [Details](actions/ignition.md) |
| 5 | Pit Speed Limiter | Toggle | [Details](actions/pit-speed-limiter.md) |
| 6 | Enter/Exit/Tow Car | Button | [Details](actions/enter-exit-tow-car.md) |
| 7 | Autofuel Toggle | Toggle | [Details](actions/autofuel-toggle.md) |
| 8 | Autofuel Lap Margin | +/- | [Details](actions/autofuel-lap-margin.md) |
| 9 | Toggle Dash Box | Toggle | [Details](actions/toggle-dash-box.md) |
| 10 | Trigger Windshield Wipers | Button | [Details](actions/trigger-windshield-wipers.md) |
| 11 | Look Direction | Multi-toggle | [Details](actions/look-direction.md) |
| 12 | FOV Adjust | +/- | [Details](actions/fov-adjust.md) |
| 13 | Horizon Adjust (VanishY) | +/- | [Details](actions/horizon-adjust.md) |
| 14 | Driver Height Adjust | +/- | [Details](actions/driver-height-adjust.md) |
| 15 | Recenter VR View | Button | [Details](actions/recenter-vr-view.md) |
| 16 | Speed/Gear/Pedals Display | Toggle | [Details](actions/speed-gear-pedals-display.md) |
| 17 | Radio Display | Toggle | [Details](actions/radio-display.md) |
| 18 | FPS/Network Display | Toggle | [Details](actions/fps-network-display.md) |
| 19 | Report Latency | Button | [Details](actions/report-latency.md) |
| 20 | Toggle Weather Radar | Toggle | [Details](actions/toggle-weather-radar.md) |
| 21 | Toggle Virtual Mirror | Toggle | [Details](actions/toggle-virtual-mirror.md) |
| 22 | Toggle UI Edit | Toggle | [Details](actions/toggle-ui-edit.md) |
| 23 | UI Size Adjust | +/- | [Details](actions/ui-size-adjust.md) |
| 24 | Pause Sim | Toggle | [Details](actions/pause-sim.md) |
| 25 | Set FFB Max Force | Adjustment | [Details](actions/set-ffb-max-force.md) |
| 26 | Adjust Master Volume | +/- | [Details](actions/adjust-master-volume.md) |

## Implementation Notes

- All actions require keyboard simulation (no SDK support for "In Car" controls)
- User must configure matching keybindings in iRacing settings
- Multi-toggle actions use Stream Deck's state system or property inspector dropdowns
