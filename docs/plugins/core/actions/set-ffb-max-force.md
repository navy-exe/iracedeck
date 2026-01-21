# Set FFB Max Force

Adjusts the maximum force feedback force.

## Properties

| Property | Value |
|----------|-------|
| Action ID | `com.iracedeck.sd.core.set-ffb-max-force` |
| Type | Adjustment |
| SDK Support | Yes |
| Encoder Support | Yes |

## Behavior

### Button Press
- Opens adjustment dialog or cycles through presets

### Encoder
- **Rotate clockwise**: Increase max force
- **Rotate counter-clockwise**: Decrease max force

## Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Value | Number | - | Target max force value (Nm) |
| Mode | Dropdown | Adjust | `Set` (specific value) or `Adjust` (+/-) |

## SDK Integration

Uses iRacing SDK to set FFB max force value directly.

## Icon States

| State | Description |
|-------|-------------|
| Default | FFB icon with current value |

## Notes

- SDK-based adjustment allows precise control
- Higher values = stronger feedback but possible clipping
- Lower values = weaker feedback but more detail
- Can read current value from telemetry to display
