---
# Property Inspector Templates

## Overview

Property Inspector HTML files are built from EJS templates at compile time. This allows:
- Shared partials for common UI components
- Data-driven content from JSON files
- Consistent styling across plugins

## Directory Structure

```
packages/stream-deck-plugin-{name}/
├── src/pi/                    # EJS template sources
│   ├── action-name.ejs        # Action PI template
│   └── data/                  # JSON data files
│       └── key-bindings.json  # Key binding definitions
├── com.iracedeck.sd.{name}.sdPlugin/
│   └── ui/                    # Compiled HTML output
│       └── action-name.html   # Generated (do not edit)
```

## Creating a PI Template

### Basic Template Structure

```ejs
<!doctype html>
<html lang="en">
  <head>
    <%- include('head-common') %>
  </head>
  <body>
    <%- include('section-header', { title: 'Action Settings' }) %>

    <!-- Action-specific settings -->
    <sdpi-item label="Setting">
      <sdpi-select setting="mySetting" default="value">
        <option value="value">Label</option>
      </sdpi-select>
    </sdpi-item>

    <%- include('title-overrides') %>
    <%- include('color-overrides', { slots: [...], defaults: require('./data/icon-defaults.json')['action-name'] }) %>
    <%- include('border-overrides', { defaults: require('./data/icon-defaults.json')['action-name'] }) %>
    <%- include('common-settings') %>

    <%- include('section-header', { title: 'Global Settings' }) %>

    <%- include('global-key-bindings', {
      keyBindings: require('./data/key-bindings.json').category
    }) %>
    <%- include('global-title-defaults') %>
    <%- include('global-color-defaults') %>
    <%- include('global-border-defaults') %>
    <%- include('global-common-settings') %>

    <script>
      // PI-specific JavaScript
    </script>

    <%- include('docs-link') %>
    <%- include('version') %>
  </body>
</html>
```

### Available Partials

Located in `packages/stream-deck-plugin/src/pi-templates/partials/`:

- **head-common.ejs** - Required scripts, common styles, and color preset/reset handlers
- **accordion.ejs** - Collapsible section component. Accepts an optional `accordionId` parameter (defaults to `title`) used as the persistence key in global settings (`_accordionState`). The `accordionId` must be unique per PI page — use it when two accordions share the same display title (e.g., per-action vs global "Common Settings"). State is shared across action types since most actions use the same accordion IDs.
- **section-header.ejs** - Section divider with title label and horizontal rule. Parameters: `title` (string). Used to separate "Action Settings" from "Global Settings".
- **common-settings.ejs** - Common settings shared by all actions (flags overlay), wrapped in accordion
- **color-overrides.ejs** - Per-action color override controls with Default/White/Black presets
- **border-overrides.ejs** - Per-action border settings (enable, width, color). Place after color-overrides.
- **title-overrides.ejs** - Per-action title override controls (show/hide title and graphics, title text, bold, font size, position)
- **global-key-bindings.ejs** - Key bindings in collapsible section
- **global-color-defaults.ejs** - Global icon color defaults (presets, color pickers) in accordion
- **global-title-defaults.ejs** - Global title defaults (show/hide, bold, font size, position) in accordion
- **global-border-defaults.ejs** - Global border defaults (enable, width, color, glow) in accordion
- **global-common-settings.ejs** - Global common settings (window focus, SimHub server) in accordion
- **docs-link.ejs** - Documentation link to the action's page on iracedeck.com (conditional, hidden when no URL mapped)
- **version.ejs** - Version footer with downloads link

## Title Overrides Partial

Adds per-action title customization controls. Settings are stored under the `titleOverrides` key in action settings.

```ejs
<%- include('title-overrides') %>
```

No parameters needed. The partial provides controls for:
- **Show Title** / **Show Graphics** — three-state select (Inherit / Yes / No)
- **Title Text** — multiline textarea to override default title (`titleText`, newline-separated)
- **Bold** — three-state select (Inherit / Yes / No)
- **Font Size** — gated by "Override font size" checkbox; when enabled, shows range slider (5–100, doubled for SVG)
- **Position** — select (Inherit / Top / Middle / Bottom / Custom); Custom reveals offset slider (−100 to +100)

Place before `color-overrides`, after action-specific settings.

## Border Overrides Partial

Adds per-action border settings. Settings are stored under the `borderOverrides` key in action settings.

```ejs
<%- include('border-overrides') %>
```

No parameters needed. The partial provides controls for:
- **Enable Border** — checkbox to toggle the border on/off (disabled by default)
- **Width** — range slider (1–20, step 1, default 7), hidden when disabled
- **Color** — color picker (default `#00aaff`), hidden when disabled
- **Show Glow** — three-state select (Inherit / Yes / No), hidden when border disabled
- **Glow Width** — range slider (1–30, step 1, default 18), hidden when border or glow disabled

For toggle actions (DRS, Push-to-Pass, Fuel Toggle, Windshield Tearoff, Fast Repair), the color picker is ignored — border color is driven by on/off/n/a state automatically.

Place after `color-overrides` include, before `common-settings`.

## Color Overrides Partial

Adds per-action color customization with `<ird-color-picker>` components and preset buttons.

```ejs
<%- include('color-overrides', {
  slots: ['backgroundColor', 'textColor', 'graphic1Color'],
  defaults: require('./data/icon-defaults.json')['action-name']
}) %>
```

Parameters:
- `slots` — Array of slot names to show: `backgroundColor`, `textColor`, `graphic1Color`, `graphic2Color`
- `defaults` — Object from `icon-defaults.json` with default hex colors per slot

Place after `title-overrides`, before `border-overrides`.

### icon-defaults.json

Generated by `node scripts/generate-icon-defaults.mjs` from icon `<desc>` metadata. Maps action names to their default colors and border color. Run this script after adding new icons.

## Rollup Configuration

Add `piTemplatePlugin` to your plugin's rollup.config.mjs:

```javascript
import { piTemplatePlugin } from "./src/build/pi-template-plugin.mjs";

const sdPlugin = "com.iracedeck.sd.{name}.sdPlugin";

export default {
  plugins: [
    piTemplatePlugin({
      templatesDir: "src/pi",
      outputDir: `${sdPlugin}/ui`,
      partialsDir: "src/pi-templates/partials",
    }),
    // ... other plugins
  ],
};
```

## Key Bindings JSON Format

```json
{
  "categoryName": [
    {
      "id": "uniqueId",
      "label": "Display Label",
      "default": "F1",
      "setting": "keys.category.settingName"
    }
  ]
}
```

## Documentation URLs JSON Format

`src/pi/data/docs-urls.json` maps PI template names (without `.ejs`) to their documentation page URLs:

```json
{
  "action-name": "https://iracedeck.com/docs/actions/{category}/{action-name}/"
}
```

Templates not in the map (e.g., `settings`, hidden sub-actions) will not show a documentation link.

**Maintenance:** When adding a new action, add its entry to `docs-urls.json` with the correct category and action name.

## Build Output

- Templates in `src/pi/*.ejs` compile to `ui/*.html`
- The `data/` subdirectory is excluded from compilation
- Changes to templates or partials trigger rebuilds in watch mode
