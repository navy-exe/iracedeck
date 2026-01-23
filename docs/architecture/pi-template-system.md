# PI Template System for Stream Deck Plugins

## Goal

Create a build-time template system for Property Inspector HTML files that allows defining global key bindings once and including them across multiple PI files via an accordion UI.

## Design Decisions

1. **Global key bindings editable from each action's PI** - The accordion with key bindings appears in every action that uses them. This is more convenient for users since they can adjust bindings without leaving the action they're configuring.

2. **Global settings are plugin-scoped** - "Global" means shared across all actions *within the same plugin*, not across all plugins. Each plugin (core, pit, comms, etc.) has its own isolated global settings. This is how Stream Deck's `globalSettings` API works - it's per-plugin.

## Approach: EJS Templates with Custom Rollup Plugin

**Why EJS:**

- Mature, battle-tested (since 2010), minimal dependencies
- Simple partial syntax: `<%- include('partials/global-settings') %>`
- Full JavaScript support for passing data to partials
- Zero runtime overhead - compiles to static HTML
- Already using similar Mustache-style templates for icons

## File Structure

```
packages/
  stream-deck-shared/
    src/
      pi-templates/                    # Shared template partials
        partials/
          global-key-bindings.ejs      # Key binding controls in accordion (reusable)
          accordion.ejs                # Reusable accordion component
          head-common.ejs              # Common <head> content
      build/
        pi-template-plugin.ts          # Rollup plugin for EJS
        index.ts                       # Export build utilities
      pi/
        key-binding-input.ts           # Add `global` attribute support

  stream-deck-plugin-core/             # Example plugin
    src/
      pi/                              # Source templates
        black-box-selector.ejs
        settings.ejs
        data/
          key-bindings.json            # Plugin-specific key binding definitions
    com.iracedeck.sd.core.sdPlugin/
      ui/                              # Output (compiled HTML)
```

**Note:** Each plugin has its own `key-bindings.json` since global settings are plugin-scoped. The shared package provides only the build tooling and reusable UI partials.

## Implementation Steps

### 1. Add EJS dependency to stream-deck-shared

- `pnpm add ejs` in stream-deck-shared
- Add `@types/ejs` for TypeScript support

### 2. Create Rollup plugin (`pi-template-plugin.ts`)

- Watch `.ejs` files in source directory
- Watch shared partials for rebuild
- Compile EJS → HTML at build time
- Emit to plugin's `ui/` folder

### 3. Create shared partials

**`accordion.ejs`** - Native `<details>/<summary>` for collapsible sections:

```html
<details class="ird-accordion" <%= locals.open ? 'open' : '' %>>
  <summary class="ird-accordion-header">
    <span class="ird-accordion-title"><%= title %></span>
    <span class="ird-accordion-icon">▼</span>
  </summary>
  <div class="ird-accordion-content">
    <%- content %>
  </div>
</details>
```

**`global-key-bindings.ejs`** - Key binding controls wrapped in accordion:

```html
<%- include('accordion', {
  title: 'Key Bindings',
  open: false,
  content: keyBindings.map(b => `
    <sdpi-item label="${b.label}">
      <ird-key-binding setting="${b.setting}" default="${b.default}" global></ird-key-binding>
    </sdpi-item>
  `).join('')
}) %>
```

**`key-bindings.json`** - Plugin-specific key binding definitions (lives in each plugin, not shared):

```json
// Example: stream-deck-plugin-core/src/pi/data/key-bindings.json
{
  "blackBox": [
    { "id": "lapTiming", "label": "Lap Timing", "default": "F1", "setting": "keys.blackBox.lapTiming" },
    { "id": "standings", "label": "Standings", "default": "F2", "setting": "keys.blackBox.standings" }
  ]
}
```

Each plugin defines its own key bindings. The shared package only provides the accordion partial and build tooling.

### 4. Update `ird-key-binding` component

Add `global` attribute to use `SDPIComponents.useGlobalSettings()` instead of `useSettings()`.

> **Confirmed:** `sdpi-components.js` exports both `useGlobalSettings` and `useSettings` from `SDPIComponents`. The built-in SDPI components already support a `global` attribute that switches between the two APIs while using the same `setting` property for the key path. Our `ird-key-binding` component should follow the same pattern.

### 5. Update GlobalSettingsSchema

Add key binding fields for global storage.

### 6. Integrate into plugin build

Update `rollup.config.mjs` in each plugin:

```javascript
import { piTemplatePlugin } from "@iracedeck/stream-deck-shared/build";

plugins: [
  piTemplatePlugin({
    templatesDir: "src/pi",
    outputDir: `${sdPlugin}/ui`,
    partialsDir: "node_modules/@iracedeck/stream-deck-shared/dist/pi-templates/partials",
  }),
]
```

### 7. Convert existing PI files

- Copy `black-box-selector.html` → `src/pi/black-box-selector.ejs`
- Replace hardcoded key bindings with `<%- include('global-key-bindings', {...}) %>`
- Remove compiled `.html` from git (now build output)

## Example Usage

**Source (`src/pi/black-box-selector.ejs`):**

```html
<!doctype html>
<html lang="en">
<head>
  <%- include('head-common') %>
</head>
<body>
  <sdpi-item label="Mode">
    <sdpi-select setting="mode" default="direct">
      <option value="direct">Direct</option>
      <option value="next">Next</option>
    </sdpi-select>
  </sdpi-item>

  <%- include('global-key-bindings', {
    title: 'Black Box Key Bindings',
    keyBindings: require('./data/key-bindings.json').blackBox
  }) %>
</body>
</html>
```

**Output (`ui/black-box-selector.html`):** Static HTML with accordion inlined.

## Verification

1. Run `pnpm build` in stream-deck-shared
2. Run `pnpm build` in stream-deck-plugin-core
3. Check `ui/black-box-selector.html` contains compiled accordion
4. Open Stream Deck, verify PI renders with collapsible key bindings
5. Verify key binding changes persist to global settings

## Files to Modify

- `packages/stream-deck-shared/package.json` - Add ejs dependency
- `packages/stream-deck-shared/src/build/pi-template-plugin.ts` - NEW
- `packages/stream-deck-shared/src/pi-templates/` - NEW directory
- `packages/stream-deck-shared/src/pi/key-binding-input.ts` - Add global attribute
- `packages/stream-deck-plugin-core/rollup.config.mjs` - Add plugin
- `packages/stream-deck-plugin-core/src/pi/` - NEW directory with .ejs files
