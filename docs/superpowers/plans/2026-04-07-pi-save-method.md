# PI Component `save()` Method Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a public `save()` method to `ird-range-input` and `ird-color-picker`, migrate all callers from the fragile synthetic `change` event pattern, and remove the external change event listener.

**Architecture:** Both components get an identical `save()` method that delegates to `saveToStreamDeck`. Template gate scripts replace `el.dispatchEvent(new Event('change', ...))` with `el.save()`. The external change listener is removed from both components.

**Tech Stack:** TypeScript (PI web components), EJS templates, Vitest

---

### File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `packages/stream-deck-plugin/src/pi-components/range-input.ts` | Modify | Add `save()`, remove external change listener |
| `packages/stream-deck-plugin/src/pi-components/range-input.test.ts` | Modify | Replace external change tests with `save()` tests |
| `packages/stream-deck-plugin/src/pi-components/color-picker.ts` | Modify | Add `save()`, remove external change listener |
| `packages/stream-deck-plugin/src/pi-components/color-picker.test.ts` | Modify | Replace external change tests with `save()` tests |
| `packages/stream-deck-plugin/src/pi-templates/partials/head-common.ejs` | Modify | Migrate 3 call sites to `save()` |
| `packages/stream-deck-plugin/src/pi-templates/partials/border-overrides.ejs` | Modify | Migrate 2 call sites to `save()` |
| `packages/stream-deck-plugin/src/pi-templates/partials/graphic-overrides.ejs` | Modify | Migrate 1 call site to `save()` |
| `.claude/rules/sdpi-components.md` | Modify | Document `save()` on both components |

---

### Task 1: Add `save()` to `ird-range-input` with tests

**Files:**
- Modify: `packages/stream-deck-plugin/src/pi-components/range-input.ts:236-241`
- Modify: `packages/stream-deck-plugin/src/pi-components/range-input.test.ts:231-244`

- [ ] **Step 1: Write failing tests for `save()` method**

Replace the `"external change events"` describe block in `range-input.test.ts` (lines 231-244) with:

```typescript
  describe("save", () => {
    it("should call saveToStreamDeck with current value", () => {
      const saveFn = vi.fn();
      (range as unknown as Record<string, unknown>).saveToStreamDeck = saveFn;

      (range as HTMLInputElement).value = "15";
      (range as unknown as { save(): void }).save();

      expect(saveFn).toHaveBeenCalledWith("15");
    });

    it("should call saveToStreamDeck with empty string when cleared", () => {
      const saveFn = vi.fn();
      (range as unknown as Record<string, unknown>).saveToStreamDeck = saveFn;

      (range as HTMLInputElement).value = "";
      (range as unknown as { save(): void }).save();

      expect(saveFn).toHaveBeenCalledWith("");
    });

    it("should be a no-op when saveToStreamDeck is null", () => {
      (range as HTMLInputElement).value = "10";
      // saveToStreamDeck is null by default (no SDPIComponents in test)
      expect(() => (range as unknown as { save(): void }).save()).not.toThrow();
    });
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- packages/stream-deck-plugin/src/pi-components/range-input.test.ts`

Expected: FAIL — `save` is not a function.

- [ ] **Step 3: Add `save()` method and remove external change listener**

In `range-input.ts`, add the public method after the `value` setter (after line 70):

```typescript
  public save(): void {
    this.saveToStreamDeck?.(this.currentValue);
  }
```

Remove the external change event listener from `attachListeners()` (lines 236-241):

```typescript
    // Handle external change events (from toggle scripts: el.value = x; el.dispatchEvent(change))
    this.addEventListener("change", (_e: Event) => {
      if (!this._dispatching) {
        this.saveToStreamDeck?.(this.currentValue);
      }
    });
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- packages/stream-deck-plugin/src/pi-components/range-input.test.ts`

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/stream-deck-plugin/src/pi-components/range-input.ts packages/stream-deck-plugin/src/pi-components/range-input.test.ts
git commit -m "feat(pi): add save() method to ird-range-input, remove external change listener"
```

---

### Task 2: Add `save()` to `ird-color-picker` with tests

**Files:**
- Modify: `packages/stream-deck-plugin/src/pi-components/color-picker.ts:257-262`
- Modify: `packages/stream-deck-plugin/src/pi-components/color-picker.test.ts:180-199`

- [ ] **Step 1: Write failing tests for `save()` method**

Replace the `"external change events"` describe block in `color-picker.test.ts` (lines 180-199) with:

```typescript
  describe("save", () => {
    it("should call saveToStreamDeck with current value", () => {
      const saveFn = vi.fn();
      (picker as unknown as Record<string, unknown>).saveToStreamDeck = saveFn;

      (picker as HTMLInputElement).value = "#ff0000";
      (picker as unknown as { save(): void }).save();

      expect(saveFn).toHaveBeenCalledWith("#ff0000");
    });

    it("should call saveToStreamDeck with empty string when cleared", () => {
      const saveFn = vi.fn();
      (picker as unknown as Record<string, unknown>).saveToStreamDeck = saveFn;

      (picker as HTMLInputElement).value = "";
      (picker as unknown as { save(): void }).save();

      expect(saveFn).toHaveBeenCalledWith("");
    });

    it("should be a no-op when saveToStreamDeck is null", () => {
      (picker as HTMLInputElement).value = "#ff0000";
      // saveToStreamDeck is null by default (no SDPIComponents in test)
      expect(() => (picker as unknown as { save(): void }).save()).not.toThrow();
    });
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test -- packages/stream-deck-plugin/src/pi-components/color-picker.test.ts`

Expected: FAIL — `save` is not a function.

- [ ] **Step 3: Add `save()` method and remove external change listener**

In `color-picker.ts`, add the public method after the `value` setter (after line 105):

```typescript
  public save(): void {
    this.saveToStreamDeck?.(this.currentValue);
  }
```

Remove the external change event listener from `attachListeners()` (lines 257-262):

```typescript
    // Handle external change events (from preset buttons: el.value = x; el.dispatchEvent(change))
    this.addEventListener("change", (_e: Event) => {
      if (!this._dispatching) {
        this.saveToStreamDeck?.(this.currentValue);
      }
    });
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- packages/stream-deck-plugin/src/pi-components/color-picker.test.ts`

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add packages/stream-deck-plugin/src/pi-components/color-picker.ts packages/stream-deck-plugin/src/pi-components/color-picker.test.ts
git commit -m "feat(pi): add save() method to ird-color-picker, remove external change listener"
```

---

### Task 3: Migrate template callers to `save()`

**Files:**
- Modify: `packages/stream-deck-plugin/src/pi-templates/partials/head-common.ejs`
- Modify: `packages/stream-deck-plugin/src/pi-templates/partials/border-overrides.ejs`
- Modify: `packages/stream-deck-plugin/src/pi-templates/partials/graphic-overrides.ejs`

- [ ] **Step 1: Migrate per-action color preset buttons in head-common.ejs**

At line 217, replace:

```javascript
        el.dispatchEvent(new Event('change', { bubbles: true }));
```

with:

```javascript
        el.save();
```

- [ ] **Step 2: Migrate global color preset buttons in head-common.ejs**

At line 237, replace:

```javascript
        el.dispatchEvent(new Event('change', { bubbles: true }));
```

with:

```javascript
        el.save();
```

- [ ] **Step 3: Migrate font size toggle uncheck in head-common.ejs**

At line 343, replace:

```javascript
          range.dispatchEvent(new Event('change', { bubbles: true }));
```

with:

```javascript
          range.save();
```

- [ ] **Step 4: Migrate `clearField()` in border-overrides.ejs**

At line 53, replace:

```javascript
        el.dispatchEvent(new Event('change', { bubbles: true }));
```

with:

```javascript
        el.save();
```

- [ ] **Step 5: Migrate `applyBorderDefaults()` in border-overrides.ejs**

At line 106, replace:

```javascript
          picker.dispatchEvent(new Event('change', { bubbles: true }));
```

with:

```javascript
          picker.save();
```

- [ ] **Step 6: Migrate graphic scale mode switch in graphic-overrides.ejs**

At line 49, replace:

```javascript
          rangeEl.dispatchEvent(new Event('change', { bubbles: true }));
```

with:

```javascript
          rangeEl.save();
```

- [ ] **Step 7: Build and run all tests**

Run: `pnpm build && pnpm test`

Expected: Build succeeds, all tests pass.

- [ ] **Step 8: Commit**

```bash
git add packages/stream-deck-plugin/src/pi-templates/partials/head-common.ejs packages/stream-deck-plugin/src/pi-templates/partials/border-overrides.ejs packages/stream-deck-plugin/src/pi-templates/partials/graphic-overrides.ejs
git commit -m "refactor(pi): migrate gate scripts from synthetic change events to save()"
```

---

### Task 4: Update documentation

**Files:**
- Modify: `.claude/rules/sdpi-components.md:135,238`

- [ ] **Step 1: Update `ird-color-picker` features list**

At line 135 in `.claude/rules/sdpi-components.md`, replace:

```markdown
- **Preset button compat**: Works with `.value` setter + `change` event dispatch pattern.
```

with:

```markdown
- **Programmatic persistence**: Call `.save()` after setting `.value` to persist to Stream Deck settings.
```

- [ ] **Step 2: Update `ird-range-input` features list**

At line 238 in `.claude/rules/sdpi-components.md`, replace:

```markdown
- **Toggle script compat**: Works with `.value` setter + `change` event dispatch pattern.
```

with:

```markdown
- **Programmatic persistence**: Call `.save()` after setting `.value` to persist to Stream Deck settings.
```

- [ ] **Step 3: Commit**

```bash
git add .claude/rules/sdpi-components.md
git commit -m "docs: update sdpi-components.md with save() method for custom PI components"
```
