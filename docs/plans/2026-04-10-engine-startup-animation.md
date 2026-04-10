# Feature Plan: Engine Startup Animation

## Overview

When the driver starts their engine in iRacing, all visible Stream Deck/Mirabox buttons
play a brief synchronized animation — a "systems online" sequence that gives immediate
tactile feedback that the car is live. The animation is frame-based (rapid static SVG
swaps via `setImage()`), not SVG-native animation, because SVG `animate` elements are
unsupported on both Elgato (QT6/SVG Tiny 1.2 static profile) and Mirabox (QT5).

---

## User Stories

- As a driver, I want all my deck buttons to pulse when my engine fires so I know the
  car is live without looking away from the screen.
- As a driver, I want to be able to disable the animation globally so it does not
  distract me during a race.
- As a driver, I want to configure how long and how intense the animation is.
- As a team manager observing, I want the animation to trigger only when my engine
  actually starts (not when I enter the car or load into session).

---

## Engine Startup Detection

### The Problem: iRacing Has No "Engine Start" Event

iRacing does not expose a discrete "engine started" telemetry variable. Startup must be
inferred from a combination of variables changing together.

### Detection Strategy: RPM Rising From Zero While EngineStalled Clears

The most reliable signal is the transition of `EngineWarnings` bit `EngineStalled`
(0x0008) from **set → clear** while `RPM` rises above a threshold (e.g., > 200 RPM),
and `IsOnTrackCar` is true.

| Telemetry Variable | Type | Description |
|-------------------|------|-------------|
| `EngineWarnings` | `number` (bitfield) | `EngineWarnings.EngineStalled` (0x0008) is set when engine is off/stalled |
| `RPM` | `number` | Engine revolutions per minute |
| `IsOnTrackCar` | `boolean` | True when player is in the car on-world (not spectating, garage, etc.) |
| `IsInGarage` | `boolean` | True when in the garage — startup animation must not trigger |

### Detection Logic

```
prevStalled = true (EngineStalled bit was set last tick)
currStalled = false (EngineStalled bit is now clear)
currRPM > RPM_THRESHOLD (e.g., 200 RPM)
IsOnTrackCar == true
IsInGarage == false
```

When all four conditions are met on the same tick: fire the animation.

### Edge Cases and Guard Conditions

| Situation | Handling |
|-----------|----------|
| iRacing disconnects mid-session | Animation service clears state on disconnect; no stale detection |
| Engine stalls and restarts multiple times | Each cleared stall → RPM rise fires a new animation (correct behavior) |
| Plugin loads while engine is already running | `prevStalled` initializes to `false`; transition never fires (correct — animation only on start) |
| Reconnection after disconnect | State is reset; first telemetry tick sets `prevStalled`; engine must stall and restart to fire |
| Garage engine rev (some cars allow this) | `IsInGarage` guard prevents false trigger |
| EngineStalled goes false with RPM still 0 | RPM threshold prevents premature trigger; telemetry ticks are ~250ms apart so RPM rise lags |
| Session change (e.g., qualify → race) | Re-entry loads fresh car state; engine may already be running → no trigger (correct) |

### Why Not Use RPM Alone?

RPM transitions through zero many times (downshifting, spin-outs). The RPM-alone
approach would generate false positives. The `EngineStalled` bit clearing is the precise
semantic signal that the engine has transitioned from off to on.

### Why Not Use `IsOnTrack` Alone?

`IsOnTrack` becomes true when the car enters the track, which may happen before the
engine starts (e.g., being pushed out of the garage). `EngineStalled` correctly
identifies the engine ignition moment.

---

## Architecture

### Approach: Module-Level Service in `deck-core` (Preferred)

This is a **module-level singleton service** in `packages/deck-core/src/`, following the
exact pattern of `app-monitor.ts` and `global-settings.ts`.

The service:
1. Subscribes to the `SDKController` once for telemetry updates
2. Detects the engine startup transition
3. Broadcasts to all registered `BaseAction` instances via a subscriber list
4. Drives a frame-based animation timer
5. Each action's subscriber callback pushes static SVG frames via the stored
   `IDeckActionContext.setImage()` handles

### Why Not Put This in `BaseAction` Directly?

The flag flash overlay lives in `BaseAction` because it is **per-action-instance** (each
action opts in separately and has independent flash state). Engine startup is
**cross-action** — one event fan-outs to all visible buttons simultaneously. A module-level
service avoids N × N subscriptions (each of N action classes subscribing to the controller
and each running independent timers).

### Why Not an Event Bus / Custom Event Emitter?

The existing pattern (module-level singleton with a `Set` of listeners) is already used
throughout this codebase (`onGlobalSettingsChange`, `onSimHubReachabilityChange`). Adding
a new custom event emitter adds no structural benefit and increases surface area.

### Data Flow

```
SDKController (250ms tick)
  → EngineStartupService.onTelemetry()
    → detects stalled=cleared, RPM rising
      → starts animationTimer (e.g., setInterval at 80ms)
        → animationTimer tick N
          → for each registered context: action.setImage(frameN)
        → after duration (e.g., 1.5s): animationTimer stops
          → for each registered context: action.setImage(storedOriginalSvg)
```

---

## Architecture Option Comparison

Three approaches were considered. The module-level service was selected.

### Option A: Module-Level Service (Recommended)

**Pros:**
- Single telemetry subscription regardless of how many actions are visible
- Single animation timer for all contexts
- Zero impact on actions that do not participate
- Consistent with existing `app-monitor.ts` / `global-settings.ts` patterns
- Clean init/teardown; reset function for testing

**Cons:**
- Requires actions to register/unregister themselves with the service

### Option B: Extend `BaseAction` With Built-In Animation

Embed the detection and animation timer directly into `BaseAction`, alongside the flag
flash code.

**Pros:** No service registration code in individual actions.

**Cons:**
- Every action instance runs its own telemetry subscription — N subscriptions for N buttons
- Detection logic runs N times per tick
- Harder to reason about timing synchronization across buttons
- `BaseAction` grows in complexity for something opt-in and optional

**Verdict:** Rejected. The detection and synchronization concerns belong in a service,
not duplicated per-instance.

### Option C: Telemetry Hook in `SDKController`

Add an `onEngineStart(callback)` method directly to `SDKController`.

**Pros:** Engine detection sits closest to the data source.

**Cons:**
- Violates the single-responsibility of `SDKController` (telemetry dispatch, not semantic
  event detection)
- Increases coupling between iracing-sdk and deck-core concerns
- Harder to configure (thresholds, guard conditions) without polluting the controller API

**Verdict:** Rejected. Semantic detection is an application-layer concern.

---

## Service Design: `engine-startup-service.ts`

Location: `packages/deck-core/src/engine-startup-service.ts`

### Public API

```typescript
// Initialize once at plugin startup, before adapter.connect()
initEngineStartupService(logger: ILogger): void

// Check if initialized
isEngineStartupServiceInitialized(): boolean

// Called by BaseAction.onWillAppear / onWillDisappear
registerAnimationContext(contextId: string, action: IDeckActionContext, getStoredSvg: () => string | undefined): void
unregisterAnimationContext(contextId: string): void

// For testing
_resetEngineStartupService(): void
```

### Internal State

```typescript
// Detection state
let prevEngineStalled: boolean | null = null; // null = not yet seen first tick
let lastRpm: number = 0;

// Animation state
let animationTimer: NodeJS.Timeout | null = null;
let animationTick: number = 0;

// Registered contexts: Map<contextId, { action, getStoredSvg }>
const contexts: Map<string, ...> = new Map();

// Settings (read from global settings)
let animationEnabled: boolean = true;
let animationDurationMs: number = 1500;
let animationFrameMs: number = 80;
```

### Animation Frames

The animation is a sequence of static SVG snapshots. Since no SVG animation is supported,
each frame is generated at service initialization time and reused.

Recommended animation: **white pulse sweep** — a 144x144 solid-color SVG at increasing
opacity levels then fading back. This is:
- Visually striking without being garish
- Cross-platform safe (plain SVG rect with fill-opacity)
- Independent of the action's icon content (overlaid, then restored)
- Brief enough to not obscure important information

Example 12-frame sequence at 80ms per frame (960ms):

| Frame | Overlay Opacity | Effect |
|-------|----------------|--------|
| 0 | 0.15 | Subtle brightening starts |
| 1 | 0.30 | Brightening |
| 2 | 0.50 | Peak brightness |
| 3 | 0.65 | Hold bright |
| 4 | 0.50 | Fade starts |
| 5 | 0.35 | Fading |
| 6 | 0.20 | Nearly clear |
| 7 | 0.10 | Almost done |
| 8 | 0.0 | Restore original |

The overlay SVG for each frame:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 144 144">
  <rect width="144" height="144" fill="#ffffff" fill-opacity="0.50"/>
</svg>
```

This is generated as a data URI at service init time, not per-action, not per-tick.

### Why White Overlay, Not Color Flash?

- White is the only hue-neutral "brightness" effect that works on every icon color
- Colored overlays (green, etc.) clash with whatever the button normally shows
- The existing flag overlay uses solid color replacement — this uses semi-transparent
  overlay which is more sophisticated and less disruptive

### What Happens to the Original Icon During Animation?

The service calls `action.setImage(frameN)` directly, bypassing `BaseAction.setKeyImage()`
(which stores SVG state). After the animation completes, the service reads the stored
original SVG from `BaseAction` via the `getStoredSvg` callback and restores it.

`BaseAction` already stores the current SVG per context in `this.contexts`. The service
receives a callback `getStoredSvg: () => string | undefined` that reads from that store.
This avoids the service needing a reference to `BaseAction` internals.

### Interaction With Inactive Overlay (disableWhenDisconnected)

The animation should not run when the action is in inactive state (iRacing not connected).
The `getStoredSvg` callback can return `undefined` when no image has been set yet. The
service skips contexts where `getStoredSvg()` returns `undefined`.

Additionally, the service guard condition `IsOnTrackCar == true` means the engine startup
event only fires when connected and in-car, so the inactive overlay scenario cannot
occur during a valid animation.

### Interaction With Flag Overlay

The flag flash timer lives in `BaseAction` per-instance. During an engine startup animation,
the flag flash may also be active. Priority: the flag flash should win — flag colors are
safety-critical information. The service should check whether a flag overlay is active for
a context before applying the animation frame.

`BaseAction` exposes `flagOverlayActive: Set<string>` as `protected`. The service receives
a `isUnderFlagOverlay: () => boolean` callback alongside `getStoredSvg`.

---

## Integration in `BaseAction`

`BaseAction` is the right place to opt into the animation service because:
- It already manages per-context `IDeckActionContext` handles
- It already has the context lifecycle (onWillAppear / onWillDisappear)
- ALL actions extend `BaseAction`, so all actions automatically participate

Changes to `BaseAction`:
1. In `onWillAppear`: call `registerAnimationContext(ev.action.id, ev.action, ...)`
2. In `onWillDisappear`: call `unregisterAnimationContext(ev.action.id)`

No changes to individual action classes are needed. The opt-out is via global settings.

The service must be initialized before `BaseAction` instances are created, which means
before actions are registered in `plugin.ts`.

---

## Global Settings

Two new boolean global settings:

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `engineStartupAnimationEnabled` | boolean | `true` | Enable/disable the animation globally |
| `engineStartupAnimationDuration` | number | `1500` | Animation duration in milliseconds (500–3000) |

These are stored in the `GlobalSettingsSchema` via `.passthrough()` — no schema change
is needed. The service reads them from `getGlobalSettings()` at animation trigger time
(not at init time, so changes take effect immediately).

The global settings UI is in the plugin's global settings Property Inspector section.

---

## Plugin Initialization Order

In `plugin.ts` (both `stream-deck-plugin` and `mirabox-plugin`), add:

```typescript
// After initializeSDK(), before registerAction() calls
initEngineStartupService(adapter.createLogger("EngineStartup"));
```

The service subscribes to `getController()` internally, so it requires `initializeSDK()`
to have been called first. This follows the same contract as `initAppMonitor()`.

---

## Performance Analysis

### Button Count: Up to 32 (Stream Deck XL)

Each animation tick calls `action.setImage()` once per visible context. `setImage()` is
an IPC call to the Stream Deck software.

- At 80ms intervals with 32 buttons: 12.5 IPC calls/second per button during animation
- Animation runs for ~1 second (12 frames × 80ms)
- Total IPC calls: 12 × 32 = 384 over 1 second
- After animation: zero overhead (timer is cleared)

This is acceptable. The flag flash already does similar work at 500ms intervals during
flag conditions (which can last an entire race). Engine startup is a 1-second burst.

### Telemetry Subscription

The service uses a single `SDKController.subscribe()` call. The telemetry callback runs
at 250ms intervals and performs: two bitfield checks, one float comparison, one state
variable read. This is negligible overhead.

### Memory

Pre-generated SVG frames: 9 strings × ~100 bytes each = ~1 KB. Allocated once at service
init, never reallocated.

---

## What the Animation Does Not Do

- Does NOT modify stored SVG state in `BaseAction` (the original is preserved and restored)
- Does NOT interact with the flag overlay mechanism — flag overlay takes priority
- Does NOT fire when the plugin first connects to an already-running engine
- Does NOT fire in replay mode (no `IsOnTrackCar` guarantee in replay)
- Does NOT require any per-action code changes
- Does NOT use SVG `animate`, CSS `@keyframes`, or any platform-native animation
- Does NOT affect encoder displays (encoders are excluded via `ev.action.isKey()`)

---

## Implementation Checklist

For the implementing developer:

### New Files

- `packages/deck-core/src/engine-startup-service.ts` — service implementation
- `packages/deck-core/src/engine-startup-service.test.ts` — unit tests

### Modified Files

- `packages/deck-core/src/base-action.ts` — register/unregister contexts in lifecycle hooks
- `packages/deck-core/src/index.ts` — export `initEngineStartupService`, `isEngineStartupServiceInitialized`, `_resetEngineStartupService`
- `packages/stream-deck-plugin/src/plugin.ts` — call `initEngineStartupService()`
- `packages/mirabox-plugin/src/plugin.ts` — call `initEngineStartupService()`
- `packages/stream-deck-plugin/src/pi/settings.ejs` (or global settings partial) — add enable/disable toggle and duration slider
- `packages/stream-deck-plugin/src/pi/data/key-bindings.json` — no change needed (no key bindings)
- `docs/plugins/core/actions/` — no new action doc needed (this is a global service, not an action)

### Test Coverage Requirements

- Detection fires exactly once on stalled → clear transition
- Detection does not fire when plugin loads with engine already running
- Detection does not fire when `IsInGarage == true`
- Detection does not fire when `IsOnTrackCar == false`
- Detection does not fire when `RPM < threshold` (guards against false positive)
- Animation timer stops after configured duration
- Original SVG is restored after animation completes
- Service reset works correctly (for test isolation)
- Contexts registered after animation starts are not included mid-animation
- Contexts unregistered during animation are skipped without error

---

## Out of Scope

- Per-action opt-out (all visible actions participate or none do — global toggle only)
- Custom animation style selection (single style: white pulse)
- Sound/audio on engine start (not a Stream Deck capability)
- Animating encoder displays (only key buttons)
- Animation triggered by events other than engine startup (future: could extend to
  green flag, fastest lap, etc. — tracked separately)
- Any form of SVG-native animation (`animate`, `animateTransform`, CSS `@keyframes`)
- SimHub-triggered animation (not an iRacing telemetry feature)

---

## Open Questions for Implementation Review

1. **RPM threshold**: 200 RPM was chosen as a conservative lower bound. Some cars idle at
   400–800 RPM; others (electric/hybrid) may behave differently. The threshold should be
   a constant in the service, not a user-configurable setting, to avoid support burden.
   Validate against multiple car classes during testing.

2. **Animation frame count vs. duration**: The 80ms/12-frame / ~960ms values are starting
   points. User testing should validate that the animation is noticeable but not distracting
   during the pre-race ritual. The duration global setting allows users to tune this.

3. **`BaseAction` coupling**: The service receives `getStoredSvg` and `isUnderFlagOverlay`
   callbacks rather than a direct `BaseAction` reference. This is intentional to avoid
   cross-package coupling. The callbacks should be arrow functions closed over the `BaseAction`
   instance's private `contexts` and `flagOverlayActive` maps.

4. **Mirabox rendering latency**: The Mirabox VSD Craft updates button images over
   WebSocket. Rapid `setImage()` calls may queue up and create visible stuttering on slower
   connections. If this is observed during testing, increase the frame interval to 120ms
   and reduce the frame count. The timing constants should be defined at the top of the
   service file for easy tuning.
