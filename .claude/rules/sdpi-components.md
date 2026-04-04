---
paths:
  - "packages/*/src/pi/**"
  - "packages/*/src/pi-templates/**"
  - "packages/*/*.sdPlugin/ui/**"
---
# sdpi-components Library Reference

The `sdpi-components` library (Lit.js web components) provides styled inputs for Stream Deck Property Inspectors with automatic settings persistence. Loaded via a single script tag — no build tools needed in the PI HTML.

```html
<script src="sdpi-components.js"></script>
```

Source & docs: https://sdpi-components.dev/docs/components

## Common Attributes

Most input components share these attributes:

| Attribute | Type | Description |
|-----------|------|-------------|
| `setting` | `string` | Settings key for auto-persistence. Supports dot-notation for nested paths (e.g., `foo.bar.prop` creates `{"foo":{"bar":{"prop":"value"}}}`). |
| `global` | `boolean` | When present, persists to **global settings** instead of per-action settings. |
| `default` | `string` | Initial value when no persisted value exists. |
| `disabled` | `boolean` | Disables the input. |
| `value` | varies | Current value; also the persisted setting value. |

## Components

### `<sdpi-item>` — Layout Wrapper

Container providing consistent layout and a label. **Optional but recommended.**

| Attribute | Type | Description |
|-----------|------|-------------|
| `label` | `string` | Label text; clicking focuses the first child input. |

```html
<sdpi-item label="Name">
  <sdpi-textfield setting="name"></sdpi-textfield>
</sdpi-item>
```

### `<sdpi-button>` — Button

No `setting` attribute — buttons trigger actions, not persisted values.

| Attribute | Type | Description |
|-----------|------|-------------|
| `disabled` | `boolean` | Disables the button. |
| `value` | `string` | Button value. |

```html
<sdpi-item>
  <sdpi-button onclick="doSomething()">Click me</sdpi-button>
</sdpi-item>
```

### `<sdpi-checkbox>` — Checkbox

Value type: `boolean`.

| Attribute | Type | Description |
|-----------|------|-------------|
| `setting` | `string` | Settings key. |
| `label` | `string` | Text displayed right of checkbox. |
| `default` | `boolean` | Default checked state. |

**CRITICAL PITFALL:** `default="false"` renders as **checked** because HTML attributes are strings and `"false"` is truthy. **Omit `default` entirely** for an unchecked default.

Corresponding Zod pitfall: `z.coerce.boolean()` also treats `"false"` as `true`. Use a union+transform:

```typescript
// GOOD
myBool: z
  .union([z.boolean(), z.string()])
  .transform((val) => val === true || val === "true")
  .default(false),
```

### `<sdpi-checkbox-list>` — Multi-Checkbox (Set Value)

Value type: array/Set of selected option values — NOT individual booleans.

| Attribute | Type | Description |
|-----------|------|-------------|
| `setting` | `string` | Settings key. |
| `columns` | `number` | Column count (1–6). |
| `value-type` | `string` | `"boolean"`, `"number"`, or `"string"` (default). |
| `datasource` | `string` | Remote data source event name. |
| `hot-reload` | `boolean` | Monitor `sendToPropertyInspector` for live updates. |
| `loading` | `string` | Text shown while loading from datasource. |

```html
<sdpi-checkbox-list setting="fav_numbers" columns="2">
  <option value="1">One</option>
  <option value="2">Two</option>
  <option value="3">Three</option>
</sdpi-checkbox-list>
```

Persisted value example: `{"fav_numbers": ["1", "3"]}`

### `<sdpi-color>` — Color Picker

Value type: hex string (e.g., `"#00aaff"`).

| Attribute | Type | Description |
|-----------|------|-------------|
| `setting` | `string` | Settings key. |
| `default` | `string` | Default hex color. |

```html
<sdpi-color setting="selected_color" default="#00aaff"></sdpi-color>
```

### `<sdpi-select>` — Dropdown

Value type: `boolean`, `number`, or `string` (default).

| Attribute | Type | Description |
|-----------|------|-------------|
| `setting` | `string` | Settings key. |
| `default` | `string` | Default selected value. |
| `placeholder` | `string` | Hint text when no selection. |
| `value-type` | `string` | `"boolean"`, `"number"`, or `"string"` (default). |
| `datasource` | `string` | Remote data source event name. |
| `hot-reload` | `boolean` | Monitor for live updates. |
| `show-refresh` | `boolean` | Show refresh button (datasource only). |
| `label-setting` | `string` | Also persist the selected option's **label text** to this separate key. |
| `loading` | `string` | Text shown while loading. |

Supports `<option>` and `<optgroup>` children.

```html
<sdpi-select setting="color" placeholder="Choose a color">
  <optgroup label="Primary">
    <option value="#ff0000">Red</option>
    <option value="#00ff00">Green</option>
  </optgroup>
  <option value="#000000">Black</option>
</sdpi-select>
```

**CRITICAL PITFALL:** `sdpi-select` fires `input` events, NOT `change` events. For reliable detection in custom JS, listen to both and add a polling fallback:

```javascript
select.addEventListener("change", handleChange);
select.addEventListener("input", handleChange);

let lastValue = select.value || "default";
setInterval(() => {
  const currentValue = select.value;
  if (currentValue && currentValue !== lastValue) {
    lastValue = currentValue;
    handleChange();
  }
}, 100);
```

### `<sdpi-radio>` — Radio Buttons

Value type: `boolean`, `number`, or `string` (default).

| Attribute | Type | Description |
|-----------|------|-------------|
| `setting` | `string` | Settings key. |
| `columns` | `number` | Column count (1–6). |
| `default` | `string` | Default selected value. |
| `value-type` | `string` | `"boolean"`, `"number"`, or `"string"` (default). |
| `datasource` | `string` | Remote data source event name. |
| `hot-reload` | `boolean` | Monitor for live updates. |
| `loading` | `string` | Loading text. |

```html
<sdpi-radio setting="fav_number" columns="3">
  <option value="1">One</option>
  <option value="2">Two</option>
  <option value="3">Three</option>
</sdpi-radio>
```

### `<sdpi-range>` — Range Slider

Value type: `number`.

| Attribute | Type | Description |
|-----------|------|-------------|
| `setting` | `string` | Settings key. |
| `default` | `string` | Default value. |
| `min` | `number` | Minimum value. |
| `max` | `number` | Maximum value. |
| `step` | `number` | Increment size. |
| `showlabels` | `boolean` | Show min/max labels. |

**Slots:** `min` and `max` for custom label content.

```html
<sdpi-range setting="brightness" min="0" max="100" step="5" showlabels>
  <span slot="min">0%</span>
  <span slot="max">100%</span>
</sdpi-range>
```

### `<sdpi-textfield>` — Text Input

Value type: `string`.

| Attribute | Type | Description |
|-----------|------|-------------|
| `setting` | `string` | Settings key. |
| `maxlength` | `number` | Maximum characters. |
| `pattern` | `string` | Regex validation pattern. |
| `placeholder` | `string` | Hint text. |
| `required` | `boolean` | Shows indicator when empty. |

```html
<sdpi-textfield setting="name" placeholder="Enter name" required></sdpi-textfield>
```

### `<sdpi-textarea>` — Textarea

Value type: `string`.

| Attribute | Type | Description |
|-----------|------|-------------|
| `setting` | `string` | Settings key. |
| `maxlength` | `number` | Maximum characters. |
| `rows` | `number` | Visible rows. |
| `showlength` | `boolean` | Show character count. |

```html
<sdpi-textarea setting="description" maxlength="250" rows="3" showlength></sdpi-textarea>
```

### `<sdpi-password>` — Password Input

Value type: `string`. Same attributes as `<sdpi-textfield>` minus `pattern`.

```html
<sdpi-password setting="api_key" placeholder="API Key" required></sdpi-password>
```

### `<sdpi-calendar>` — Date/Time Inputs

Value type: ISO-format `string`. The `type` attribute selects the variant.

| Attribute | Type | Description |
|-----------|------|-------------|
| `type` | `string` | **Required.** One of: `date`, `datetime-local`, `month`, `time`, `week`. |
| `min` | `string` | Minimum date/time. |
| `max` | `string` | Maximum date/time. |
| `step` | `number` | Granularity. |

| Type | Format Example |
|------|---------------|
| `date` | `"2022-04-01"` |
| `datetime-local` | `"2022-04-01T16:30"` |
| `month` | `"2022-04"` |
| `time` | `"16:30"` |
| `week` | `"2022-W13"` |

```html
<sdpi-calendar type="date" setting="target_date"></sdpi-calendar>
```

### `<sdpi-delegate>` — Plugin-Driven Value

The value is set by the **plugin** after invocation, not by the user directly.

| Attribute | Type | Description |
|-----------|------|-------------|
| `setting` | `string` | Settings key. |
| `invoke` | `string` | Event name sent to plugin when button clicked. |
| `label` | `string` | Button text (default: `...`). |
| `format-type` | `string` | Display formatting (e.g., `"path"` renders file name). |

When clicked, sends `sendToPlugin` with `payload: {event: "eventName"}`. The plugin responds by updating the setting.

```html
<sdpi-delegate setting="folder_path" invoke="browseFolder" label="Browse..."></sdpi-delegate>
```

### `<sdpi-file>` — File Picker

Value type: file path `string`.

| Attribute | Type | Description |
|-----------|------|-------------|
| `setting` | `string` | Settings key. |
| `accept` | `string` | Allowed file types (e.g., `"image/png, image/jpeg"`). |
| `label` | `string` | Button text (default: `...`). |

```html
<sdpi-file setting="avatar" accept="image/png, image/jpeg"></sdpi-file>
```

### `<sdpi-i18n>` — Localized Content (v2.1.0+)

Renders a localized message string inline.

```html
<sdpi-i18n key="click_prompt"></sdpi-i18n>
```

## Helpers

### Stream Deck Client — PI-to-Plugin Communication

Access via `SDPIComponents.streamDeckClient`. This is the bridge for bidirectional messaging between the Property Inspector and the Stream Deck plugin.

#### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getConnectionInfo()` | `Promise<Record<string, unknown>>` | Registration data: devices, OS, plugin version/UUID, action metadata (coordinates, settings). |
| `getSettings()` | `Promise<ActionSettingsPayload>` | Get current action's settings (includes coordinates, isInMultiAction). |
| `setSettings(value)` | `void` | Persist action settings. Triggers `didReceiveSettings` on both PI and plugin. |
| `getGlobalSettings()` | `Promise<Record<string, unknown>>` | Get plugin-wide global settings. |
| `setGlobalSettings(value)` | `void` | Persist global settings. Triggers `didReceiveGlobalSettings` on both PI and plugin. |
| `send(event, payload?)` | `Promise<void>` | Send arbitrary event (see valid events below). |

#### Valid Events for `send()`

| Event | Payload | Description |
|-------|---------|-------------|
| `getSettings` | — | Request current settings (response via `didReceiveSettings` event). |
| `setSettings` | `Record<string, unknown>` | Persist settings. |
| `getGlobalSettings` | — | Request global settings. |
| `setGlobalSettings` | `Record<string, unknown>` | Persist global settings. |
| `logMessage` | `{message: string}` | Write to the Stream Deck log. |
| `openUrl` | `{url: string}` | Open a URL in the default browser. |
| `sendToPlugin` | `Record<string, unknown>` | Send a custom message to the plugin. |

#### Subscribable Events

| Event | Fires When |
|-------|------------|
| `didReceiveSettings` | Action settings change (from any source). |
| `didReceiveGlobalSettings` | Global settings change (from any source). |
| `sendToPropertyInspector` | Plugin sends a message to the PI. |

#### Event Payloads

```typescript
// didReceiveSettings
type DidReceiveSettingsEvent = {
  action: string;
  context: string;
  device: string;
  event: "didReceiveSetting";
  payload: {
    coordinates: { column: number; row: number };
    settings: Record<string, unknown>;
  };
};

// didReceiveGlobalSettings
type DidReceiveGlobalSettingsEvent = {
  event: "didReceiveGlobalSettings";
  payload: {
    settings: Record<string, unknown>;
  };
};

// sendToPropertyInspector
type SendToPropertyInspectorEvent = {
  action: string;
  context: string;
  event: "sendToPropertyInspector";
  payload: Record<string, unknown>;
};
```

#### Usage Examples

```javascript
// Get settings
const info = await SDPIComponents.streamDeckClient.getConnectionInfo();
const settings = await SDPIComponents.streamDeckClient.getGlobalSettings();

// Set settings
SDPIComponents.streamDeckClient.setGlobalSettings({ key: "value" });

// Subscribe to events
SDPIComponents.streamDeckClient.didReceiveSettings.subscribe((ev) => {
  console.log("Settings changed:", ev.payload.settings);
});

SDPIComponents.streamDeckClient.didReceiveGlobalSettings.subscribe((ev) => {
  console.log("Global settings:", ev.payload.settings);
});

SDPIComponents.streamDeckClient.sendToPropertyInspector.subscribe((ev) => {
  // Handle custom messages from the plugin
  console.log("Plugin says:", ev.payload);
});

// Send message to plugin
await SDPIComponents.streamDeckClient.send("sendToPlugin", { myEvent: "data" });

// Open URL in browser
await SDPIComponents.streamDeckClient.send("openUrl", { url: "https://example.com" });

// Log to Stream Deck log
await SDPIComponents.streamDeckClient.send("logMessage", { message: "Debug info" });
```

### Data Source — Dynamic Options from Plugin

The `datasource` attribute on `<sdpi-select>`, `<sdpi-radio>`, and `<sdpi-checkbox-list>` enables plugin-driven option population.

**Flow:**
1. Component initializes, sends `sendToPlugin` with `payload: {event: "<datasource-value>"}`.
2. Plugin receives the event and responds via `sendToPropertyInspector` with items.
3. Component renders the options.

**Request (PI to plugin):**

```json
{"payload": {"event": "getColors"}}
```

On manual refresh (`.refresh()` method or refresh button), adds `"isRefresh": true`.

**Response (plugin to PI):**

```json
{
  "event": "getColors",
  "items": [
    {
      "label": "Primary Colors",
      "children": [
        {"label": "Red", "value": "#ff0000"},
        {"label": "Green", "value": "#00ff00", "disabled": true}
      ]
    },
    {"label": "Black", "value": "#000000"}
  ]
}
```

**Item types:**

```typescript
type Item = { value: string; label?: string; disabled?: boolean };
type ItemGroup = { label?: string; children: Item[] };
type DataSourceResult = (Item | ItemGroup)[];
```

- Supports nested groups via `children` (renders as `<optgroup>` in select)
- Individual items can be `disabled`
- `hot-reload` enables live updates when the plugin sends new data via `sendToPropertyInspector`

### Localization (i18n, v2.1.0+)

```javascript
SDPIComponents.i18n.locales = {
  en: { name: "Name", greeting: "Hello" },
  es: { name: "Nombre", greeting: "Hola" },
};
```

Use `__MSG_{key}__` template syntax in text attributes (e.g., `label="__MSG_name__"`), or `<sdpi-i18n key="greeting">` for inline rendering. Falls back to English, then to the raw key.

## Quick Reference Table

| Component | Value Type | `datasource` | Slots |
|-----------|-----------|--------------|-------|
| `<sdpi-item>` | — (layout) | No | Children |
| `<sdpi-button>` | — (action) | No | Content |
| `<sdpi-checkbox>` | `boolean` | No | No |
| `<sdpi-checkbox-list>` | `Set` (array) | Yes | `<option>` |
| `<sdpi-color>` | hex `string` | No | No |
| `<sdpi-select>` | `string`/`number`/`boolean` | Yes | `<option>`, `<optgroup>` |
| `<sdpi-radio>` | `string`/`number`/`boolean` | Yes | `<option>` |
| `<sdpi-range>` | `number` | No | `min`, `max` |
| `<sdpi-textfield>` | `string` | No | No |
| `<sdpi-textarea>` | `string` | No | No |
| `<sdpi-password>` | `string` | No | No |
| `<sdpi-calendar>` | ISO `string` | No | No |
| `<sdpi-delegate>` | plugin-set | No | No |
| `<sdpi-file>` | path `string` | No | No |
| `<sdpi-i18n>` | — (display) | No | No |
