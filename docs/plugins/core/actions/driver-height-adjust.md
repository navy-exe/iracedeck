# Driver Height Adjust

Adjusts the virtual driver's seating height.

## Properties

| Property | Value |
|----------|-------|
| Action ID | `com.iracedeck.sd.core.driver-height-adjust` |
| Type | +/- |
| SDK Support | No |
| Encoder Support | Yes |

## Behavior

### Button Press
Triggers the direction configured in Property Inspector (increase or decrease).

### Encoder
- **Rotate clockwise**: Increase height
- **Rotate counter-clockwise**: Decrease height

## Property Inspector

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Direction | Dropdown | Increase | `Increase` or `Decrease` |

## Keyboard Simulation

| Action | Key | iRacing Setting |
|--------|-----|-----------------|
| Increase | Ctrl+] | Increase Driver Height |
| Decrease | Ctrl+[ | Decrease Driver Height |

## Icon

Icon reflects the configured direction (up arrow for increase, down arrow for decrease).

## Notes

- Simulates moving the driver seat up or down
- Affects view of hood, mirrors, and instruments
- Saved per car in iRacing
