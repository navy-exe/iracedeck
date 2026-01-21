# UI Size Adjust

Adjusts the overall UI scale.

## Properties

| Property | Value |
|----------|-------|
| Action ID | `com.iracedeck.sd.core.ui-size-adjust` |
| Type | +/- |
| SDK Support | No |
| Encoder Support | Yes |

## Behavior

### Button Press
Triggers the direction configured in Property Inspector (up or down).

### Encoder
- **Rotate clockwise**: Scale UI up
- **Rotate counter-clockwise**: Scale UI down

## Property Inspector

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Direction | Dropdown | Up | `Up` or `Down` |

## Keyboard Simulation

| Action | Key | iRacing Setting |
|--------|-----|-----------------|
| Up | Ctrl+PageUp | Scale UI Up |
| Down | Ctrl+PageDown | Scale UI Down |

## Icon

Icon reflects the configured direction (larger icon for up, smaller for down).

## Notes

- Affects all UI elements proportionally
- Useful for different monitor sizes/resolutions
- Changes persist across sessions
