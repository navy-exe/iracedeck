# Splits Delta Cycle

Cycles through split-time delta display modes.

## Properties

| Property | Value |
|----------|-------|
| Action ID | `com.iracedeck.sd.core.splits-delta-cycle` |
| Type | Multi-toggle |
| SDK Support | No |
| Encoder Support | Yes |

## Behavior

### Button Press
Triggers the direction configured in Settings (next or previous).

### Encoder
- **Rotate clockwise**: Next splits delta display
- **Rotate counter-clockwise**: Previous splits delta display

## Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Direction | Dropdown | Next | Cycle direction |

### Direction Options
- **Next** - Cycle to next display mode
- **Previous** - Cycle to previous display mode

## Keyboard Simulation

| Action | Default Key | iRacing Setting |
|--------|-------------|-----------------|
| Next | TAB | Next Splits Delta Display |
| Previous | Shift+TAB | Prev Splits Delta Display |

## Icon States

| State | Icon |
|-------|------|
| Next | Delta icon with up arrow |
| Previous | Delta icon with down arrow |

## Notes

- Uses default iRacing keybindings (TAB / Shift+TAB)
- Cycles through: Off, Session Best, Session Optimal, Personal Best, etc.
