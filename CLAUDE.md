# iRaceDeck

Stream Deck plugins for iRacing. Monorepo with pnpm workspaces + Turbo.

## Packages

- `@iracedeck/logger` - Logger interface with LogLevel enum
- `@iracedeck/iracing-native` - Native C++ addon (node-addon-api) for iRacing SDK
- `@iracedeck/iracing-sdk` - High-level wrapper: IRacingSDK, SDKController, commands, types
- `@iracedeck/stream-deck-shared` - Shared utilities for Stream Deck plugins (logger adapter)
- `@iracedeck/stream-deck-plugin` - Main plugin (`.sdPlugin` folder: `com.iracedeck.sd.sdPlugin`)
- `@iracedeck/stream-deck-plugin-comms` - Communication plugin (`.sdPlugin` folder: `com.iracedeck.sd.comms.sdPlugin`)
- `@iracedeck/stream-deck-plugin-pit` - Pit service plugin (`.sdPlugin` folder: `com.iracedeck.sd.pit.sdPlugin`)
- `@iracedeck/website` - Promotional website hosted on Firebase

## Architecture

### Legacy (being refactored)

- SDK classes use singletons with `getInstance()` - moving to dependency injection
- `IRacingSDK.setLoggers(logger)` configures logging for all SDK singletons

### Design Principles

- Follow SOLID principles
- Inject dependencies, no hardcoded singletons in business logic
- Use interfaces for external dependencies (prefix with `I`: `IConnectionManager`)
- Use `type` for data shapes: `TelemetryData`, `SessionInfo`
- No side effects in constructors or class methods (return new state, don't mutate)
- All new code must have unit tests (test file: `foo.ts` → `foo.test.ts`)
- Test framework: Vitest (ESM-native, `describe`/`it`/`expect` API)

## Making changes

- All changes must be tracked in git. For example moving files must be trackable, not just delete old file & create new file.

## Stream Deck Plugins

- Stream Deck Actions are located in {package}/src/actions/\*\*
- All actions must extend class ConnectionStateAwareAction from packages\stream-deck-shared\src\connection-state-aware-action.ts
- All action settings must be using Zod if action has settings
- Actions must not handle offline state (no data available) themselves. This is handled globally.

## Icons

Key Icons are SVG icons displayed on Stream Deck buttons.

### SVG Structure

All icons must follow this format:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72">
  <g filter="url(#activity-state)">
    {icon content}
  </g>
</svg>
```

The `<g filter="url(#activity-state)">` wrapper is required - it controls the dimmed appearance when disconnected.

### Design Specifications

| Property | Value |
|----------|-------|
| Canvas size | 72x72 |
| Safe area | 8px margin (content in 56x56 centered area) |
| Stroke width | 2-2.5px for main elements, 1-1.5px for details |
| Corner radius | 1.5-3px for rounded rectangles |

### Color Palette

| Color | Hex | Usage |
|-------|-----|-------|
| White | `#ffffff` | Default icon elements |
| Green | `#2ecc71` | Positive actions (add, increase, on) |
| Red | `#e74c3c` | Negative actions (remove, decrease, off) |
| Yellow | `#f1c40f` | Warning, caution states |
| Gray | `#888888` | Inactive, secondary elements |

### Text in Icons

- Font size: 12-25px
- Bottom label position: `x="36" y="65" text-anchor="middle"`
- Use `<text class="title">` for labels that should hide when disconnected
- If `data-no-na="true"` is added to `<svg>`, "N/A" will not be displayed when disconnected

### Icon Variants

For actions with configurable direction (+/- type), design the icon to reflect the selected direction:

- **Increase/Up**: Arrow pointing up, plus sign, or expanding visual
- **Decrease/Down**: Arrow pointing down, minus sign, or contracting visual
- **Left/Right**: Horizontal arrows or directional indicators

### Icon Templates

Icon templates are SVG files with Mustache-style `{{placeholder}}` syntax for dynamic values. Templates are:

- Located in `{package}/icons/` folder (e.g., `packages/stream-deck-plugin-pit/icons/do-fuel-add.svg`)
- Imported as strings at build time via rollup svgPlugin
- Rendered using `renderIconTemplate(template, { placeholder: "value" })`
- Converted to data URIs with `svgToDataUri(svg)`

Example template (`icons/do-fuel-add.svg`):
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72" data-no-na="true">
  <g filter="url(#activity-state)">
    <!-- Fuel pump body -->
    <rect x="18" y="6" width="20" height="30" rx="2" fill="none" stroke="#2ecc71" stroke-width="2.5"/>
    <!-- Fuel gauge inside pump -->
    <rect x="22" y="10" width="12" height="8" rx="1" fill="none" stroke="#2ecc71" stroke-width="1.5"/>
    <!-- Hose -->
    <path d="M38 14 h6 a4 4 0 0 1 4 4 v14" fill="none" stroke="#2ecc71" stroke-width="2.5" stroke-linecap="round"/>
    <!-- Nozzle -->
    <path d="M48 32 l6 -2 v8 l-6 -2 z" fill="#2ecc71"/>
    <!-- Plus sign -->
    <rect x="22" y="25" width="12" height="3" rx="1" fill="#2ecc71"/>
    <rect x="26.5" y="20.5" width="3" height="12" rx="1" fill="#2ecc71"/>
{{textElement}}
  </g>
</svg>
```

Example usage in action:
```typescript
import { renderIconTemplate, svgToDataUri, generateIconText } from "@iracedeck/stream-deck-shared";
import doFuelAddTemplate from "../../icons/do-fuel-add.svg";

const svg = renderIconTemplate(doFuelAddTemplate, {
  textElement: generateIconText("+5 L")
});
const dataUri = svgToDataUri(svg);
```

Use `escapeXml()` from `@iracedeck/stream-deck-shared` for user-provided text values.

## Conventions

- Run `pnpm lint:fix` and `pnpm format:fix` before committing
- Use Zod with `z.coerce` for action settings (Stream Deck sends strings)
- Flag utilities: `hasFlag()`, `addFlag()`, `removeFlag()` from types.ts

## Build

```bash
pnpm install
pnpm build                    # Build all
pnpm build:stream-deck        # Build Stream Deck plugins only
pnpm watch:stream-deck        # Watch mode for Stream Deck plugins
pnpm lint:fix                 # Fix linting issues
pnpm format:fix               # Fix formatting issues
pnpm test                     # Run tests once
pnpm test:watch               # Run tests in watch mode
```

## Commiting code

- Use conventional commits
- The scope in conventional commit should usually be the package
- Do not add any references to Claude or any other AI tool to commit messages
- Do not add co-authors such as "Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>" to commit messages

## Terminology

- **Property Inspector** - Stream Deck's settings panel for configuring an action
- **Key Icon** - The icon displayed on a Stream Deck button
- **Encoder** - Rotary dial on Stream Deck+ devices
- **Action ID** - Unique identifier in format `com.iracedeck.sd.{plugin}.{action-name}`

## References

- iRacing SDK: https://forums.iracing.com/discussion/15068/official-iracing-sdk
- Stream Deck SDK: https://docs.elgato.com/sdk/
