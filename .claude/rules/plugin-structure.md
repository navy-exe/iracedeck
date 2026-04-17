---
# Stream Deck Plugin Structure

## Architecture

The plugin system uses a platform abstraction architecture with these key packages:

- `@iracedeck/deck-core` — Platform-agnostic base classes, types (`IDeckWillAppearEvent`, etc.), and shared utilities
- `@iracedeck/deck-adapter-elgato` — Elgato Stream Deck adapter implementing `IDeckPlatformAdapter`
- `@iracedeck/deck-adapter-mirabox` — Mirabox adapter implementing `IDeckPlatformAdapter` via WebSocket
- `@iracedeck/iracing-actions` — All action implementations (import from `@iracedeck/deck-core`, not platform-specific SDKs)

Actions do NOT import from `@elgato/streamdeck` or any platform SDK. They import from `@iracedeck/deck-core` and are registered via the platform adapter in each plugin.

## Active Plugins
- `iracing-plugin-stream-deck` (com.iracedeck.sd.core) — Elgato Stream Deck, uses `@iracedeck/deck-adapter-elgato`
- `mirabox-plugin` (com.iracedeck.sd.core) — Mirabox, uses `@iracedeck/deck-adapter-mirabox`

Both plugins register the same actions from `@iracedeck/iracing-actions`. When adding or modifying actions, changes must be applied to **all** plugin packages (registration in `plugin.ts`, manifest entries, PI templates where applicable).

## Creating New Plugins

Use `iracing-plugin-stream-deck` as the reference implementation for Elgato plugins, and `mirabox-plugin` for Mirabox/VSD plugins. Create the following structure:

```
packages/iracing-plugin-stream-deck-{name}/
├── package.json                           # @iracedeck/iracing-plugin-stream-deck-{name}
├── tsconfig.json                          # Extends ../../tsconfig.base.json
├── rollup.config.mjs                      # Update sdPlugin variable only
├── .gitignore                             # node_modules/, *.sdPlugin/bin, *.sdPlugin/logs
├── .vscode/
│   ├── launch.json                        # Debugger attach config
│   └── settings.json                      # JSON schema for manifest
├── src/
│   ├── plugin.ts                          # Entry point
│   ├── svg.d.ts                           # SVG type declarations
│   └── actions/                           # Action implementations
├── icons/                                 # SVG icon templates
└── com.iracedeck.sd.{name}.sdPlugin/
    ├── manifest.json                      # Plugin metadata
    ├── imgs/
    │   ├── plugin/                        # category-icon.png, marketplace.png (@1x and @2x)
    │   └── actions/{action-name}/         # icon.svg, key.svg for each action
    └── ui/
        ├── settings.html                  # Global settings (disableWhenDisconnected) — compiled from @iracedeck/pi-components
        ├── sdpi-components.js             # Copied at build time from @iracedeck/pi-components/browser
        ├── pi-components.js               # Copied at build time from @iracedeck/pi-components/browser
        └── {action-name}.html             # Action-specific Property Inspector — compiled from @iracedeck/pi-components
```

### Key identifiers to update when creating a new plugin:
| Item | Format |
|------|--------|
| Package name | `@iracedeck/iracing-plugin-stream-deck-{name}` |
| Plugin UUID | `com.iracedeck.sd.{name}` |
| sdPlugin folder | `com.iracedeck.sd.{name}.sdPlugin` |
| Action UUIDs | `com.iracedeck.sd.{name}.{action-name}` |

### After creating the plugin:
1. Add `"@iracedeck/pi-components": "workspace:*"` and `"@iracedeck/iracing-actions": "workspace:*"` to the plugin's `package.json` dependencies. Wire the rollup config to `piTemplatePlugin`, `partialsDir`, and `browserDir` from `@iracedeck/pi-components/build`, and compute `actionTemplatesDir` locally from the `@iracedeck/iracing-actions` path (see `.claude/rules/pi-templates.md`). The `sdpi-components.js`/`pi-components.js` files are copied automatically by the plugin's rollup build — no manual copy. Per-action `icon.svg`/`key.svg` are copied from each action folder into `{sdPlugin}/imgs/actions/<name>/` by a dedicated rollup plugin step.
2. Run `pnpm install` in the package directory
3. Run `pnpm build` to verify build succeeds
4. Run `streamdeck link com.iracedeck.sd.{name}.sdPlugin` to register with Stream Deck
5. Restart Stream Deck to see the new plugin category

### Rollup Configuration

If the build fails with "Invalid value for option output.file - when building multiple chunks", add `inlineDynamicImports: true` to the output config in `rollup.config.mjs`:

```javascript
output: {
  file: `${sdPlugin}/bin/plugin.js`,
  sourcemap: isWatching,
  inlineDynamicImports: true  // Add this line
},
```

### Native Module Dependencies (keysender)

**CRITICAL**: If your plugin uses keyboard functionality (`getKeyboard()`, `initializeKeyboard()`), you MUST:

1. **Mark native modules as external** - Native CommonJS modules like `keysender` cannot be bundled into ES modules. Add them to the `external` array:
```javascript
external: ["@iracedeck/iracing-native", "yaml", "keysender"],
```

2. **Include them as runtime dependencies** - Add to the emitted `package.json` in the `generateBundle` hook:
```javascript
const pkg = {
  type: "module",
  dependencies: {
    "@iracedeck/iracing-native": "file:../../../iracing-native",
    "keysender": "2.4.0",
    yaml: "2.8.2",
  }
};
```

**Why this matters**: Bundling `keysender` (a native CommonJS module) into an ES module output causes runtime errors like "require is not defined". The module must be loaded at runtime from `node_modules`.

3. **Use `optionalDependencies` for keysender** - In the emitted `package.json`, place `keysender` under `optionalDependencies` so it installs on Windows but silently fails on macOS/Linux:
```javascript
const pkg = {
  type: "module",
  dependencies: { /* ... */ },
  optionalDependencies: {
    "keysender": "2.4.0",
  }
};
```

Reference `iracing-plugin-stream-deck/rollup.config.mjs` for the correct configuration.

### Application Monitoring

To enable app monitoring (for features like conditional reconnection that pauses when iRacing isn't running), add to manifest.json:

```json
{
  "ApplicationsToMonitor": {
    "windows": ["iRacingSim64DX11.exe"]
  }
}
```

This allows the plugin to receive `applicationDidLaunch` and `applicationDidTerminate` events when iRacing starts/stops.

### Plugin Initialization Order (plugin.ts)

The initialization order in `plugin.ts` is critical. The plugin uses `ElgatoPlatformAdapter` to bridge the Elgato SDK to the platform-agnostic `IDeckPlatformAdapter` interface:

```typescript
import streamDeck from "@elgato/streamdeck";
import { MY_ACTION_UUID, MyAction } from "@iracedeck/iracing-actions";
import { ElgatoPlatformAdapter } from "@iracedeck/deck-adapter-elgato";
import {
  focusIRacingIfEnabled,
  initAppMonitor,
  initGlobalSettings,
  initializeBindingDispatcher,
  initializeKeyboard,
  initializeSDK,
  initializeSimHub,
  initWindowFocus,
} from "@iracedeck/deck-core";
import { IRacingNative } from "@iracedeck/iracing-native";

// 1. Create the Elgato platform adapter
const adapter = new ElgatoPlatformAdapter(streamDeck);

// 2. Enable logging
streamDeck.logger.setLevel("debug");

// 3. Initialize SDK singleton
initializeSDK(adapter.createLogger("iRacingSDK"));

// 4. Initialize keyboard (if using keyboard shortcuts)
const native = new IRacingNative();
initializeKeyboard(
  adapter.createLogger("Keyboard"),
  (scanCodes) => native.sendScanKeys(scanCodes),      // tap (press + release)
  (scanCodes) => native.sendScanKeyDown(scanCodes),    // press only (key hold)
  (scanCodes) => native.sendScanKeyUp(scanCodes),      // release only (key release)
);

// 5. Initialize window focus service
initWindowFocus(adapter.createLogger("WindowFocus"), () => native.focusIRacingWindow());

// 6. Register focus-before-action listeners (BEFORE registering actions)
adapter.onKeyDown(() => focusIRacingIfEnabled());
adapter.onDialDown(() => focusIRacingIfEnabled());
adapter.onDialRotate(() => focusIRacingIfEnabled());

// 7. Register actions via the adapter (logger injected via constructor)
adapter.registerAction(MY_ACTION_UUID, new MyAction(adapter.createLogger("MyAction")));

// 8. Initialize global settings BEFORE connect() - pass adapter!
initGlobalSettings(adapter, adapter.createLogger("GlobalSettings"));

// 9. Initialize SimHub service AFTER global settings (reads host/port from settings)
initializeSimHub(adapter.createLogger("SimHub"));

// 10. Initialize binding dispatcher AFTER global settings, keyboard, and SimHub
initializeBindingDispatcher(adapter.createLogger("BindingDispatcher"));

// 11. Initialize app monitor BEFORE connect() - pass adapter!
initAppMonitor(adapter, adapter.createLogger("AppMonitor"));

// 12. Connect LAST
adapter.connect();
```

**CRITICAL**:
- Both `initGlobalSettings()` and `initAppMonitor()` take an `IDeckPlatformAdapter` (not `typeof StreamDeck`)
- All init calls must be BEFORE `adapter.connect()` (handlers must register first)
- `initializeSimHub()` must come AFTER `initGlobalSettings()` (reads host/port from settings)
- `initializeBindingDispatcher()` must come AFTER `initGlobalSettings()`, `initializeKeyboard()`, and `initializeSimHub()`
- Actions are imported from `@iracedeck/iracing-actions` and registered via `adapter.registerAction(UUID, handler)`
- Logger is injected into each action via constructor: `new MyAction(adapter.createLogger("MyAction"))`
- `initAppMonitor` requires `initializeSDK()` to be called first
