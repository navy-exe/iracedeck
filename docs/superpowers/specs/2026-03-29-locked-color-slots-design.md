# Locked Color Slots Design

**Issue:** #225
**Date:** 2026-03-29

## Problem

Global color presets (White, Black, custom) override all declared color slots on every icon. This breaks icons where `graphic1Color` or `graphic2Color` carry semantic meaning — e.g., a white speaker outline next to a hardcoded green arrow becomes black on the White preset, creating visual clashes.

## Design

### `<desc>` Schema Change

Add an optional `"locked"` array listing slot names that should skip global overrides:

```json
{
  "colors": {"backgroundColor": "#3a4a5a", "textColor": "#ffffff", "graphic1Color": "#ffffff"},
  "locked": ["graphic1Color"]
}
```

- Omitting `"locked"` or `[]` means all slots are globally overridable (fully backward compatible)
- Any of the four slots can be locked: `backgroundColor`, `textColor`, `graphic1Color`, `graphic2Color`

### Resolution Chain

Current: `per-action override > global color > icon default`

New: `per-action override > global color (if NOT locked) > icon default`

Per-action overrides still apply on locked slots — explicit user intent is honored.

### Code Changes

**`packages/deck-core/src/icon-template.ts`:**

1. Add `parseIconLocked(svgTemplate: string): Set<string>` — extracts the `"locked"` array from `<desc>` JSON, returns a `Set`.

2. Update `resolveIconColors()` — skip global color for locked slots:

```typescript
const locked = new Set(parseIconLocked(svgTemplate));

for (const key of Object.keys(defaults) as (keyof ColorSlots)[]) {
  const defaultValue = defaults[key];
  if (defaultValue === undefined) continue;

  const pick = (v: string | undefined) => (v && v.length > 0 && v !== "#000001" ? v : undefined);
  const globalValue = locked.has(key) ? undefined : pick(globalColors[key]);
  result[key] = pick(actionOverrides?.[key]) ?? globalValue ?? defaultValue;
}
```

### Icon Audit

Scan all SVGs under `packages/icons/` for hardcoded non-white foreground colors (green, red, yellow, blue, etc.) that coexist with `graphic1Color` or `graphic2Color` slots. Add `"locked"` for those graphic slots.

### Tests

Add to existing `icon-template.test.ts`:
- Locked slot skips global override, uses icon default
- Locked slot still accepts per-action override
- No `"locked"` field = backward compatible
- Multiple locked slots

### Documentation

Update `.claude/rules/icons.md` to document the `"locked"` field and when to use it.

### Out of Scope

- PI visual indicator showing which slots are locked
- Propagating locked info to `color-defaults.json`
