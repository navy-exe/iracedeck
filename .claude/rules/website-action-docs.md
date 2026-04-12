---
paths:
  - packages/website/src/content/docs/docs/actions/**
---
# Website Action Documentation

## Canonical Example

See `packages/website/src/content/docs/docs/actions/pit-service/tire-service.md` as the reference template.

## Page Structure

```markdown
---
title: Action Name
description: One-line description.
sidebar:
  badge:
    text: "N modes"
    variant: tip
---

Introduction paragraph.

## Modes

Select the mode from the **Action** dropdown in the Property Inspector.

### Mode Name

Description of what this mode does.

**Encoder:** Describe rotation behavior, or "No rotation support."

**Keyboard:** Default keyboard binding: `Key`. | No default key binding. | No keyboard support.

**SDK support:** Yes. | No.

**Settings:** No additional settings.

---

### Mode With Settings

Description of what this mode does.

**Encoder:** Describe rotation behavior, or "No rotation support."

**Keyboard:** Default keyboard binding: `Key`. | No default key binding. | No keyboard support.

**SDK support:** Yes. | No.

##### Setting: Setting Name

Description including default value. Options as bullet list if applicable.

##### Setting: Another Setting

Description including default value.
```

## Rules

### Mode sections

- Each mode gets its own `###` subheader under `## Modes`
- Modes are separated by horizontal rules (`---`), no trailing rule after the last mode
- Each mode is self-contained — all its settings, encoder behavior, and explanation are within the mode section
- Repetition across modes is acceptable; clarity over brevity

### Per-mode lines

Each mode section must include the following bold-label lines, in this order, separated by blank lines:

1. `**Encoder:**` — rotation behavior, or `No rotation support.`
2. `**Keyboard:**` — one of:
   - `Default keyboard binding: \`Key\`.` (action ships with a default — e.g., `F1`, `Ctrl+Shift+R`)
   - `No default key binding.` (action uses a configurable keyboard shortcut but ships without a default; user must set both the iRacing binding and the action binding)
   - `No keyboard support.` (mode does not use the keyboard at all — typically SDK-only)
3. `**SDK support:**` — `Yes.` or `No.` Reflects whether this specific mode uses an iRacing SDK command (`getCommands().*`) versus a keyboard fallback.
4. `**Settings:**` — `No additional settings.` when there are none. When the mode has settings, omit this line and use `##### Setting: <name>` subheaders instead.

`**Keyboard:**` and `**SDK support:**` are mode-specific: within a single action, different modes may use SDK for some behaviors and keyboard for others. Document each mode as it actually behaves in code — `packages/actions/src/actions/<action>.ts` (look for `getCommands()` vs `tapBinding`/`holdBinding`) is the source of truth for SDK usage; `packages/stream-deck-plugin/src/pi/<action>.ejs` (the `default` attribute on `ird-key-binding`) and `packages/stream-deck-plugin/src/pi/data/key-bindings.json` are the source of truth for default keys.

### Setting subheaders

- Use `#####` (h5) with prefix: `##### Setting: Setting Name`
- Include the default value in the description text (not in a table)
- List options as bullet points with bold option names: `- **Option** — description`
- Use `:::tip` blocks for recommendations

### What NOT to include

- No settings summary tables (Type/Default columns add no value)
- No separate "Encoder Support" top-level section (documented per mode)
- No "Properties" table (Action ID, SDK support, etc. — that belongs in internal docs)
