# Design: Add `save()` method to custom PI components

## Context

Custom PI components (`ird-range-input`, `ird-color-picker`) rely on a fragile pattern for programmatic persistence: setting `.value` then dispatching a synthetic `change` event. An external `change` event listener in each component calls `saveToStreamDeck()`. This pattern caused the race condition in #281 where gate scripts unintentionally persisted default values during initialization.

Adding an explicit `save()` method makes the intent clear: the `value` setter is always silent, and persistence requires an explicit call. This eliminates the class of bugs where synthetic events fire at the wrong time.

## Changes

### 1. Add `save()` method to both components

**Files:**
- `packages/stream-deck-plugin/src/pi-components/range-input.ts`
- `packages/stream-deck-plugin/src/pi-components/color-picker.ts`

Add a public method:

```typescript
public save(): void {
  this.saveToStreamDeck?.(this.currentValue);
}
```

### 2. Remove external change event listener from both components

Remove from `attachListeners()` in both files:

```typescript
// REMOVE
this.addEventListener("change", (_e: Event) => {
  if (!this._dispatching) {
    this.saveToStreamDeck?.(this.currentValue);
  }
});
```

Internal `notifyChange()` is unchanged — it still saves and dispatches for external listeners.

### 3. Migrate callers to `save()`

Replace `el.dispatchEvent(new Event('change', { bubbles: true }))` with `el.save()` at these sites:

| File | Context | Target component |
|------|---------|-----------------|
| `head-common.ejs` | Per-action color preset buttons | `ird-color-picker` |
| `head-common.ejs` | Global color preset buttons | `ird-color-picker` |
| `head-common.ejs` | Font size toggle uncheck | `ird-range-input` |
| `border-overrides.ejs` | `clearField()` helper | `ird-color-picker` |
| `border-overrides.ejs` | `applyBorderDefaults()` | `ird-color-picker` |
| `graphic-overrides.ejs` | Graphic scale mode switch | `ird-range-input` |

**Not migrated** (target `sdpi-*` components we don't own):
- `clearSelect()` in `border-overrides.ejs` — targets `sdpi-select`
- Global title reset in `head-common.ejs` — targets `sdpi-*` elements

### 4. Update tests

**Files:**
- `packages/stream-deck-plugin/src/pi-components/range-input.test.ts`
- `packages/stream-deck-plugin/src/pi-components/color-picker.test.ts`

- Add tests: `save()` calls `saveToStreamDeck` with current value; `save()` is no-op when `saveToStreamDeck` is null
- Update existing "external change events" tests to use `save()` instead of synthetic events

### 5. Update documentation

**File:** `.claude/rules/sdpi-components.md`

Document `save()` on both `ird-range-input` and `ird-color-picker`.

## Out of scope

- `sdpi-*` components (third-party, not our code)
- Changing `notifyChange()` internals
- Any behavioral changes to how user interactions (drag, type, clear) persist values
