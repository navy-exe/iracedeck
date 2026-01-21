# Autofuel Lap Margin

Adjusts the lap margin for automatic fuel calculation.

## Properties

| Property | Value |
|----------|-------|
| Action ID | `com.iracedeck.sd.core.autofuel-lap-margin` |
| Type | +/- |
| SDK Support | No |
| Encoder Support | Yes |

## Behavior

### Button Press
Triggers the direction configured in Property Inspector (increase or decrease).

### Encoder
- **Rotate clockwise**: Increase lap margin
- **Rotate counter-clockwise**: Decrease lap margin

## Property Inspector

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Direction | Dropdown | Increase | `Increase` or `Decrease` |

## Keyboard Simulation

| Action | Key | iRacing Setting |
|--------|-----|-----------------|
| Increase | Shift+Alt+X | Autofuel Lap Margin Inc |
| Decrease | Shift+Alt+S | Autofuel Lap Margin Dec |

## Icon

Icon reflects the configured direction (up arrow for increase, down arrow for decrease).

## Notes

- Sets how many extra laps of fuel to add beyond calculated minimum
- Higher margin = more safety buffer but heavier car
- Works in conjunction with Autofuel Toggle
