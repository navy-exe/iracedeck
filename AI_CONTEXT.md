# iRaceDeck - AI Development Context

## Project Overview

**Purpose**: Transform Elgato Stream Deck into a virtual button box for iRacing sim racing
**Status**: Early development - basic telemetry display working
**Platform**: Windows only (Node.js 20+)
**License**: MIT

## What is iRaceDeck?

iRaceDeck is a Stream Deck plugin that reads live telemetry data from iRacing and displays it on Stream Deck buttons. Unlike traditional overlays, this gives sim racers physical buttons with real-time data at their fingertips.

**Use Cases**:
- Display real-time telemetry (speed, gear, RPM, fuel)
- Monitor race status (position, lap times, incidents)
- Quick access to pit commands
- Create custom button layouts for different cars/tracks

## Technical Architecture

### Core Technologies

1. **Node.js Stream Deck Plugin**
   - Uses `@elgato/streamdeck` SDK
   - Self-contained - runs in Stream Deck's Node.js runtime
   - No external processes or sidecar applications

2. **iRacing Integration via FFI**
   - Uses `koffi` library for Foreign Function Interface
   - Direct access to Windows `kernel32.dll` functions
   - Reads iRacing's memory-mapped file: `Local\IRSDKMemMapFileName`
   - Parses C struct headers to access telemetry data

3. **Memory-Mapped File Access**
   - Opens shared memory with `OpenFileMappingA`
   - Maps view with `MapViewOfFile`
   - Reads raw bytes from memory
   - Parses iRacing's binary data structures

### Key Constraints

- **Windows Only**: iRacing and Windows-specific APIs
- **Self-Contained**: Must work without external dependencies
- **No Python/C# Sidecars**: Everything runs in Node.js
- **Performance**: 10Hz updates (100ms intervals)
- **Memory Safety**: Direct memory reading requires careful buffer handling

## Project Structure

```
niklas/
├── src/
│   ├── iracing/
│   │   ├── types.ts          # iRacing SDK type definitions
│   │   └── sdk.ts            # Core FFI integration & memory reader
│   ├── actions/
│   │   ├── speed-display.ts  # Speed telemetry action
│   │   └── gear-display.ts   # Gear display action
│   └── plugin.ts             # Main entry point
├── fi.lampen.niklas.iracedeck.sdPlugin/
│   ├── manifest.json         # Plugin metadata
│   ├── bin/
│   │   ├── plugin.js        # Compiled output
│   │   ├── package.json     # Runtime dependencies
│   │   └── node_modules/    # koffi, yaml
│   ├── imgs/                # Action icons
│   └── logs/                # Plugin logs
├── package.json             # Dev dependencies
├── tsconfig.json            # TypeScript config
├── rollup.config.mjs        # Bundler config
└── README.md
```

## How It Works

### 1. Memory-Mapped File Access

iRacing exposes telemetry via a Windows memory-mapped file. The plugin:

1. Opens the file using Windows API `OpenFileMappingA`
2. Maps it into memory with `MapViewOfFile`
3. Reads raw bytes directly from memory
4. Parses binary data according to iRacing's C struct layout

### 2. Data Flow

```
iRacing Running
    ↓
Shared Memory (Local\IRSDKMemMapFileName)
    ↓
FFI (koffi) → Windows APIs
    ↓
Parse C Structs (Header, VarHeaders, Buffers)
    ↓
Read Telemetry Values (Speed, Gear, etc.)
    ↓
Update Stream Deck Actions (10Hz)
    ↓
Display on Stream Deck Buttons
```

### 3. Action Architecture

Each Stream Deck action (button type):
- Extends `SingletonAction` from SDK
- Creates own `IRacingSDK` instance
- Manages update intervals independently
- Handles connection lifecycle
- Updates button display via `setTitle()`

### 4. Update Loop

```typescript
// Every 100ms per action instance
if (!sdk.isConnected()) {
    sdk.disconnect();
    sdk.connect();  // Try reconnect
}

telemetry = sdk.getTelemetry();
if (telemetry) {
    updateDisplay(telemetry.Speed, telemetry.Gear, etc.);
}
```

## iRacing SDK Details

### Memory Structure

```
IRSDKHeader (144 bytes)
├── ver, status, tickRate
├── sessionInfoUpdate, sessionInfoLen, sessionInfoOffset
├── numVars, varHeaderOffset
├── numBuf, bufLen
└── varBuf[4] (VarBuf structs)

VarHeader[] (144 bytes each)
├── type (int, float, bool, etc.)
├── offset (position in buffer)
├── count (array size)
├── name, desc, unit (strings)

DataBuffers (multiple, indexed by tickCount)
└── Raw telemetry data at variable offsets
```

### Variable Types

```typescript
enum VarType {
    Char = 0,
    Bool = 1,
    Int = 2,
    BitField = 3,
    Float = 4,
    Double = 5
}
```

### Session Info

- YAML format at `sessionInfoOffset`
- Contains race details, driver info, track data
- Updated periodically (check `sessionInfoUpdate` counter)

## Current Implementation

### Working Features

1. **Speed Display Action**
   - Reads `Speed` variable (m/s)
   - Converts to MPH or KPH
   - Press to toggle units
   - Displays "iRacing\nnot\nconnected" when disconnected

2. **Gear Display Action**
   - Reads `Gear` variable (int)
   - Shows R (reverse), N (neutral), or 1-9
   - Auto-updates at 10Hz

3. **Connection Management**
   - Auto-connect on action appear
   - Auto-reconnect every 100ms if disconnected
   - Graceful handling of iRacing not running
   - Logging via Stream Deck logger

### Key Files

#### `src/iracing/sdk.ts`
Core SDK integration:
- `connect()`: Opens memory-mapped file
- `disconnect()`: Closes handles
- `isConnected()`: Checks status flag
- `getTelemetry()`: Reads all variables from latest buffer
- `getVar(name)`: Gets specific variable value
- `getSessionInfo()`: Parses YAML session data

#### `src/iracing/types.ts`
Type definitions for:
- `IRSDKHeader`: Main header structure
- `VarHeader`: Variable metadata
- `VarBuf`: Buffer information
- `TelemetryData`: Key-value telemetry object

#### `src/actions/speed-display.ts` & `gear-display.ts`
Action implementations:
- Lifecycle hooks (`onWillAppear`, `onWillDisappear`)
- Update intervals
- Display logic
- Settings management (speed units)

## Development Workflow

### Build Commands

```bash
npm run build      # Build plugin
npm run watch      # Auto-rebuild + restart plugin
npm run postbuild  # Install runtime deps in plugin folder
```

### Build Process

1. **Rollup** bundles TypeScript to JavaScript
2. Marks `koffi` and `yaml` as external (not bundled)
3. Emits `package.json` with dependencies
4. **Postbuild** runs `npm install` in plugin bin folder
5. Plugin ready to load in Stream Deck

### Testing

1. Build the plugin
2. Stream Deck auto-loads from `fi.lampen.niklas.iracedeck.sdPlugin/`
3. Add actions to Stream Deck
4. Check logs in `fi.lampen.niklas.iracedeck.sdPlugin/logs/`
5. Start iRacing to see live data

### Logging

```typescript
streamDeck.logger.info('Connection status...');
streamDeck.logger.debug('Telemetry values...');
streamDeck.logger.error('Critical errors...');
```

Logs appear in `.sdPlugin/logs/*.log` files.

## Common Patterns

### Adding a New Action

1. Create `src/actions/my-action.ts`:
```typescript
@action({ UUID: "fi.lampen.niklas.iracedeck.myaction" })
export class MyAction extends SingletonAction {
    private sdk: IRacingSDK;

    override async onWillAppear(ev: WillAppearEvent) {
        this.sdk.connect();
        // Start updates
    }

    private updateDisplay() {
        const telemetry = this.sdk.getTelemetry();
        if (telemetry) {
            const value = telemetry.SomeVariable;
            // Update button
        }
    }
}
```

2. Register in `src/plugin.ts`:
```typescript
import { MyAction } from "./actions/my-action";
streamDeck.actions.registerAction(new MyAction());
```

3. Add to `manifest.json`:
```json
{
    "Name": "My Action",
    "UUID": "fi.lampen.niklas.iracedeck.myaction",
    "Icon": "imgs/actions/myaction/icon",
    "States": [{"Image": "imgs/actions/myaction/key"}]
}
```

### Reading Telemetry Variables

```typescript
const telemetry = sdk.getTelemetry();
if (telemetry) {
    const rpm = telemetry.RPM;          // number
    const fuel = telemetry.FuelLevel;   // number (liters)
    const throttle = telemetry.Throttle; // number (0-1)
    const onPitRoad = telemetry.OnPitRoad; // boolean
}
```

### Common Variables

- `Speed`: m/s (multiply by 2.23694 for MPH, 3.6 for KPH)
- `Gear`: -1 (R), 0 (N), 1+ (forward gears)
- `RPM`: Engine RPM
- `FuelLevel`: Liters
- `LapCurrentLapTime`: Seconds
- `Throttle`, `Brake`, `Clutch`: 0-1
- `SessionTimeRemain`: Seconds remaining in session
- `PlayerCarPosition`: Current position
- Many more in iRacing SDK docs

## Known Issues & Limitations

### Current Issues

1. **No error recovery in koffi calls**: If memory read fails, may crash
2. **Shared SDK instances**: Each action creates its own SDK instance (could share)
3. **No rate limiting on logging**: Debug logs run at 10Hz
4. **Hardcoded update interval**: Could be configurable per action

### Limitations

1. **Windows only**: FFI to Windows APIs
2. **iRacing only**: Specific to iRacing's memory format
3. **No write support**: Read-only telemetry (no control inputs)
4. **No session control**: Can't send commands to iRacing
5. **Fixed memory layout**: Depends on iRacing's struct definitions

## Future Enhancements

### Planned Features

1. **More Telemetry Actions**
   - RPM with shift light
   - Fuel gauge with laps remaining
   - Lap timer with delta
   - Position and gap to leader
   - Tire temperatures
   - Brake bias

2. **Interactive Controls**
   - Pit commands (fuel, tires, repairs)
   - Brake bias adjustment
   - Black box navigation
   - Camera controls

3. **Multi-Page Layouts**
   - Pre-made profiles for different cars
   - Quick-switch between layouts
   - Export/import configurations

4. **Performance**
   - Shared SDK instance across actions
   - Configurable update rates
   - Better error handling
   - Memory optimization

### Technical Improvements

1. **Better Memory Safety**
   - Validate buffer sizes
   - Error recovery in FFI calls
   - Handle malformed data

2. **SDK Enhancements**
   - Cache variable offsets
   - Lazy parse var headers
   - Async API for non-blocking reads

3. **Code Quality**
   - Unit tests for SDK
   - Integration tests with mock data
   - Better TypeScript types

## References

### Documentation

- [iRacing SDK Documentation](https://forums.iracing.com/discussion/15068/official-iracing-sdk)
- [Stream Deck Plugin SDK](https://docs.elgato.com/sdk/)
- [koffi FFI Library](https://github.com/Koromix/koffi)
- [pyirsdk Reference Implementation](https://github.com/kutu/pyirsdk)

### iRacing Data Structures

The plugin implements the following C structures from iRacing SDK:

```c
typedef struct irsdk_header {
    int ver;
    int status;
    int tickRate;
    int sessionInfoUpdate;
    int sessionInfoLen;
    int sessionInfoOffset;
    int numVars;
    int varHeaderOffset;
    int numBuf;
    int bufLen;
    // ... padding
    irsdk_varBuf varBuf[4];
} irsdk_header;

typedef struct irsdk_varHeader {
    int type;
    int offset;
    int count;
    bool countAsTime;
    char name[32];
    char desc[64];
    char unit[32];
} irsdk_varHeader;
```

## Development Tips

### For AI Assistants

When working on this project:

1. **Always preserve FFI correctness**: Koffi parameter types must match Windows API exactly
2. **Memory safety is critical**: Buffer overruns will crash the plugin
3. **Respect the singleton pattern**: Stream Deck expects one instance per action
4. **Test without iRacing**: Plugin should gracefully handle connection failures
5. **Log verbosely during development**: Helps debug FFI and memory issues
6. **Follow existing patterns**: Copy speed-display.ts for new actions

### Common Tasks

**Add new telemetry variable display**:
1. Check variable name in iRacing SDK docs
2. Copy `speed-display.ts` or `gear-display.ts`
3. Update variable name in `getTelemetry()`
4. Adjust display formatting
5. Register action in plugin.ts and manifest.json

**Debug connection issues**:
1. Check logs in `.sdPlugin/logs/`
2. Verify iRacing is running and in a session
3. Test OpenFileMappingA return value
4. Validate header parsing
5. Check status flag in header

**Performance optimization**:
1. Profile update intervals
2. Consider caching variable headers
3. Optimize buffer reading
4. Share SDK instance if possible
5. Add rate limiting to logging

## Summary

iRaceDeck is a Stream Deck plugin that turns your Stream Deck into an iRacing button box. It uses FFI to read iRacing's shared memory, parses telemetry data, and displays it on customizable Stream Deck buttons. The architecture is extensible - adding new actions is straightforward, following the existing patterns. The main technical challenge is correctly interfacing with Windows APIs and parsing iRacing's binary data structures.
