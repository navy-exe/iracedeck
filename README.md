# iRaceDeck

Open source iRacing button box plugin for Elgato Stream Deck. Turn your Stream Deck into a powerful button box with live telemetry displays and customizable racing controls.

## What is iRaceDeck?

iRaceDeck transforms your Elgato Stream Deck into a virtual button box for iRacing. Display live telemetry data, monitor race information, and create custom racing controls - all on your Stream Deck's programmable buttons.

## Features

### Current Actions

- **Speed Display**: Shows current speed in MPH or KPH (press to toggle units)
- **Gear Display**: Shows current gear (R, N, 1-9)

### Technical Features

- Real-time updates (10 times per second)
- Automatic connection/reconnection to iRacing
- Self-contained - no external processes or dependencies required
- Direct memory access via FFI for maximum performance
- Windows-only (iRacing is Windows-only)

## Installation

### For Users

1. Download the latest release `.streamDeckPlugin` file
2. Double-click the file to install
3. The plugin will appear in your Stream Deck software under the "iRaceDeck" category

### For Developers

#### Prerequisites

- Node.js 20 or later
- npm
- Windows 10 or later
- Elgato Stream Deck software
- iRacing installed (for testing)

#### Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd niklas

# Install dependencies
npm install

# Build the plugin
npm run build
```

#### Development

```bash
# Watch mode - automatically rebuilds and restarts plugin on changes
npm run watch
```

The plugin will be built to `fi.lampen.niklas.iracedeck.sdPlugin/` directory.

## Technical Architecture

### Core Components

- **iRacing SDK Module** (`src/iracing/sdk.ts`): Core integration with iRacing's memory-mapped file
  - Uses `koffi` FFI library to access Windows `kernel32.dll` functions
  - Opens `Local\IRSDKMemMapFileName` memory-mapped file
  - Parses iRacing's C struct headers to access telemetry data
  - Supports both telemetry variables and session info (YAML)

- **Actions** (`src/actions/`):
  - `speed-display.ts`: Displays current speed with unit toggle
  - `gear-display.ts`: Displays current gear
  - Each action manages its own update interval and SDK connection

### How It Works

1. **Memory-Mapped File Access**:
   - Uses Windows API `OpenFileMappingA` to open iRacing's shared memory
   - Maps memory view with `MapViewOfFile`
   - Reads raw bytes directly from shared memory

2. **Header Parsing**:
   - Parses the main iRSDK header structure (144 bytes)
   - Reads variable headers that describe each telemetry variable
   - Identifies latest telemetry buffer based on tick count

3. **Telemetry Reading**:
   - Reads values from the latest buffer using variable offsets
   - Converts raw bytes to proper types (int, float, double, bool)
   - Updates Stream Deck display in real-time

4. **Session Info**:
   - Reads YAML session data from shared memory
   - Parses with `yaml` library for structured access

### Dependencies

- **@elgato/streamdeck**: Stream Deck SDK for Node.js
- **koffi**: FFI library for calling Windows APIs
- **yaml**: YAML parser for session info

## Available Actions

### Speed Display

Displays current vehicle speed from iRacing.

- **Default Unit**: MPH
- **Toggle Units**: Press the button to switch between MPH and KPH
- **Display**: Shows "iRacing\nnot\nconnected" when not connected, "N/A" if no data available

### Gear Display

Displays current gear selection.

- **Reverse**: R
- **Neutral**: N
- **Forward Gears**: 1-9
- **Display**: Shows "iRacing\nnot\nconnected" when not connected

### Planned Actions

The plugin architecture supports easily adding new actions for:

- **RPM Display**: Engine RPM with optional shift light
- **Fuel Level**: Current fuel level and estimated laps remaining
- **Lap Timer**: Current lap time, delta to best
- **Position**: Current position in race
- **Tire Temperatures**: Monitor tire temps
- **Brake Bias**: Display and adjust brake bias
- **Black Box Controls**: Quick access to pit commands
- **Relative Position**: Cars ahead/behind
- **Incident Counter**: Track incident points
- **Session Info**: Time remaining, flag status

## Project Structure

```
niklas/
├── src/
│   ├── iracing/
│   │   ├── types.ts          # iRacing SDK type definitions
│   │   └── sdk.ts            # Memory-mapped file reader
│   ├── actions/
│   │   ├── speed-display.ts  # Speed action
│   │   └── gear-display.ts   # Gear action
│   └── plugin.ts             # Main plugin entry point
├── fi.lampen.niklas.iracedeck.sdPlugin/
│   ├── manifest.json         # Plugin metadata
│   ├── bin/
│   │   ├── plugin.js        # Compiled plugin code
│   │   └── node_modules/    # Runtime dependencies
│   └── imgs/                # Plugin icons
├── package.json
├── tsconfig.json
├── rollup.config.mjs
└── README.md
```

## Building for Distribution

```bash
# Build the plugin
npm run build

# The plugin folder can be zipped or installed directly
# For distribution, use the Elgato CLI to package:
npx @elgato/cli link  # For development testing
```

## Adding New Actions

1. Create a new action file in `src/actions/`
2. Extend `SingletonAction` from `@elgato/streamdeck`
3. Use the shared `IRacingSDK` instance
4. Register the action in `src/plugin.ts`
5. Add action metadata to `manifest.json`
6. Add icons to `fi.lampen.niklas.iracedeck.sdPlugin/imgs/actions/`

Example:

```typescript
import { action, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import { IRacingSDK } from "../iracing/sdk";

@action({ UUID: "fi.lampen.niklas.iracedeck.rpm" })
export class RPMDisplay extends SingletonAction {
    private sdk: IRacingSDK;

    constructor() {
        super();
        this.sdk = new IRacingSDK();
    }

    override async onWillAppear(ev: WillAppearEvent): Promise<void> {
        // Connect and start updates
        this.sdk.connect();
        const rpm = this.sdk.getVar("RPM");
        await ev.action.setTitle(rpm?.toString() || "---");
    }
}
```

## Available Telemetry Variables

The iRacing SDK provides access to hundreds of telemetry variables. Some useful ones:

- `Speed`: Vehicle speed (m/s)
- `Gear`: Current gear (-1 = R, 0 = N, 1+ = forward)
- `RPM`: Engine RPM
- `FuelLevel`: Fuel level (liters)
- `Throttle`: Throttle position (0-1)
- `Brake`: Brake position (0-1)
- `SteeringWheelAngle`: Steering angle (radians)
- `LapCurrentLapTime`: Current lap time (seconds)
- `LapLastLapTime`: Last lap time (seconds)
- `SessionTimeRemain`: Time remaining in session (seconds)

Use `sdk.getVarNames()` to get a full list of available variables.

## Troubleshooting

### Plugin doesn't connect to iRacing

- Ensure iRacing is running and in a session (on track)
- Check that you're on Windows (macOS/Linux not supported)
- iRacing's telemetry is only available when actively driving

### Display shows "---"

- iRacing is not running or not in a session
- The plugin will automatically reconnect when iRacing starts

### Build errors

- Ensure you're using Node.js 20 or later
- Try deleting `node_modules` and running `npm install` again
- Make sure you're on Windows (koffi native modules are platform-specific)

## License

MIT

## Credits

Built with:
- [Elgato Stream Deck SDK](https://github.com/elgatosf/streamdeck)
- [koffi](https://github.com/Koromix/koffi) - Fast and easy-to-use FFI for Node.js
- [iRacing SDK](https://forums.iracing.com/discussion/15068/official-iracing-sdk) - Official iRacing telemetry API
- Reference: [pyirsdk](https://github.com/kutu/pyirsdk) - Python iRacing SDK implementation

## Contributing

Contributions are welcome! Feel free to:

- Add new actions for different telemetry data
- Improve error handling
- Add configuration options
- Create better icons
- Write documentation

Please open an issue or pull request on GitHub.
