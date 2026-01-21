# Black Box Selector

Cycles through or directly selects iRacing black box screens.

## Properties

| Property | Value |
|----------|-------|
| Action ID | `com.iracedeck.sd.core.black-box-selector` |
| Type | Multi-toggle |
| SDK Support | No |
| Encoder Support | Yes |

## Behavior

### Button Press
- **Short press**: Opens selected black box (from settings) or cycles to next
- **Long press**: Cycles to previous black box

### Encoder
- **Rotate clockwise**: Next black box
- **Rotate counter-clockwise**: Previous black box
- **Press**: Open currently displayed black box

## Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Mode | Dropdown | Cycle | `Cycle` or `Direct` selection |
| Black Box | Dropdown | Lap Timing | Target black box (Direct mode only) |

### Black Box Options

| Option | Key | iRacing Setting |
|--------|-----|-----------------|
| Lap Timing | F1 | Lap Timing Black Box |
| Standings | F2 | Standings Black Box |
| Relative | F3 | Relative Black Box |
| Fuel | F4 | Fuel Black Box |
| Tires | F5 | Tires Black Box |
| Tire Info | F6 | Tire Info Black Box |
| Pit-stop Adjustments | F7 | Pit-stop Adjustments Black Box |
| In-car Adjustments | F8 | In-car Adjustments Black Box |
| Mirror Adjustments | F9 | Mirror Adjustments Black Box |
| Radio Adjustments | F10 | Radio Adjustments Black Box |
| Weather | F11 | Weather Black Box |

## Icon States

| State | Description |
|-------|-------------|
| Default | Shows black box icon with current selection label |
| Cycle mode | Shows "BB" with cycle arrows |

## Keyboard Simulation

- Direct selection: `F1`–`F11` based on selection
- Cycle next: Simulates "Next Black Box" binding
- Cycle previous: Simulates "Previous Black Box" binding

## Notes

- Cycle mode requires user to bind "Next Black Box" and "Previous Black Box" in iRacing
- Direct mode uses F1–F11 keys which are default iRacing bindings
