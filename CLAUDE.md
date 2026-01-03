# iRaceDeck - Quick Reference for Claude

## Project Summary

**iRaceDeck** is a Stream Deck plugin that transforms your Elgato Stream Deck into an iRacing button box. It displays live telemetry data (speed, gear, RPM, fuel, etc.) on Stream Deck buttons.

**Tech Stack**: Node.js, TypeScript, Windows FFI (koffi), Stream Deck SDK
**Platform**: Windows only (iRacing is Windows-only)
**Architecture**: Self-contained plugin, no external processes

## How It Works

1. **FFI to Windows APIs**: Uses `koffi` to call `kernel32.dll` functions
2. **Memory-Mapped File**: Opens `Local\IRSDKMemMapFileName` (iRacing's shared memory)
3. **Parse C Structs**: Reads iRacing's binary header and variable definitions
4. **Read Telemetry**: Extracts real-time data (speed, gear, RPM, etc.)
5. **Update Stream Deck**: Displays on buttons at 10Hz

## Project Structure

```
src/
├── iracing/
│   ├── types.ts     # iRacing data structures
│   └── sdk.ts       # FFI integration, memory reading
├── actions/
│   ├── speed-display.ts  # Speed action
│   └── gear-display.ts   # Gear action
└── plugin.ts        # Entry point

fi.lampen.niklas.iracedeck.sdPlugin/
├── manifest.json    # Plugin config
├── bin/
│   ├── plugin.js   # Compiled output
│   └── node_modules/ # koffi, yaml
└── logs/           # Plugin logs
```

## Key Files

### `src/iracing/sdk.ts` - Core Integration

```typescript
export class IRacingSDK {
    connect(): boolean; // Open memory-mapped file
    disconnect(): void; // Close handles
    isConnected(): boolean; // Check status
    getTelemetry(): TelemetryData | null; // Read all variables
    getVar(name: string): any; // Get specific variable
    getSessionInfo(): SessionInfo | null; // Parse YAML session data
}
```

### `src/iracing/types.ts` - Data Structures

- `IRSDKHeader`: Main header (144 bytes)
- `VarHeader`: Variable metadata (144 bytes each)
- `VarBuf`: Buffer info (4 buffers, round-robin)
- `TelemetryData`: Key-value telemetry object

### `src/actions/*.ts` - Stream Deck Actions

Each action extends `SingletonAction`:

- `onWillAppear`: Connect SDK, start updates
- `onWillDisappear`: Stop updates, disconnect
- `updateDisplay`: Read telemetry, update button title

## Common Patterns

### Adding a New Action

1. **Create action file** (`src/actions/rpm-display.ts`):

```typescript
import { action, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";

import { IRacingSDK } from "../iracing/sdk";

@action({ UUID: "fi.lampen.niklas.iracedeck.rpm" })
export class RPMDisplay extends SingletonAction {
    private sdk = new IRacingSDK();
    private updateInterval: NodeJS.Timeout | null = null;
    private activeContexts = new Set<string>();

    override async onWillAppear(ev: WillAppearEvent) {
        this.activeContexts.add(ev.action.id);
        if (!this.sdk.isConnected()) this.sdk.connect();
        if (!this.updateInterval) this.startUpdates();
        this.updateDisplay(ev.action.id);
    }

    override async onWillDisappear(ev: WillDisappearEvent) {
        this.activeContexts.delete(ev.action.id);
        if (this.activeContexts.size === 0) this.stopUpdates();
    }

    private startUpdates() {
        this.updateInterval = setInterval(() => {
            if (!this.sdk.isConnected()) {
                this.sdk.disconnect();
                this.sdk.connect();
            }
            for (const contextId of this.activeContexts) {
                this.updateDisplay(contextId);
            }
        }, 100);
    }

    private stopUpdates() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
        this.sdk.disconnect();
    }

    private async updateDisplay(contextId: string) {
        const action = streamDeck.actions.getActionById(contextId);
        if (!action) return;

        let title = "iRacing\nnot\nconnected";

        if (this.sdk.isConnected()) {
            const telemetry = this.sdk.getTelemetry();
            if (telemetry && typeof telemetry.RPM === "number") {
                title = Math.round(telemetry.RPM).toString();
            }
        }

        await action.setTitle(title);
    }
}
```

**IMPORTANT: Connection Status Display**

- ALL actions MUST display "iRacing\nnot\nconnected" when not connected to iRacing
- This applies to both telemetry displays AND button actions (like chat)
- Use the pattern above with updateDisplay() checking connection status
- For button actions that don't show telemetry, show a preview/label when connected
- Update interval: 100ms for telemetry displays, 1000ms for button actions

````

2. **Register in `src/plugin.ts`**:

```typescript
import { RPMDisplay } from "./actions/rpm-display";
streamDeck.actions.registerAction(new RPMDisplay());
````

3. **Add to `manifest.json`**:

```json
{
    "Name": "RPM",
    "UUID": "fi.lampen.niklas.iracedeck.rpm",
    "Icon": "imgs/actions/rpm/icon",
    "Tooltip": "Displays engine RPM",
    "Controllers": ["Keypad"],
    "States": [{ "Image": "imgs/actions/rpm/key", "TitleAlignment": "middle" }]
}
```

### Reading Telemetry Variables

```typescript
const telemetry = sdk.getTelemetry();
if (telemetry) {
    const speed = telemetry.Speed; // m/s (× 2.23694 = MPH, × 3.6 = KPH)
    const gear = telemetry.Gear; // -1=R, 0=N, 1+=forward
    const rpm = telemetry.RPM; // Engine RPM
    const fuel = telemetry.FuelLevel; // Liters
    const throttle = telemetry.Throttle; // 0-1
    const brake = telemetry.Brake; // 0-1
    const lapTime = telemetry.LapCurrentLapTime; // Seconds
    const position = telemetry.PlayerCarPosition; // 1-based
}
```

### Common Variables

- `Speed` (m/s), `Gear` (-1/0/1+), `RPM`
- `FuelLevel`, `FuelLevelPct`, `FuelUsePerHour`
- `Throttle`, `Brake`, `Clutch`, `SteeringWheelAngle`
- `LapCurrentLapTime`, `LapLastLapTime`, `LapBestLapTime`
- `SessionTimeRemain`, `PlayerCarPosition`, `OnPitRoad`
- Tire temps, pressures, wear (many variables)

## Build & Development

```bash
npm install          # Install dependencies
npm run build        # Build plugin
npm run watch        # Auto-rebuild on changes
```

**Build Process**:

1. Rollup bundles TypeScript → JavaScript
2. Marks `koffi` and `yaml` as external
3. Emits `package.json` in bin folder
4. Postbuild installs runtime deps

**Testing**: Stream Deck auto-loads from `fi.lampen.niklas.iracedeck.sdPlugin/`

**Logs**: Check `fi.lampen.niklas.iracedeck.sdPlugin/logs/*.log`

## Important Notes

### FFI Correctness

```typescript
// ✅ Correct - integers for Windows API
OpenFileMappingA(FILE_MAP_READ, 0, "Local\\IRSDKMemMapFileName");

// ❌ Wrong - boolean causes type error
OpenFileMappingA(FILE_MAP_READ, false, "Local\\IRSDKMemMapFileName");
```

### Memory Reading

```typescript
function readBytes(ptr: any, offset: number, length: number): Buffer {
    const arrayType = `uint8_t[${length}]`;
    const pOffset = koffi.as(koffi.decode(ptr, "uintptr") + offset, "void *");
    const bytes = koffi.decode(pOffset, arrayType);
    return Buffer.from(bytes);
}
```

### Display States

- **Not connected**: `"iRacing\nnot\nconnected"` (multi-line)
- **Connected, no data**: `"N/A"`
- **Connected, has data**: Show value

### Type Safety

```typescript
// Always check types from telemetry
if (telemetry && typeof telemetry.Speed === "number") {
    const mph = telemetry.Speed * 2.23694;
}
```

## Common Tasks

**Add new telemetry display**: Copy `speed-display.ts`, change variable name, update display logic

**Add new chat message button**: Use the chat-message.ts pattern with connection status display

**Debug connection**: Check logs for "Attempting to connect" and "Successfully connected" messages

**Fix FFI errors**: Ensure Windows API parameters are correct types (int not bool)

## Chat Message Feature

The chat message action sends custom text to iRacing chat using Windows keyboard simulation.

**Implementation**: Uses `keybd_event` API with `VkKeyScanW` for proper character mapping

**Key APIs**:

- `VkKeyScanW`: Converts Unicode characters to virtual key codes based on keyboard layout
- `keybd_event`: Simulates keyboard input (key down/up events)

**How it works**:

1. Presses 't' to open iRacing chat
2. Uses `VkKeyScanW` to map each character (including ö, ä, å) to correct virtual key + modifiers
3. Simulates typing character-by-character with proper Shift/Ctrl/Alt modifiers
4. Presses Enter to submit and close chat window

**Character support**: Handles international characters (ö, ä, å, é, etc.) based on active keyboard layout

**UI**: Shows "iRacing\nnot\nconnected" when disconnected, message preview when connected

**Important**: The action MUST display connection status like all other actions

**Optimize performance**: Share SDK instance across actions (currently each creates own)

## Limitations

- Windows only (FFI to Windows APIs)
- Read-only telemetry (no control inputs to iRacing)
- No write to shared memory (iRacing restriction)
- Updates at 10Hz max (100ms intervals)

## Quick Reference

**iRacing SDK Docs**: https://forums.iracing.com/discussion/15068/official-iracing-sdk
**Stream Deck SDK**: https://docs.elgato.com/sdk/
**koffi FFI**: https://github.com/Koromix/koffi
**Reference Implementation**: https://github.com/kutu/pyirsdk

## Stream Deck Icon Guidelines

Based on https://docs.elgato.com/guidelines/streamdeck/plugins/images-and-layouts

### Action Icons (Icon in manifest.json)

- **Format**: SVG (recommended) or PNG
- **Size**: 20×20px (40×40px @2x for PNG)
- **Style**: Monochromatic white (#FFFFFF) stroke, transparent background
- **Location**: `imgs/actions/{category}/{action-name}/icon.svg`

### Key Icons (State Image in manifest.json)

- **Format**: SVG (recommended), PNG, or GIF
- **Size**: 72×72px (144×144px @2x for PNG)
- **Style**: Can use colors, should be visually distinct
- **Location**: `imgs/actions/{category}/{action-name}/key.svg`

#### Key Icon Design Guidelines

- **Background**: Transparent (user preference)
- **Margins**: 6px on all sides (content area 6-66)
- **Text display**: Reserve bottom portion for title text when needed
    - For actions showing values: icon in top ~half, title at bottom
    - For actions without dynamic text: icon can fill entire space
- **Style**: Simple outlines preferred, use #888 for neutral strokes
- **Variants**: Use `key-active.svg`, `key-{state}.svg` for different states

### Category Icons

- **Format**: SVG (recommended) or PNG
- **Size**: 28×28px (56×56px @2x for PNG)
- **Location**: `imgs/plugin/category-icon.svg`

### Plugin Icons

- **Format**: PNG only
- **Size**: 256×256px (512×512px @2x)
- **Location**: `imgs/plugin/marketplace.png`

### Naming Convention

- Action icons: `icon.svg`
- Key icons: `key.svg`, `key-active.svg`, `key-{variant}.svg`
- For PNG fallback: include `@2x` variants

## File Checklist for New Actions

- [ ] Create `src/actions/{category}/{action-name}.ts`
- [ ] Import and register in `src/plugin.ts`
- [ ] Add entry to `manifest.json` Actions array
- [ ] Create `imgs/actions/{category}/{action-name}/icon.svg` (white monochrome)
- [ ] Create `imgs/actions/{category}/{action-name}/key.svg` (can have colors)
- [ ] Build and test

---

**Status**: Basic functionality working (speed, gear). Ready to add more telemetry actions following the established patterns.
