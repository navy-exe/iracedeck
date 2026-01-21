# Look Direction

Changes the driver's view direction.

## Properties

| Property | Value |
|----------|-------|
| Action ID | `com.iracedeck.sd.core.look-direction` |
| Type | Multi-toggle |
| SDK Support | No |
| Encoder Support | No |

## Behavior

### Button Press
- Looks in the configured direction while held

## Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Direction | Dropdown | Left | Look direction |

### Direction Options

| Option | Key | iRacing Setting |
|--------|-----|-----------------|
| Left | Z | Look Left |
| Right | X | Look Right |
| Up | - | Look Up |
| Down | - | Look Down |

## Keyboard Simulation

Sends configured direction key while button is held.

## Icon States

| State | Description |
|-------|-------------|
| Default | Arrow icon indicating configured direction |

## Notes

- Momentary action - view returns to forward when released
- Look Up/Down require custom keybindings in iRacing (no default keys)
- Useful for checking mirrors or blind spots
