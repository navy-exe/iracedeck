# Push-to-Talk Mode in Audio Controls — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Push-to-Talk (PTT) hold-action mode to the existing Audio Controls action, with a new microphone-in-circle icon using two graphic color slots.

**Architecture:** PTT is added as a new `category` enum value (`"push-to-talk"`) in the existing AudioControls action. When active, key/dial press holds a binding and release releases it (like LookDirection). The PI renames "Category" to "Mode" and hides the Action dropdown when PTT is selected. A new graphic snippet icon uses `{{graphic1Color}}` for the circle and `{{graphic2Color}}` for the microphone.

**Tech Stack:** TypeScript, Zod, Vitest, SVG, EJS templates

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `packages/icons/audio-controls/push-to-talk.svg` | 144x144 graphic snippet: white circle + black microphone |
| Modify | `packages/actions/src/actions/audio-controls.ts` | Add PTT mode with hold/release behavior |
| Modify | `packages/actions/src/actions/audio-controls.test.ts` | Add PTT tests (hold, release, icon, keys) |
| Modify | `packages/stream-deck-plugin/src/pi/audio-controls.ejs` | Rename Category→Mode, add PTT option, visibility logic, graphic2Color slot |
| Modify | `packages/stream-deck-plugin/src/pi/data/key-bindings.json` | Add PTT key binding entry |
| Run | `scripts/generate-icon-previews.mjs`, `generate-icon-defaults.mjs`, `generate-artwork-bounds.mjs` | Regenerate derived files |

---

### Task 1: Create the Push-to-Talk Icon SVG

**Files:**
- Create: `packages/icons/audio-controls/push-to-talk.svg`

- [ ] **Step 1: Create the icon graphic snippet**

The icon is a 144x144 graphic snippet (no background rect — that's added by `assembleIcon()`). White filled circle (`{{graphic1Color}}`) with a black microphone (`{{graphic2Color}}`) inside.

Design coordinates:
- Circle: cx=72, cy=48, r=34 — centered in the artwork area (y=14 to y=82)
- Microphone capsule: rect centered at x=72, top at y=26, 18×28 with rx=9 (pill shape), filled
- Pickup arc: U-shape from x=54 to x=90 at y=46, radius 18
- Stand: vertical line from y=64 to y=72

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 144">
  <desc>{"colors":{"backgroundColor":"#2a3a4a","textColor":"#ffffff","graphic1Color":"#55aa00","graphic2Color":"#ffffff"},"title":{"text":"TALK"},"border":{"color":"#5a6a7a"},"artworkBounds":{"x":38,"y":14,"width":68,"height":68}}</desc>

  <!-- Circle -->
  <circle cx="72" cy="48" r="34" fill="{{graphic1Color}}"/>
  <!-- Microphone capsule -->
  <rect x="63" y="26" width="18" height="28" rx="9" fill="{{graphic2Color}}"/>
  <!-- Pickup arc -->
  <path d="M54 46v4a18 18 0 0 0 36 0v-4" fill="none" stroke="{{graphic2Color}}" stroke-width="4" stroke-linecap="round"/>
  <!-- Stand -->
  <line x1="72" y1="68" x2="72" y2="76" stroke="{{graphic2Color}}" stroke-width="4" stroke-linecap="round"/>

</svg>
```

Write this to `packages/icons/audio-controls/push-to-talk.svg`.

- [ ] **Step 2: Visually verify the icon**

Open the file and confirm the microphone is centered inside the circle, all Mustache placeholders are correct, and the `<desc>` JSON is valid. Adjust coordinates if the mic looks off-center or too small/large relative to the circle.

- [ ] **Step 3: Commit**

```bash
git add packages/icons/audio-controls/push-to-talk.svg
git commit -m "feat(icons): add push-to-talk graphic snippet for audio controls"
```

---

### Task 2: Update the Action Code

**Files:**
- Modify: `packages/actions/src/actions/audio-controls.ts`

The changes are:
1. Add `"push-to-talk"` to the `category` enum as the default
2. Import the new icon SVG
3. Add PTT entries to icon, title, and global key maps
4. Add `onKeyUp`, `onDialUp`, and `onWillDisappear` handlers for hold/release
5. Branch `onKeyDown` and `onDialDown` to use holdBinding for PTT, tapBinding for others
6. Skip dial rotation for PTT mode

- [ ] **Step 1: Add the import and update types**

After the existing icon imports, add:

```typescript
import pushToTalkIconSvg from "@iracedeck/icons/audio-controls/push-to-talk.svg";
```

Change the `AudioCategory` type:

```typescript
type AudioCategory = "push-to-talk" | "voice-chat" | "master";
```

- [ ] **Step 2: Update the data maps**

Add PTT entry to `AUDIO_ICONS`:

```typescript
"push-to-talk": pushToTalkIconSvg,
```

Add PTT entry to `AUDIO_CONTROLS_TITLES`:

```typescript
"push-to-talk": "TALK",
```

Add PTT entry to `AUDIO_CONTROLS_GLOBAL_KEYS`:

```typescript
"push-to-talk": "audioControlsPushToTalk",
```

- [ ] **Step 3: Update the settings schema default**

Change the category default from `"voice-chat"` to `"push-to-talk"`:

```typescript
const AudioControlsSettings = CommonSettings.extend({
  category: z.enum(["push-to-talk", "voice-chat", "master"]).default("push-to-talk"),
  action: z.enum(["volume-up", "volume-down", "mute"]).default("volume-up"),
});
```

- [ ] **Step 4: Update the imports to add key-up and dial-up event types**

Add to the `@iracedeck/deck-core` import:

```typescript
type IDeckDialUpEvent,
type IDeckKeyUpEvent,
type IDeckWillDisappearEvent,
```

- [ ] **Step 5: Update `resolveGlobalKey` for PTT**

PTT doesn't use the `category-action` key pattern. Handle it specially:

```typescript
private resolveGlobalKey(category: AudioCategory, audioAction: AudioAction): string | null {
  if (category === "push-to-talk") {
    return AUDIO_CONTROLS_GLOBAL_KEYS["push-to-talk"] ?? null;
  }

  const key = `${category}-${audioAction}`;

  return AUDIO_CONTROLS_GLOBAL_KEYS[key] ?? null;
}
```

- [ ] **Step 6: Update `generateAudioControlsSvg` for PTT**

The PTT icon key is just `"push-to-talk"` (no action suffix). Update the function:

```typescript
export function generateAudioControlsSvg(settings: AudioControlsSettings): string {
  const { category, action: audioAction } = settings;

  let iconKey: string;
  let defaultTitle: string;

  if (category === "push-to-talk") {
    iconKey = "push-to-talk";
    defaultTitle = AUDIO_CONTROLS_TITLES["push-to-talk"] || "TALK";
  } else {
    // For master category with mute, fall back to volume-up display
    const effectiveAction = category === "master" && audioAction === "mute" ? "volume-up" : audioAction;
    iconKey = `${category}-${effectiveAction}`;
    defaultTitle =
      AUDIO_CONTROLS_TITLES[`${category}-${audioAction}`] || AUDIO_CONTROLS_TITLES[iconKey] || "AUDIO\nCONTROLS";
  }

  const iconSvg = AUDIO_ICONS[iconKey] || AUDIO_ICONS["push-to-talk"];
  const colors = resolveIconColors(iconSvg, getGlobalColors(), settings.colorOverrides);
  const title = resolveTitleSettings(iconSvg, getGlobalTitleSettings(), settings.titleOverrides, defaultTitle);
  const border = resolveBorderSettings(iconSvg, getGlobalBorderSettings(), settings.borderOverrides);
  const graphic = resolveGraphicSettings(getGlobalGraphicSettings(), settings.graphicOverrides);

  return assembleIcon({ graphicSvg: iconSvg, colors, title, border, graphic });
}
```

- [ ] **Step 7: Update `onKeyDown` to branch on PTT**

```typescript
override async onKeyDown(ev: IDeckKeyDownEvent<AudioControlsSettings>): Promise<void> {
  this.logger.info("Key down received");
  const settings = this.parseSettings(ev.payload.settings);

  if (settings.category === "push-to-talk") {
    const settingKey = this.resolveGlobalKey(settings.category, settings.action);

    if (!settingKey) {
      this.logger.warn("No global key mapping for push-to-talk");

      return;
    }

    await this.holdBinding(ev.action.id, settingKey);
  } else {
    await this.executeControl(settings.category, settings.action);
  }
}
```

- [ ] **Step 8: Add `onKeyUp` handler**

```typescript
override async onKeyUp(ev: IDeckKeyUpEvent<AudioControlsSettings>): Promise<void> {
  const settings = this.parseSettings(ev.payload.settings);

  if (settings.category === "push-to-talk") {
    this.logger.info("Key up received");
    await this.releaseBinding(ev.action.id);
  }
}
```

- [ ] **Step 9: Add `onWillDisappear` handler**

Safety: always release held bindings when action disappears.

```typescript
override async onWillDisappear(ev: IDeckWillDisappearEvent<AudioControlsSettings>): Promise<void> {
  await this.releaseBinding(ev.action.id);
  await super.onWillDisappear(ev);
}
```

- [ ] **Step 10: Update `onDialDown` for PTT**

```typescript
override async onDialDown(ev: IDeckDialDownEvent<AudioControlsSettings>): Promise<void> {
  this.logger.info("Dial down received");
  const settings = this.parseSettings(ev.payload.settings);

  if (settings.category === "push-to-talk") {
    const settingKey = this.resolveGlobalKey(settings.category, settings.action);

    if (!settingKey) {
      this.logger.warn("No global key mapping for push-to-talk");

      return;
    }

    await this.holdBinding(ev.action.id, settingKey);
  } else if (MUTE_CATEGORIES.has(settings.category)) {
    await this.executeControl(settings.category, "mute");
  } else {
    await this.executeControl(settings.category, settings.action);
  }
}
```

- [ ] **Step 11: Add `onDialUp` handler**

```typescript
override async onDialUp(ev: IDeckDialUpEvent<AudioControlsSettings>): Promise<void> {
  const settings = this.parseSettings(ev.payload.settings);

  if (settings.category === "push-to-talk") {
    this.logger.info("Dial up received");
    await this.releaseBinding(ev.action.id);
  }
}
```

- [ ] **Step 12: Update `onDialRotate` for PTT**

PTT mode ignores dial rotation (no volume action):

```typescript
override async onDialRotate(ev: IDeckDialRotateEvent<AudioControlsSettings>): Promise<void> {
  const settings = this.parseSettings(ev.payload.settings);

  if (settings.category === "push-to-talk") {
    return;
  }

  this.logger.info("Dial rotated");
  const audioAction: AudioAction = ev.payload.ticks > 0 ? "volume-up" : "volume-down";
  await this.executeControl(settings.category, audioAction);
}
```

- [ ] **Step 13: Run lint and format**

```bash
pnpm lint:fix && pnpm format:fix
```

- [ ] **Step 14: Commit**

```bash
git add packages/actions/src/actions/audio-controls.ts
git commit -m "feat(actions): add push-to-talk hold mode to audio controls"
```

---

### Task 3: Update the Tests

**Files:**
- Modify: `packages/actions/src/actions/audio-controls.test.ts`

- [ ] **Step 1: Add the PTT icon mock**

Add after the existing icon mocks:

```typescript
vi.mock("@iracedeck/icons/audio-controls/push-to-talk.svg", () => ({
  default: '<svg xmlns="http://www.w3.org/2000/svg">push-to-talk</svg>',
}));
```

- [ ] **Step 2: Add the `mockHoldBinding` and `mockReleaseBinding` hoisted mocks**

The existing test file already has `mockTapBinding` via `vi.hoisted`. Add hold and release alongside it. Update the hoisted block:

```typescript
const { mockTapBinding, mockHoldBinding, mockReleaseBinding } = vi.hoisted(() => ({
  mockTapBinding: vi.fn().mockResolvedValue(undefined),
  mockHoldBinding: vi.fn().mockResolvedValue(undefined),
  mockReleaseBinding: vi.fn().mockResolvedValue(undefined),
}));
```

Then update the mock `ConnectionStateAwareAction` to use them:

```typescript
tapBinding = mockTapBinding;
holdBinding = mockHoldBinding;
releaseBinding = mockReleaseBinding;
```

- [ ] **Step 3: Add a `fakeKeyUpEvent` helper**

```typescript
/** Create a minimal fake key up event. */
function fakeKeyUpEvent(actionId: string, settings: Record<string, unknown> = {}) {
  return {
    action: { id: actionId, setTitle: vi.fn(), setImage: vi.fn() },
    payload: { settings },
  };
}
```

Also add a `fakeDialUpEvent` helper (same shape):

```typescript
/** Create a minimal fake dial up event. */
function fakeDialUpEvent(actionId: string, settings: Record<string, unknown> = {}) {
  return {
    action: { id: actionId, setTitle: vi.fn(), setImage: vi.fn() },
    payload: { settings },
  };
}
```

- [ ] **Step 4: Update the AUDIO_CONTROLS_GLOBAL_KEYS tests**

Update the count test from 5 to 6, and add the PTT mapping test:

```typescript
it("should have correct mapping for push-to-talk", () => {
  expect(AUDIO_CONTROLS_GLOBAL_KEYS["push-to-talk"]).toBe("audioControlsPushToTalk");
});

it("should have exactly 6 entries", () => {
  expect(Object.keys(AUDIO_CONTROLS_GLOBAL_KEYS)).toHaveLength(6);
});
```

- [ ] **Step 5: Add `generateAudioControlsSvg` tests for PTT**

```typescript
it("should generate a valid data URI for push-to-talk", () => {
  const result = generateAudioControlsSvg({ category: "push-to-talk", action: "volume-up" });

  expect(result).toContain("data:image/svg+xml");
});

it("should include correct labels for push-to-talk", () => {
  const result = generateAudioControlsSvg({ category: "push-to-talk", action: "volume-up" });
  const decoded = decodeURIComponent(result);

  expect(decoded).toContain("TO TALK");
  expect(decoded).toContain("PUSH");
});

it("should produce a different icon for push-to-talk vs voice-chat", () => {
  const ptt = generateAudioControlsSvg({ category: "push-to-talk", action: "volume-up" });
  const voiceChat = generateAudioControlsSvg({ category: "voice-chat", action: "volume-up" });

  expect(ptt).not.toBe(voiceChat);
});
```

- [ ] **Step 6: Add PTT hold behavior tests**

```typescript
describe("push-to-talk hold behavior", () => {
  let action: AudioControls;

  beforeEach(() => {
    action = new AudioControls();
  });

  it("should call holdBinding on keyDown for push-to-talk", async () => {
    await action.onKeyDown(fakeEvent("action-1", { category: "push-to-talk" }) as any);

    expect(mockHoldBinding).toHaveBeenCalledWith("action-1", "audioControlsPushToTalk");
    expect(mockTapBinding).not.toHaveBeenCalled();
  });

  it("should call releaseBinding on keyUp for push-to-talk", async () => {
    await action.onKeyUp(fakeKeyUpEvent("action-1", { category: "push-to-talk" }) as any);

    expect(mockReleaseBinding).toHaveBeenCalledWith("action-1");
  });

  it("should not call holdBinding on keyDown for non-PTT modes", async () => {
    await action.onKeyDown(fakeEvent("action-1", { category: "voice-chat", action: "volume-up" }) as any);

    expect(mockHoldBinding).not.toHaveBeenCalled();
    expect(mockTapBinding).toHaveBeenCalledWith("audioVoiceChatVolumeUp");
  });

  it("should call holdBinding on dialDown for push-to-talk", async () => {
    await action.onDialDown(fakeEvent("action-1", { category: "push-to-talk" }) as any);

    expect(mockHoldBinding).toHaveBeenCalledWith("action-1", "audioControlsPushToTalk");
  });

  it("should call releaseBinding on dialUp for push-to-talk", async () => {
    await action.onDialUp(fakeDialUpEvent("action-1", { category: "push-to-talk" }) as any);

    expect(mockReleaseBinding).toHaveBeenCalledWith("action-1");
  });

  it("should ignore dial rotation for push-to-talk", async () => {
    await action.onDialRotate(
      fakeDialRotateEvent("action-1", { category: "push-to-talk" }, 1) as any,
    );

    expect(mockTapBinding).not.toHaveBeenCalled();
    expect(mockHoldBinding).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 7: Run the tests**

```bash
npx vitest run packages/actions/src/actions/audio-controls.test.ts
```

Expected: all tests pass.

- [ ] **Step 8: Commit**

```bash
git add packages/actions/src/actions/audio-controls.test.ts
git commit -m "test(actions): add push-to-talk tests for audio controls"
```

---

### Task 4: Update the Property Inspector Template

**Files:**
- Modify: `packages/stream-deck-plugin/src/pi/audio-controls.ejs`

- [ ] **Step 1: Rename Category to Mode and add PTT option**

Replace the category `sdpi-item` and `sdpi-select`:

```html
<sdpi-item label="Mode">
  <sdpi-select id="category-select" setting="category" default="push-to-talk">
    <option value="push-to-talk">Push to Talk</option>
    <option value="voice-chat">Voice Chat</option>
    <option value="master">Master</option>
  </sdpi-select>
</sdpi-item>
```

- [ ] **Step 2: Add `graphic2Color` to color-overrides slots**

Update the color-overrides include:

```ejs
<%- include('color-overrides', { slots: ['backgroundColor', 'textColor', 'graphic1Color', 'graphic2Color'], defaults: require('./data/icon-defaults.json')['audio-controls'] }) %>
```

- [ ] **Step 3: Update the JavaScript visibility logic**

Replace the `updateVisibility` function to handle PTT mode:

```javascript
function updateVisibility(category) {
  const actionItem = document.getElementById("action-item");
  const actionSelect = document.getElementById("action-select");
  const muteOption = document.querySelector('#action-select option[value="mute"]');

  if (category === "push-to-talk") {
    // Hide the entire action dropdown for PTT
    if (actionItem) actionItem.classList.add("hidden");
  } else {
    if (actionItem) actionItem.classList.remove("hidden");

    if (muteOption) {
      if (category === "master") {
        muteOption.style.display = "none";
        // If mute was selected, switch to volume-up
        if (actionSelect && actionSelect.value === "mute") {
          actionSelect.value = "volume-up";
        }
      } else {
        muteOption.style.display = "";
      }
    }
  }
}
```

Update the initial value in `initialize()`:

```javascript
const initialValue = categorySelect.value || "push-to-talk";
```

And update the fallback values in the event listeners and polling:

```javascript
categorySelect.addEventListener("change", (ev) => {
  updateVisibility(ev.target.value || "push-to-talk");
});
categorySelect.addEventListener("input", (ev) => {
  updateVisibility(ev.target.value || "push-to-talk");
});

let lastValue = categorySelect.value || "push-to-talk";
```

- [ ] **Step 4: Run lint and format**

```bash
pnpm lint:fix && pnpm format:fix
```

- [ ] **Step 5: Commit**

```bash
git add packages/stream-deck-plugin/src/pi/audio-controls.ejs
git commit -m "feat(pi): add push-to-talk mode to audio controls property inspector"
```

---

### Task 5: Add the PTT Key Binding

**Files:**
- Modify: `packages/stream-deck-plugin/src/pi/data/key-bindings.json`

- [ ] **Step 1: Add the PTT key binding entry**

Add as the **first** entry in the `audioControls` array (before `voiceChatVolumeUp`):

```json
{
  "id": "pushToTalk",
  "label": "Push to Talk",
  "default": "",
  "setting": "audioControlsPushToTalk"
}
```

Default is empty (`""`) because iRacing has no default PTT keybind — users must configure both iRacing and iRaceDeck.

- [ ] **Step 2: Commit**

```bash
git add packages/stream-deck-plugin/src/pi/data/key-bindings.json
git commit -m "feat(pi): add push-to-talk key binding to audio controls"
```

---

### Task 6: Regenerate Derived Files, Build, and Verify

- [ ] **Step 1: Run the icon generation scripts**

```bash
node scripts/generate-icon-previews.mjs
node scripts/generate-icon-defaults.mjs
node scripts/generate-artwork-bounds.mjs
```

- [ ] **Step 2: Verify icon-defaults.json includes `graphic2Color`**

Check that `packages/stream-deck-plugin/src/pi/data/icon-defaults.json` now has a `graphic2Color` field in the `audio-controls` entry. If the generate script doesn't pick it up automatically, manually add `"graphic2Color": "#000000"` to the `audio-controls` entry.

- [ ] **Step 3: Run all tests**

```bash
pnpm test
```

Expected: all tests pass.

- [ ] **Step 4: Run lint and format**

```bash
pnpm lint:fix && pnpm format:fix
```

- [ ] **Step 5: Build**

```bash
pnpm build
```

Expected: build succeeds with no errors.

- [ ] **Step 6: Commit generated files**

```bash
git add packages/icons/preview/ packages/stream-deck-plugin/src/pi/data/icon-defaults.json
git commit -m "chore: regenerate icon previews and defaults for push-to-talk"
```
