# Adjust Master Volume

Adjusts the iRacing master audio volume.

## Properties

| Property | Value |
|----------|-------|
| Action ID | `com.iracedeck.sd.core.adjust-master-volume` |
| Type | +/- |
| SDK Support | No |
| Encoder Support | Yes |

## Behavior

### Button Press
Triggers the direction configured in Property Inspector (louder or quieter).

### Encoder
- **Rotate clockwise**: Increase volume
- **Rotate counter-clockwise**: Decrease volume

## Property Inspector

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Direction | Dropdown | Louder | `Louder` or `Quieter` |

## Keyboard Simulation

| Action | Key | iRacing Setting |
|--------|-----|-----------------|
| Louder | Shift+Alt+NUMPAD + | Master Volume Louder |
| Quieter | Shift+Alt+NUMPAD - | Master Volume Quieter |

## Icon

Icon reflects the configured direction (volume up or volume down icon).

## Notes

- Adjusts overall iRacing audio output
- Requires numpad keys for default bindings
- Separate from Windows system volume
