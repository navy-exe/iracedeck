# @iracedeck/iracing-sdk

TypeScript SDK for iRacing telemetry and broadcast commands. Provides a clean API for reading telemetry data and sending commands to iRacing.

## Installation

```bash
pnpm add @iracedeck/iracing-sdk
```

## Quick Start

```typescript
import { IRacingSDK, setLogger } from '@iracedeck/iracing-sdk';

// Optional: Set up logging
setLogger({
    info: console.log,
    warn: console.warn,
    error: console.error,
    debug: console.debug
});

// Create SDK instance
const sdk = new IRacingSDK();

// Connect to iRacing
if (sdk.connect()) {
    console.log('Connected to iRacing!');

    // Read telemetry
    const telemetry = sdk.getTelemetry();
    if (telemetry) {
        console.log(`Speed: ${telemetry.Speed} m/s`);
        console.log(`Gear: ${telemetry.Gear}`);
        console.log(`RPM: ${telemetry.RPM}`);
    }

    // Disconnect when done
    sdk.disconnect();
}
```

## API

### IRacingSDK

Main class for connecting to iRacing and reading telemetry.

```typescript
const sdk = new IRacingSDK();

// Connection
sdk.connect(): boolean
sdk.disconnect(): void
sdk.isConnected(): boolean

// Telemetry
sdk.getTelemetry(): TelemetryData | null
sdk.getVar(name: string): any
sdk.getVarNames(): string[]

// Session Info
sdk.getSessionInfo(): any

// Window handle (for commands)
sdk.getSimWindowHandle(): number
```

### Broadcast Commands

Send commands to iRacing using the broadcast API.

#### PitCommand

```typescript
import { PitCommand } from '@iracedeck/iracing-sdk';

const pit = PitCommand.getInstance();

// Fuel
pit.fuel(liters);           // Set fuel amount
pit.clearFuel();            // Clear fuel

// Tires
pit.leftFront(pressure);    // Change LF tire
pit.rightFront(pressure);   // Change RF tire
pit.leftRear(pressure);     // Change LR tire
pit.rightRear(pressure);    // Change RR tire
pit.clearTires();           // Clear all tire changes
pit.tireCompound(compound); // Set tire compound (0=dry, 1=wet)

// Repairs
pit.fastRepair();           // Request fast repair
pit.clearFastRepair();      // Clear fast repair

// Clear all
pit.clear();                // Clear all pit services
```

#### ChatCommand

```typescript
import { ChatCommand } from '@iracedeck/iracing-sdk';

const chat = ChatCommand.getInstance();

// Chat commands
chat.beginChat();           // Open chat window
chat.cancel();              // Close chat window
chat.reply();               // Reply to last message
chat.macro(num);            // Trigger chat macro (1-15)

// Send custom message
chat.sendMessage(hwnd, 'Hello!');
```

#### CameraCommand

```typescript
import { CameraCommand } from '@iracedeck/iracing-sdk';

const camera = CameraCommand.getInstance();

camera.switchToCar(carIdx, group, camera);
camera.switchToPosition(position, group, camera);
camera.setState(state);
```

### Types and Enums

```typescript
import {
    TelemetryData,
    SessionInfo,
    PitSvFlags,
    CameraState,
    Skies,
    hasFlag,
    addFlag,
    removeFlag
} from '@iracedeck/iracing-sdk';

// Check pit service flags
const flags = telemetry.PitSvFlags;
if (hasFlag(flags, PitSvFlags.FuelFill)) {
    console.log('Fuel fill is enabled');
}

// Check sky conditions
if (telemetry.Skies === Skies.Overcast) {
    console.log('Overcast conditions');
}
```

## Logging

The SDK uses a generic logger interface. Set your own logger:

```typescript
import { setLogger } from '@iracedeck/iracing-sdk';

// For Stream Deck
import streamDeck from '@elgato/streamdeck';
setLogger(streamDeck.logger);

// For console
setLogger(console);

// Custom logger
setLogger({
    info: (msg) => myLogger.info(msg),
    warn: (msg) => myLogger.warn(msg),
    error: (msg) => myLogger.error(msg),
    debug: (msg) => myLogger.debug(msg)
});
```

## Common Telemetry Variables

| Variable | Type | Description |
|----------|------|-------------|
| `Speed` | float | Vehicle speed (m/s) |
| `Gear` | int | Current gear (-1=R, 0=N, 1+=forward) |
| `RPM` | float | Engine RPM |
| `FuelLevel` | float | Current fuel (liters) |
| `FuelLevelPct` | float | Fuel level percentage |
| `PitSvFuel` | float | Fuel to add at pit |
| `PitSvFlags` | int | Pit service flags |
| `Throttle` | float | Throttle position (0-1) |
| `Brake` | float | Brake position (0-1) |
| `Clutch` | float | Clutch position (0-1) |
| `SteeringWheelAngle` | float | Steering angle (radians) |
| `Lap` | int | Current lap |
| `LapCurrentLapTime` | float | Current lap time (seconds) |
| `LapLastLapTime` | float | Last lap time (seconds) |
| `LapBestLapTime` | float | Best lap time (seconds) |
| `SessionTimeRemain` | float | Time remaining (seconds) |
| `PlayerCarPosition` | int | Race position |
| `OnPitRoad` | bool | On pit road |
| `Skies` | int | Sky conditions |

## Building

```bash
pnpm run build
```

## Platform Support

- **Windows only** - Depends on @iracedeck/iracing-native

## License

MIT
