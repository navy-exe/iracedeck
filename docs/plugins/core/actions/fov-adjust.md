# FOV Adjust

Adjusts the driver's field of view.

## Properties

| Property | Value |
|----------|-------|
| Action ID | `com.iracedeck.sd.core.fov-adjust` |
| Type | +/- |
| SDK Support | No |
| Encoder Support | Yes |

## Behavior

### Button Press
Triggers the direction configured in Property Inspector (increase or decrease).

### Encoder
- **Rotate clockwise**: Increase FOV
- **Rotate counter-clockwise**: Decrease FOV

## Property Inspector

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Direction | Dropdown | Increase | `Increase` or `Decrease` |

## Keyboard Simulation

| Action | Key | iRacing Setting |
|--------|-----|-----------------|
| Increase | ] | Increase Driver Field of View |
| Decrease | [ | Decrease Driver Field of View |

## Icon

Icon reflects the configured direction (wider FOV icon for increase, narrower for decrease).

## Notes

- Wider FOV shows more but objects appear smaller/further
- Narrower FOV shows less but better depth perception
- Find a balance between visibility and realism for your setup
