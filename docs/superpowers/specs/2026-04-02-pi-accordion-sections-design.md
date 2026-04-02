# PI Accordion Sections Design

**Issue:** #246
**Date:** 2026-04-02

## Problem

As more settings are added (color overrides, title overrides, border settings), the Property Inspector becomes long and cluttered. There's no visual distinction between per-action and global settings, and the monolithic "Global Settings" accordion bundles too many concerns together.

## Design

### Section Headers

Two section headers divide the PI into logical zones:

- **Action Settings** — above action-specific controls
- **Global Settings** — above global accordions

Style: left-aligned uppercase label with a full-width horizontal rule below it. Uses a new `section-header.ejs` partial with a `title` parameter.

```css
.ird-section-header {
  margin: 20px 0 10px 0;  /* extra top margin for separation */
}

.ird-section-header-label {
  color: #999;
  font-size: 8pt;
  text-transform: uppercase;
  letter-spacing: 1.5px;
  font-family: "Segoe UI", Arial, sans-serif;
}

.ird-section-header-rule {
  height: 1px;
  background: #555;
  margin-top: 6px;
}
```

The first section header ("Action Settings") uses reduced top margin since it's at the top of the body.

### PI Layout Order

```text
── Action Settings ── (section header)
  [action-specific controls — always visible, no accordion]
  ▶ Common Settings        (accordion, collapsed)
  ▶ Color Overrides         (accordion, collapsed — existing)
  ▶ Title Overrides         (accordion, collapsed — existing)
  ▶ Border Overrides        (accordion, collapsed — existing, RENAMED from "Border")

── Global Settings ── (section header)
  ▶ Related Key Bindings    (accordion, collapsed — existing)
  ▶ Color Defaults          (accordion, collapsed — NEW, split from global-settings)
  ▶ Title Defaults          (accordion, collapsed — NEW, split from global-settings)
  ▶ Border Defaults         (accordion, collapsed — NEW, split from global-settings)
  ▶ Plugin Settings         (accordion, collapsed — RENAMED, iRacing + SimHub only)

  [docs link]               (outside sections, at bottom)
  [version footer]          (outside sections, at bottom)
```

### Changes to Partials

#### New partial: `section-header.ejs`

Takes a `title` parameter. Renders the section header HTML.

#### Modified: `common-settings.ejs`

Wrap the existing content in the `accordion` partial with title "Common Settings". Remove the current `.ird-section-heading` div.

#### Modified: `border-overrides.ejs`

Rename accordion title from "Border" to "Border Overrides".

#### Split: `global-settings.ejs`

The current monolithic `global-settings.ejs` is split into 4 new partials:

1. **`global-color-defaults.ejs`** — Icon Colors section (preset buttons + color pickers), wrapped in accordion titled "Color Defaults"
2. **`global-title-defaults.ejs`** — Title Defaults section (show/hide, bold, font size, position), wrapped in accordion titled "Title Defaults"
3. **`global-border-defaults.ejs`** — Border Defaults section (show border, width, color, glow), wrapped in accordion titled "Border Defaults"
4. **`global-plugin-settings.ejs`** — iRacing + SimHub sections only, wrapped in accordion titled "Plugin Settings"

The original `global-settings.ejs` is removed.

#### Unchanged partials

- `accordion.ejs` — no changes needed
- `head-common.ejs` — add CSS for `.ird-section-header`, `.ird-section-header-label`, `.ird-section-header-rule`
- `color-overrides.ejs` — unchanged
- `title-overrides.ejs` — unchanged
- `global-key-bindings.ejs` — unchanged
- `docs-link.ejs` — unchanged
- `version.ejs` — unchanged

### Action Template Updates

Every action EJS template is updated to follow this include order:

```ejs
<head>
  <%- include('head-common') %>
</head>
<body>
  <%- include('section-header', { title: 'Action Settings' }) %>

  <!-- action-specific controls (inline, no accordion) -->

  <%- include('common-settings') %>
  <%- include('color-overrides', { slots: [...], defaults: ... }) %>
  <%- include('title-overrides') %>
  <%- include('border-overrides', { defaults: ... }) %>

  <%- include('section-header', { title: 'Global Settings' }) %>

  <%- include('global-key-bindings', { keyBindings: ... }) %>
  <%- include('global-color-defaults') %>
  <%- include('global-title-defaults') %>
  <%- include('global-border-defaults') %>
  <%- include('global-plugin-settings') %>

  <%- include('docs-link', { docsUrl: ... }) %>
  <%- include('version', { version: ... }) %>
</body>
```

Actions without key bindings omit the `global-key-bindings` include.

### Mirabox Plugin

Mirabox PI templates follow the same structure. Its templates are compiled from the shared partials directory, so the partial changes apply automatically. Any mirabox-specific EJS templates need the same include order update.

### What's NOT Changing

- Accordion component (`accordion.ejs`) — no structural changes
- Accordion styling — same `<details>`/`<summary>` pattern
- Per-action override behavior — same functionality, just renamed "Border" → "Border Overrides"
- JavaScript logic in partials — all existing JS stays as-is, just moves to the new split partials
- Docs link and version footer — stay at the bottom, outside sections

## Artifacts to Update

- **PI partials** — new `section-header.ejs`, split `global-settings.ejs`, modify `common-settings.ejs`, rename in `border-overrides.ejs`
- **All action EJS templates** — both `stream-deck-plugin` and `mirabox-plugin`
- **`head-common.ejs`** — add section header CSS
- **`.claude/rules/pi-templates.md`** — document section header partial and new global partials
- **Compiled HTML** — rebuild to regenerate all PI HTML files
