# Horizon Adjust (VanishY)

Adjusts the vertical horizon position in the driver's view.

## Properties

| Property | Value |
|----------|-------|
| Action ID | `com.iracedeck.sd.core.horizon-adjust` |
| Type | +/- |
| SDK Support | No |
| Encoder Support | Yes |

## Behavior

### Button Press
Triggers the direction configured in Property Inspector (up or down).

### Encoder
- **Rotate clockwise**: Shift horizon up
- **Rotate counter-clockwise**: Shift horizon down

## Property Inspector

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Direction | Dropdown | Up | `Up` or `Down` |

## Keyboard Simulation

| Action | Key | iRacing Setting |
|--------|-----|-----------------|
| Up | Shift+] | Shift Horizon Up |
| Down | Shift+[ | Shift Horizon Down |

## Icon

Icon reflects the configured direction (up arrow or down arrow).

## Notes

- Moves the vanishing point up or down
- Useful for adjusting view comfort without changing FOV
- Also known as VanishY in camera settings
