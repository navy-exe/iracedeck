# Fuel Service

Manages fuel pit service operations: toggle fuel fill, add/reduce/set fuel amounts, clear fuel checkbox, autofuel toggle, lap margin adjustments, and fuel level gauge display.

## Properties

| Property | Value |
|----------|-------|
| Action ID | `com.iracedeck.sd.core.fuel-service` |
| Type | Multi-toggle |
| SDK Support | Yes (toggle-fuel-fill, clear-fuel) |
| Encoder Support | Yes (add/reduce fuel, lap margin) |

## Behavior

### Button Press
- **Toggle Fuel Fill** - Toggles the fuel fill checkbox on/off via SDK
- **Add Fuel** - Sends pit macro to add the configured amount (repeats while held)
- **Reduce Fuel** - Sends pit macro to reduce by the configured amount (repeats while held)
- **Set Fuel Amount** - Sends pit macro to set fuel to the configured amount
- **Clear Fuel** - Clears the fuel checkbox via SDK
- **Toggle Autofuel** - Toggles autofuel via keyboard shortcut
- **Fuel Level Gauge** - Toggles display between percentage and amount (liters/gallons) on key press
- **Lap Margin Increase** - Increases lap margin via keyboard shortcut
- **Lap Margin Decrease** - Decreases lap margin via keyboard shortcut

### Encoder
- **Add/Reduce Fuel**: Clockwise adds, counter-clockwise reduces
- **Lap Margin**: Clockwise increases, counter-clockwise decreases
- **Press**: Executes the configured mode action

## Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| Mode | Dropdown | Toggle Fuel Fill | Fuel service operation |
| Amount | Number | 1 | Fuel amount for add/reduce/set modes |
| Unit | Dropdown | Liters | Unit for fuel amount (Liters, Gallons, Kilograms) |

### Mode Options
- **Toggle Fuel Fill** - Toggle the pit service fuel fill checkbox on/off
- **Add Fuel** - Add fuel amount to the pit service request
- **Reduce Fuel** - Reduce fuel amount from the pit service request
- **Set Fuel Amount** - Set an exact fuel amount for the pit service request
- **Clear Fuel** - Clear the fuel checkbox entirely
- **Toggle Autofuel** - Toggle the autofuel feature on/off
- **Fuel Level Gauge** - Live fuel level display with gauge fill, percentage/amount toggle
- **Lap Margin Increase** - Increase the autofuel lap margin
- **Lap Margin Decrease** - Decrease the autofuel lap margin

## Fuel Level Gauge

The fuel level gauge mode displays a live visual fuel gauge:

- **Gauge fill**: Full-width colored bar showing current fuel level (y=0 to y=100)
  - Green (`#3fb23f`) — above 30%
  - Yellow (`#d3c518`) — between 10% and 30%
  - Red (`#e74c3c`) — below 10%
- **Value display**: Press the key to toggle between two views:
  - **Percentage** (default) — e.g., "75%"
  - **Amount** — e.g., "82.5 L" or "21.8 gal" (respects iRacing display units)
  - When no data is available (game not running), shows "--" centered
- **Decorative side bars**: Three tick marks per side and bottom bars matching the add-fuel/reduce/set layout exactly
- **Status bar** (bottom):
  - **TANK** (blue) — normal state
  - **REFUELING** (green, text flashes) — fuel fill active in pit
  - **REFUEL!** (red/blue flash) — fuel below 10% and not refueling

## Keyboard Simulation

| Action | Default Key | iRacing Setting |
|--------|-------------|-----------------|
| Toggle Autofuel | *(none)* | Toggle Autofuel |
| Lap Margin Increase | *(none)* | Lap Margin Increase |
| Lap Margin Decrease | *(none)* | Lap Margin Decrease |

## Icon States

| Mode | Icon |
|------|------|
| Toggle Fuel Fill | Dynamic: fuel amount + ON/OFF status bar |
| Add Fuel | Green decorative bars, "+amount unit" value |
| Reduce Fuel | Red decorative bars, "-amount unit" value |
| Set Fuel Amount | Yellow decorative bars, "amount unit" value |
| Clear Fuel | Static "CLEAR FUEL" icon |
| Toggle Autofuel (on) | "AUTO FUEL" title with fuel amount and green "ON" status bar |
| Toggle Autofuel (off) | "AUTO FUEL" title with fuel amount and red "OFF" status bar |
| Toggle Autofuel (n/a) | "AUTO FUEL" title with fuel amount and gray "N/A" status bar (autofuel system not available for this car/series) |
| Fuel Level Gauge | Colored gauge fill with percentage or amount (toggle on press), decorative side bars, status bar |
| Lap Margin Increase | Static "INCREASE LAP MARGIN" icon |
| Lap Margin Decrease | Static "DECREASE LAP MARGIN" icon |
