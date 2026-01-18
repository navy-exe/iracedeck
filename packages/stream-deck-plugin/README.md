# @iracedeck/stream-deck-plugin

Stream Deck plugin for iRacing. Display live telemetry and control pit services from your Elgato Stream Deck.

## Installation

### For Users

Download the `.streamDeckPlugin` file from releases and double-click to install.

### For Developers

```bash
# From monorepo root
pnpm install
pnpm run build

# Or build just this package
pnpm --filter @iracedeck/stream-deck-plugin run build
```

## Available Actions

### Vehicle Displays

| Action        | UUID                                     | Description                    |
| ------------- | ---------------------------------------- | ------------------------------ |
| Speed Display | `com.iracedeck.sd.vehicle.display-speed` | Current speed (MPH/KPH toggle) |
| Gear Display  | `com.iracedeck.sd.vehicle.display-gear`  | Current gear                   |

### Pit Service

| Action        | UUID                                       | Description              |
| ------------- | ------------------------------------------ | ------------------------ |
| Fuel to Add   | `com.iracedeck.sd.pit.display-fuel-to-add` | Display/toggle fuel fill |
| Add Fuel      | `com.iracedeck.sd.pit.do-fuel-add`         | Increase pit fuel amount |
| Reduce Fuel   | `com.iracedeck.sd.pit.do-fuel-reduce`      | Decrease pit fuel amount |
| Tire Compound | `com.iracedeck.sd.pit.do-tire-compound`    | Toggle dry/wet tires     |
| Change Tires  | `com.iracedeck.sd.pit.do-change-tires`     | Configure tire changes   |
| Fast Repair   | `com.iracedeck.sd.pit.do-fast-repair`      | Toggle fast repair       |

### Environment

| Action         | UUID                                       | Description     |
| -------------- | ------------------------------------------ | --------------- |
| Sky Conditions | `com.iracedeck.sd.environment.display-sky` | Current weather |

### Communications

| Action       | UUID                                     | Description      |
| ------------ | ---------------------------------------- | ---------------- |
| Chat Message | `com.iracedeck.sd.comms.do-chat-message` | Send custom chat |

## Architecture

### SDKController

Singleton managing SDK connection and telemetry subscriptions:

```typescript
import { SDKController } from "@iracedeck/iracing-sdk";

const controller = SDKController.getInstance();

// Subscribe to telemetry updates
controller.subscribe("action-id", (telemetry, isConnected) => {
  // Handle telemetry update
});

// Unsubscribe when action disappears
controller.unsubscribe("action-id");

// Get current state
const isConnected = controller.getConnectionStatus();
const telemetry = controller.getCurrentTelemetry();
```

### Creating Actions

Actions extend `SingletonAction` from the Stream Deck SDK:

```typescript
import streamDeck, { action, SingletonAction, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";
import { SDKController, TelemetryData } from "@iracedeck/iracing-sdk";

@action({ UUID: "com.iracedeck.sd.my-action" })
export class MyAction extends SingletonAction {
  private sdkController = SDKController.getInstance();
  private lastState = new Map<string, string>();

  override async onWillAppear(ev: WillAppearEvent): Promise<void> {
    this.sdkController.subscribe(ev.action.id, (telemetry, isConnected) => {
      this.updateDisplay(ev.action.id, telemetry, isConnected);
    });
  }

  override async onWillDisappear(ev: WillDisappearEvent): Promise<void> {
    this.sdkController.unsubscribe(ev.action.id);
    this.lastState.delete(ev.action.id);
  }

  private async updateDisplay(contextId: string, telemetry: TelemetryData | null, isConnected: boolean): Promise<void> {
    const action = streamDeck.actions.getActionById(contextId);
    if (!action) return;

    let title = "iRacing\nnot\nconnected";

    if (isConnected && telemetry) {
      // Build display from telemetry
      title = "Connected!";
    }

    // Only update if changed (reduces Stream Deck traffic)
    const lastState = this.lastState.get(contextId);
    if (lastState !== title) {
      this.lastState.set(contextId, title);
      await action.setTitle(title);
    }
  }
}
```

### Registering Actions

Register new actions in `src/plugin.ts`:

```typescript
import { MyAction } from "./actions/my-action";

streamDeck.actions.registerAction(new MyAction());
```

### Adding to Manifest

Add action metadata to `com.iracedeck.sd.sdPlugin/manifest.json`:

```json
{
  "Name": "My Action",
  "UUID": "com.iracedeck.sd.my-action",
  "Icon": "imgs/actions/my-action/icon",
  "Tooltip": "Description of my action",
  "Controllers": ["Keypad"],
  "States": [
    {
      "Image": "imgs/actions/my-action/key",
      "TitleAlignment": "middle"
    }
  ]
}
```

## Build Output

The build produces:

```
com.iracedeck.sd.sdPlugin/
├── bin/
│   ├── plugin.js       # Bundled plugin code
│   ├── package.json    # Runtime dependencies
│   └── node_modules/   # Runtime deps (yaml, @iracedeck/*)
├── imgs/               # Action icons
├── ui/                 # Property Inspector HTML
└── manifest.json       # Plugin metadata
```

## Development

```bash
# Build plugin
pnpm run build

# The Stream Deck app will auto-reload from the sdPlugin folder
# Check logs at: com.iracedeck.sd.sdPlugin/logs/
```

## Dependencies

- `@elgato/streamdeck` - Stream Deck SDK
- `@iracedeck/iracing-sdk` - iRacing SDK (workspace package)

## License

MIT
