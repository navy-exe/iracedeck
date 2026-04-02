# PI Accordion Sections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize Property Inspector layout with section headers and split the monolithic Global Settings accordion into 4 focused accordions.

**Architecture:** Add a `section-header.ejs` partial for visual section dividers. Split `global-settings.ejs` into `global-color-defaults.ejs`, `global-title-defaults.ejs`, `global-border-defaults.ejs`, and `global-common-settings.ejs`. Wrap `common-settings.ejs` in an accordion. Rename "Border" accordion to "Border Overrides". Update all 32 action templates to use the new include order with section headers.

**Tech Stack:** EJS templates, CSS

---

## File Structure

### New files
- `packages/stream-deck-plugin/src/pi-templates/partials/section-header.ejs` — section header partial
- `packages/stream-deck-plugin/src/pi-templates/partials/global-color-defaults.ejs` — color defaults accordion
- `packages/stream-deck-plugin/src/pi-templates/partials/global-title-defaults.ejs` — title defaults accordion
- `packages/stream-deck-plugin/src/pi-templates/partials/global-border-defaults.ejs` — border defaults accordion
- `packages/stream-deck-plugin/src/pi-templates/partials/global-common-settings.ejs` — iRacing + SimHub accordion

### Modified files
- `packages/stream-deck-plugin/src/pi-templates/partials/head-common.ejs` — add section header CSS
- `packages/stream-deck-plugin/src/pi-templates/partials/common-settings.ejs` — wrap in accordion
- `packages/stream-deck-plugin/src/pi-templates/partials/border-overrides.ejs` — rename title "Border" → "Border Overrides"
- All 32 action EJS templates in `packages/stream-deck-plugin/src/pi/*.ejs` (except `settings.ejs`)
- `.claude/rules/pi-templates.md` — document new partials and section header convention

### Deleted files
- `packages/stream-deck-plugin/src/pi-templates/partials/global-settings.ejs` — replaced by 4 split partials

### Not modified
- `packages/stream-deck-plugin/src/pi/settings.ejs` — special global-only PI, no section headers
- Mirabox plugin — reuses stream-deck-plugin templates/partials via rollup config, changes apply automatically

---

### Task 1: Add section header CSS and partial

**Files:**
- Modify: `packages/stream-deck-plugin/src/pi-templates/partials/head-common.ejs:98-108`
- Create: `packages/stream-deck-plugin/src/pi-templates/partials/section-header.ejs`

- [ ] **Step 1: Add section header CSS to head-common.ejs**

Add after the existing `.ird-section-heading` block (line 108), before the closing `</style>`:

```css
  /* Section header (divides Action Settings from Global Settings) */
  .ird-section-header {
    margin: 20px 0 10px 0;
  }

  .ird-section-header:first-child {
    margin-top: 4px;
  }

  .ird-section-header-label {
    font-family: "Segoe UI", Arial, Roboto, Helvetica, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
    font-size: 8pt;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: #999;
  }

  .ird-section-header-rule {
    height: 1px;
    background: #555;
    margin-top: 6px;
  }
```

- [ ] **Step 2: Create section-header.ejs partial**

```ejs
<div class="ird-section-header">
  <div class="ird-section-header-label"><%= title %></div>
  <div class="ird-section-header-rule"></div>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add packages/stream-deck-plugin/src/pi-templates/partials/head-common.ejs packages/stream-deck-plugin/src/pi-templates/partials/section-header.ejs
git commit -m "feat(pi): add section header partial and CSS (#246)"
```

---

### Task 2: Wrap common-settings in accordion and rename border-overrides

**Files:**
- Modify: `packages/stream-deck-plugin/src/pi-templates/partials/common-settings.ejs`
- Modify: `packages/stream-deck-plugin/src/pi-templates/partials/border-overrides.ejs:13`

- [ ] **Step 1: Wrap common-settings.ejs in accordion**

Replace the entire file content with:

```ejs
<%- include('accordion', {
  title: 'Common Settings',
  open: false,
  content:
    '<sdpi-item label="Flags Overlay">' +
      '<sdpi-checkbox setting="flagsOverlay" label="Flash flag colors on button"></sdpi-checkbox>' +
    '</sdpi-item>'
}) %>
```

- [ ] **Step 2: Rename border-overrides accordion title**

In `border-overrides.ejs`, change line 13 from:

```ejs
  title: 'Border',
```

to:

```ejs
  title: 'Border Overrides',
```

- [ ] **Step 3: Commit**

```bash
git add packages/stream-deck-plugin/src/pi-templates/partials/common-settings.ejs packages/stream-deck-plugin/src/pi-templates/partials/border-overrides.ejs
git commit -m "feat(pi): wrap common-settings in accordion, rename Border to Border Overrides (#246)"
```

---

### Task 3: Split global-settings.ejs into 4 partials

**Files:**
- Create: `packages/stream-deck-plugin/src/pi-templates/partials/global-color-defaults.ejs`
- Create: `packages/stream-deck-plugin/src/pi-templates/partials/global-title-defaults.ejs`
- Create: `packages/stream-deck-plugin/src/pi-templates/partials/global-border-defaults.ejs`
- Create: `packages/stream-deck-plugin/src/pi-templates/partials/global-common-settings.ejs`
- Delete: `packages/stream-deck-plugin/src/pi-templates/partials/global-settings.ejs`

- [ ] **Step 1: Create global-color-defaults.ejs**

Extract the "Icon Colors" section (lines 12–46 of old global-settings.ejs) into its own accordion:

```ejs
<!--
  Global Color Defaults

  Plugin-wide icon color defaults in a collapsible "Color Defaults" accordion.
  Settings are stored in global settings (shared across all action instances).
  Collapsed by default.
-->
<%- include('accordion', {
  title: 'Color Defaults',
  open: false,
  content: `
    <sdpi-item label="Presets">
      <div style="display:flex;gap:6px;">
        <button class="ird-color-preset" data-bg="#000001" data-text="#000001" data-g1="#000001" data-g2="#000001"
          style="padding:4px 10px;border:1px solid #555;border-radius:4px;cursor:pointer;font-size:11px;background:#2a2a2a;color:#808080;">Default</button>
        <button class="ird-color-preset" data-bg="#ffffff" data-text="#000000" data-g1="#000000" data-g2="#ffffff"
          style="padding:4px 10px;border:1px solid #555;border-radius:4px;cursor:pointer;font-size:11px;background:#ffffff;color:#000000;">White</button>
        <button class="ird-color-preset" data-bg="#000000" data-text="#ffffff" data-g1="#ffffff" data-g2="#000000"
          style="padding:4px 10px;border:1px solid #555;border-radius:4px;cursor:pointer;font-size:11px;background:#000000;color:#ffffff;">Black</button>
      </div>
    </sdpi-item>
    <sdpi-item label="Background">
      <div style="display:flex;align-items:center;gap:6px;">
        <sdpi-color id="global-color-bg" setting="colorBackgroundColor" global></sdpi-color>
        <a href="#" class="ird-color-reset" data-input="global-color-bg" data-default="#000001" style="font-size:10px;color:#808080;text-decoration:none;white-space:nowrap;" title="Clear global override">&#x21BA;</a>
      </div>
    </sdpi-item>
    <sdpi-item label="Text">
      <div style="display:flex;align-items:center;gap:6px;">
        <sdpi-color id="global-color-text" setting="colorTextColor" global></sdpi-color>
        <a href="#" class="ird-color-reset" data-input="global-color-text" data-default="#000001" style="font-size:10px;color:#808080;text-decoration:none;white-space:nowrap;" title="Clear global override">&#x21BA;</a>
      </div>
    </sdpi-item>
    <sdpi-item label="Graphic 1">
      <div style="display:flex;align-items:center;gap:6px;">
        <sdpi-color id="global-color-g1" setting="colorGraphic1Color" global></sdpi-color>
        <a href="#" class="ird-color-reset" data-input="global-color-g1" data-default="#000001" style="font-size:10px;color:#808080;text-decoration:none;white-space:nowrap;" title="Clear global override">&#x21BA;</a>
      </div>
    </sdpi-item>
    <sdpi-item label="Graphic 2">
      <div style="display:flex;align-items:center;gap:6px;">
        <sdpi-color id="global-color-g2" setting="colorGraphic2Color" global></sdpi-color>
        <a href="#" class="ird-color-reset" data-input="global-color-g2" data-default="#000001" style="font-size:10px;color:#808080;text-decoration:none;white-space:nowrap;" title="Clear global override">&#x21BA;</a>
      </div>
    </sdpi-item>
  `
}) %>
```

- [ ] **Step 2: Create global-title-defaults.ejs**

Extract the "Title Defaults" section (lines 47–91 of old global-settings.ejs):

```ejs
<!--
  Global Title Defaults

  Plugin-wide title defaults in a collapsible "Title Defaults" accordion.
  Settings are stored in global settings (shared across all action instances).
  Collapsed by default.
-->
<%- include('accordion', {
  title: 'Title Defaults',
  open: false,
  content: `
    <sdpi-item label="Show Title">
      <sdpi-checkbox
        setting="titleShowTitle"
        label="Show title text on key"
        global
        default="true"
      ></sdpi-checkbox>
    </sdpi-item>
    <sdpi-item label="Show Graphics">
      <sdpi-checkbox
        setting="titleShowGraphics"
        label="Show graphics on key"
        global
        default="true"
      ></sdpi-checkbox>
    </sdpi-item>
    <sdpi-item label="Bold">
      <sdpi-select setting="titleBold" default="default" global>
        <option value="default">Default</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </sdpi-select>
    </sdpi-item>
    <sdpi-item label="Font Size">
      <sdpi-checkbox id="global-title-fontSize-default" setting="titleFontSizeDefault" label="Use icon default" global default="true"></sdpi-checkbox>
    </sdpi-item>
    <sdpi-item id="global-title-fontSize-item" class="hidden" label=" ">
      <sdpi-range id="global-title-fontSize" setting="titleFontSize" min="5" max="100" default="9" global showlabels></sdpi-range>
    </sdpi-item>
    <sdpi-item label="Position">
      <sdpi-select id="global-title-position" setting="titlePosition" default="default" global>
        <option value="default">Default</option>
        <option value="top">Top</option>
        <option value="middle">Middle</option>
        <option value="bottom">Bottom</option>
        <option value="custom">Custom</option>
      </sdpi-select>
    </sdpi-item>
    <sdpi-item id="global-title-custom-position-item" class="hidden" label="Custom Position">
      <sdpi-range id="global-title-customPosition" setting="titleCustomPosition" min="-100" max="100" default="0" global showlabels></sdpi-range>
    </sdpi-item>
    <sdpi-item label=" ">
      <button class="ird-title-global-reset" style="padding:4px 10px;border:1px solid #555;border-radius:4px;cursor:pointer;font-size:11px;background:#2a2a2a;color:#d0d0d0;">Reset Title Defaults</button>
    </sdpi-item>
  `
}) %>
```

- [ ] **Step 3: Create global-border-defaults.ejs**

Extract the "Border Defaults" section (lines 92–119 of old global-settings.ejs):

```ejs
<!--
  Global Border Defaults

  Plugin-wide border defaults in a collapsible "Border Defaults" accordion.
  Settings are stored in global settings (shared across all action instances).
  Collapsed by default.
-->
<%- include('accordion', {
  title: 'Border Defaults',
  open: false,
  content: `
    <sdpi-item label="Show Border">
      <sdpi-select id="global-border-enabled" setting="borderEnabled" default="default" global>
        <option value="default">Default</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </sdpi-select>
    </sdpi-item>
    <sdpi-item id="global-border-width-item" class="hidden" label="Width">
      <sdpi-range setting="borderWidth" min="2" max="40" step="2" default="14" global showlabels></sdpi-range>
    </sdpi-item>
    <sdpi-item id="global-border-color-item" class="hidden" label="Color">
      <div style="display:flex;align-items:center;gap:6px;">
        <sdpi-color id="global-border-color" setting="borderColor" global></sdpi-color>
        <a href="#" class="ird-color-reset" data-input="global-border-color" data-default="#000001"
          style="font-size:10px;color:#808080;text-decoration:none;white-space:nowrap;" title="Clear global override">&#x21BA;</a>
      </div>
    </sdpi-item>
    <sdpi-item id="global-border-glow-item" class="hidden" label="Show Glow">
      <sdpi-select id="global-border-glow-enabled" setting="borderGlowEnabled" default="default" global>
        <option value="default">Default</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </sdpi-select>
    </sdpi-item>
    <sdpi-item id="global-border-glow-width-item" class="hidden" label="Glow Width">
      <sdpi-range setting="borderGlowWidth" min="2" max="60" step="2" default="36" global showlabels></sdpi-range>
    </sdpi-item>
  `
}) %>
```

- [ ] **Step 4: Create global-common-settings.ejs**

Extract the "iRacing" and "SimHub" sections (lines 120–142 of old global-settings.ejs):

```ejs
<!--
  Global Common Settings

  Plugin-wide settings (iRacing, SimHub) in a collapsible "Common Settings" accordion.
  Settings are stored in global settings (shared across all action instances).
  Collapsed by default.
-->
<%- include('accordion', {
  title: 'Common Settings',
  open: false,
  content: `
    <div class="ird-section-subtitle">iRacing</div>
    <sdpi-item label="Focus iRacing">
      <sdpi-checkbox
        setting="focusIRacingWindow"
        label="Focus iRacing window before sending keys"
        global
      ></sdpi-checkbox>
    </sdpi-item>
    <div style="padding: 0 16px 8px; font-size: 11px; color: #999;">
      Automatically focuses the iRacing window before sending key inputs.
      Enable if actions aren't working when iRacing is in the background.
    </div>
    <div class="ird-section-subtitle">SimHub</div>
    <sdpi-item label="Host">
      <sdpi-textfield setting="simHubHost" default="127.0.0.1" global></sdpi-textfield>
    </sdpi-item>
    <sdpi-item label="Port">
      <sdpi-textfield setting="simHubPort" default="8888" global pattern="[0-9]{1,5}" inputmode="numeric"></sdpi-textfield>
    </sdpi-item>
    <div style="padding: 0 16px 8px; font-size: 11px; color: #999;">
      Connection settings for SimHub Control Mapper integration.
      Default: 127.0.0.1:8888
    </div>
  `
}) %>
```

- [ ] **Step 5: Delete global-settings.ejs**

```bash
git rm packages/stream-deck-plugin/src/pi-templates/partials/global-settings.ejs
```

- [ ] **Step 6: Commit**

```bash
git add packages/stream-deck-plugin/src/pi-templates/partials/global-color-defaults.ejs packages/stream-deck-plugin/src/pi-templates/partials/global-title-defaults.ejs packages/stream-deck-plugin/src/pi-templates/partials/global-border-defaults.ejs packages/stream-deck-plugin/src/pi-templates/partials/global-common-settings.ejs
git commit -m "feat(pi): split global-settings into 4 focused accordion partials (#246)"
```

---

### Task 4: Update all action EJS templates

**Files:**
- Modify: All 32 action EJS templates in `packages/stream-deck-plugin/src/pi/*.ejs` (NOT `settings.ejs`)

Each action template needs two changes:

1. Add `<%- include('section-header', { title: 'Action Settings' }) %>` as the first element inside `<body>`
2. Replace `<%- include('global-settings') %>` with:
   ```ejs
   <%- include('section-header', { title: 'Global Settings' }) %>

   <%- include('global-color-defaults') %>
   <%- include('global-title-defaults') %>
   <%- include('global-border-defaults') %>
   <%- include('global-common-settings') %>
   ```

The final include order in every action template should be:

```ejs
<body>
  <%- include('section-header', { title: 'Action Settings' }) %>

  <!-- action-specific controls -->

  <%- include('common-settings') %>
  <%- include('title-overrides') %>
  <%- include('color-overrides', { ... }) %>
  <%- include('border-overrides', { ... }) %>

  <%- include('section-header', { title: 'Global Settings' }) %>

  <%- include('global-key-bindings', { ... }) %>   <!-- only if action has key bindings -->
  <%- include('global-title-defaults') %>
  <%- include('global-color-defaults') %>
  <%- include('global-border-defaults') %>
  <%- include('global-common-settings') %>

  <!-- action-specific <script> and <style> blocks -->

  <%- include('docs-link') %>
  <%- include('version') %>
</body>
```

**Templates WITH global-key-bindings (22 templates):**
- ai-spotter-controls.ejs
- audio-controls.ejs
- black-box-selector.ejs
- camera-editor-adjustments.ejs
- camera-editor-controls.ejs
- car-control.ejs
- chat.ejs
- cockpit-misc.ejs
- fuel-service.ejs
- look-direction.ejs
- media-capture.ejs
- setup-aero.ejs
- setup-brakes.ejs
- setup-chassis.ejs
- setup-engine.ejs
- setup-fuel.ejs
- setup-hybrid.ejs
- setup-traction.ejs
- splits-delta-cycle.ejs
- telemetry-control.ejs
- toggle-ui-elements.ejs
- view-adjustment.ejs

**Templates WITHOUT global-key-bindings (10 templates):**
- camera-focus.ejs
- pit-quick-actions.ejs
- race-admin.ejs
- replay-control.ejs
- replay-navigation.ejs
- replay-speed.ejs
- replay-transport.ejs
- session-info.ejs
- telemetry-display.ejs
- tire-service.ejs

- [ ] **Step 1: Update all 32 action templates**

For each template:
1. Add `<%- include('section-header', { title: 'Action Settings' }) %>` as the first line inside `<body>`
2. Replace `<%- include('global-settings') %>` with the 5 new includes (section header + 4 global partials)

Process all templates. The `global-key-bindings` include (if present) stays between the "Global Settings" section header and the new global partials.

- [ ] **Step 2: Verify build**

Run: `pnpm build`
Expected: Build succeeds with no errors. All compiled HTML files in `com.iracedeck.sd.core.sdPlugin/ui/` are updated.

- [ ] **Step 3: Commit**

```bash
git add packages/stream-deck-plugin/src/pi/*.ejs
git commit -m "feat(pi): add section headers and split global includes in all action templates (#246)"
```

---

### Task 5: Update documentation

**Files:**
- Modify: `.claude/rules/pi-templates.md`

- [ ] **Step 1: Update pi-templates.md**

Update the "Available Partials" list to add:
- **section-header.ejs** — Section divider with title label and horizontal rule. Parameters: `title` (string).
- **global-color-defaults.ejs** — Global icon color defaults (presets, color pickers) in accordion
- **global-title-defaults.ejs** — Global title defaults (show/hide, bold, font size, position) in accordion
- **global-border-defaults.ejs** — Global border defaults (enable, width, color, glow) in accordion
- **global-common-settings.ejs** — Global plugin settings (iRacing, SimHub) in accordion

Remove the entry for **global-settings.ejs**.

Update the "Basic Template Structure" example to show the new include order with section headers.

- [ ] **Step 2: Commit**

```bash
git add .claude/rules/pi-templates.md
git commit -m "docs: update pi-templates rule with new section header and split global partials (#246)"
```

---

### Task 6: Build verification and cleanup

- [ ] **Step 1: Run lint and format**

```bash
pnpm lint:fix && pnpm format:fix
```

- [ ] **Step 2: Run tests**

```bash
pnpm test
```

Expected: All tests pass (PI changes are template-only, no action logic changed).

- [ ] **Step 3: Run build**

```bash
pnpm build
```

Expected: Build succeeds.

- [ ] **Step 4: Spot-check a compiled HTML file**

Read one compiled HTML file (e.g., `com.iracedeck.sd.core.sdPlugin/ui/splits-delta-cycle.html`) and verify:
- "Action Settings" section header appears before action controls
- "Common Settings" is in an accordion
- "Border Overrides" (not "Border") accordion title
- "Global Settings" section header appears before global accordions
- 4 separate global accordions: Color Defaults, Title Defaults, Border Defaults, Common Settings
- No reference to old `global-settings` partial

- [ ] **Step 5: Commit any lint/format fixes**

```bash
git add -A && git commit -m "chore: lint and format fixes (#246)"
```

(Skip if no changes.)

---

### Task 7: Update documentation and website

**Files:**
- Modify: `docs/architecture/pi-template-system.md`
- Modify: `packages/website/src/content/docs/docs/features/key-bindings.md:47`

- [ ] **Step 1: Update pi-template-system.md**

This is an early architecture doc that predates the current partial structure. Update the "File Structure" section (lines 25–46) to reflect the current partials, including the new split partials:

```text
packages/
  stream-deck-plugin/
    src/
      pi-templates/                    # Template partials
        partials/
          accordion.ejs                # Reusable accordion component
          border-overrides.ejs         # Per-action border settings
          color-overrides.ejs          # Per-action color overrides
          common-settings.ejs          # Common settings (flags overlay) in accordion
          docs-link.ejs                # Documentation link
          global-border-defaults.ejs   # Global border defaults accordion
          global-color-defaults.ejs    # Global icon color defaults accordion
          global-key-bindings.ejs      # Key binding controls in accordion
          global-common-settings.ejs   # Global plugin settings (iRacing, SimHub) accordion
          global-title-defaults.ejs    # Global title defaults accordion
          head-common.ejs              # Common <head> content + CSS + JS
          section-header.ejs           # Section divider (Action/Global Settings)
          title-overrides.ejs          # Per-action title overrides
          version.ejs                  # Version footer
      pi/                              # Source templates (one per action)
        *.ejs                          # Action PI templates
        data/
          key-bindings.json            # Key binding definitions
          icon-defaults.json           # Icon color defaults (generated)
          docs-urls.json               # Documentation URL mapping
```

Also update the "Example Usage" section (lines 142–163) to show the new include order with section headers.

- [ ] **Step 2: Update key-bindings.md on the website**

In `packages/website/src/content/docs/docs/features/key-bindings.md`, line 47 references "the **Global Settings** section". Update this to reference "the **Common Settings** section" since SimHub connection settings now live in the "Common Settings" accordion:

Change:
```markdown
update the settings in the **Global Settings** section of any action's Property Inspector.
```

To:
```markdown
update the settings in the **Common Settings** section of any action's Property Inspector.
```

- [ ] **Step 3: Commit**

```bash
git add docs/architecture/pi-template-system.md packages/website/src/content/docs/docs/features/key-bindings.md
git commit -m "docs: update architecture docs and website for new PI accordion structure (#246)"
```
