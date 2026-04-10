/**
 * Engine Startup Animation Service
 *
 * Detects engine startup via telemetry (EngineStalled bit clearing + RPM > threshold)
 * and plays a synchronized frame-based animation across all visible deck buttons.
 *
 * Animation sequence (orange snake sweep):
 *   Phase 1 — Orange snake sweeps across buttons in alternating direction
 *             per row (left→right, right→left, left→right) with a fading tail
 *   Phase 2 — Green flash on all buttons (engine started!)
 *
 * The overlay is composited onto each button's current icon by injecting a
 * semi-transparent rect into the original SVG. This preserves the icon artwork
 * underneath the animation effect.
 *
 * Since both platforms (Elgato QT6, Mirabox QT5) only support static SVG,
 * the animation is frame-based: rapidly swapping SVG data URIs via setImage().
 *
 * Usage:
 *   1. Call initEngineStartupAnimation(logger) once at plugin startup
 *   2. BaseAction auto-registers/deregisters contexts via registerContext/unregisterContext
 *   3. The service subscribes to telemetry and manages the animation timer
 */
import { EngineWarnings, hasFlag } from "@iracedeck/iracing-sdk";
import type { ILogger } from "@iracedeck/logger";

import { getGlobalSettings } from "./global-settings.js";
import { dataUriToSvg, isDataUri, svgToDataUri } from "./overlay-utils.js";
import { getController } from "./sdk-singleton.js";
import type { IDeckActionContext } from "./types.js";

// ── Constants ────────────────────────────────────────────────────────────────

/** Frame interval in milliseconds (20ms = 50fps) */
const FRAME_INTERVAL_MS = 20;

/** Minimum RPM to consider engine running */
const RPM_THRESHOLD = 200;

/** Telemetry subscription ID */
const TELEMETRY_SUB_ID = "__engine_startup_animation__";

// ── Animation frame parameters ───────────────────────────────────────────────

/** Number of rows on the device grid */
const NUM_ROWS = 3;

/** Number of columns on the device grid */
const NUM_COLS = 5;

/** Total number of buttons */
const TOTAL_BUTTONS = NUM_ROWS * NUM_COLS;

/** Frames per button during snake sweep */
const SWEEP_HOLD = 2;

/** Number of buttons the snake tail spans behind the head */
const TAIL_LENGTH = 8;

/** Number of frames for the green flash */
const GREEN_STEPS = 8;

/** Steps before snake tail clears where green flash begins (overlap) */
const GREEN_OVERLAP = 4;

/** Peak green overlay opacity */
const GREEN_PEAK_OPACITY = 0.8;

/** Snake overlay color (orange) */
const SNAKE_COLOR = "#f39c12";

/** Green flash color */
const GREEN_COLOR = "#2ecc71";

// ── Types ────────────────────────────────────────────────────────────────────

interface AnimationFrame {
  opacity: number;
  color: string;
}

interface RegisteredContext {
  action: IDeckActionContext;
  /** Row position on the device (0-based) */
  row: number;
  /** Column position on the device (0-based) */
  column: number;
  /** Stored original SVG data URI to restore after animation */
  originalSvg: string;
}

// ── Module state ─────────────────────────────────────────────────────────────

let initialized = false;
let logger: ILogger | null = null;

/** Registered action contexts */
const contexts = new Map<string, RegisteredContext>();

/** Animation timer */
let animationTimer: ReturnType<typeof setInterval> | null = null;

/** Current frame index during animation */
let currentFrame = 0;

/** Pre-computed frames per snake index: snakeIndex -> AnimationFrame[] */
const framesByIndex = new Map<number, AnimationFrame[]>();

/** Total frame count */
let totalFrames = 0;

/** Whether animation is currently playing */
let isAnimating = false;

/** Previous engine stalled state (null = not yet seen) */
let prevStalled: boolean | null = null;

/** Telemetry subscription active */
let telemetrySubscribed = false;

// ── SVG compositing ──────────────────────────────────────────────────────────

/**
 * Inject a semi-transparent overlay rect into an existing SVG.
 * Inserts the rect just before the closing </svg> tag so it renders on top.
 *
 * @param originalDataUri - The original icon as a data URI
 * @param color - Overlay color (e.g., "white", "#2ecc71")
 * @param opacity - Overlay opacity (0–1)
 * @returns New SVG data URI with the overlay composited
 */
function compositeOverlay(originalDataUri: string, color: string, opacity: number): string {
  let rawSvg: string;

  if (isDataUri(originalDataUri)) {
    rawSvg = dataUriToSvg(originalDataUri);
  } else {
    rawSvg = originalDataUri;
  }

  // Insert overlay rect before closing </svg>
  const overlayRect = `<rect width="144" height="144" fill="${color}" fill-opacity="${opacity.toFixed(3)}"/>`;
  const composited = rawSvg.replace(/<\/svg>\s*$/, `${overlayRect}</svg>`);

  return svgToDataUri(composited);
}

// ── Snake order ─────────────────────────────────────────────────────────────

/**
 * Pre-computed snake order: alternating direction per row.
 * Row 0 L→R (0,1,2,3,4), Row 1 R→L (9,8,7,6,5), Row 2 L→R (10,11,12,13,14)
 * Assumes a 3x5 button grid. Buttons outside this range are clamped on registration.
 */
const snakeOrder: number[] = [];

function initSnakeOrder(): void {
  snakeOrder.length = 0;

  for (let r = 0; r < NUM_ROWS; r++) {
    const rowIndices: number[] = [];

    for (let c = 0; c < NUM_COLS; c++) {
      rowIndices.push(r * NUM_COLS + c);
    }

    // Even rows (0, 2): left to right. Odd rows (1): right to left.
    if (r % 2 !== 0) {
      rowIndices.reverse();
    }

    snakeOrder.push(...rowIndices);
  }
}

// ── Frame generation ─────────────────────────────────────────────────────────

/**
 * Build the animation frame sequence for a given snake position.
 *
 * Orange snake sweep with fading tail:
 *   Phase 1 — Snake head moves through all buttons in alternating row order.
 *             A tail of TAIL_LENGTH buttons fades behind the head.
 *   Phase 2 — Green flash on all buttons (engine started!)
 */
function buildFramesForSnakePosition(snakePos: number): AnimationFrame[] {
  const frames: AnimationFrame[] = [];
  const totalSteps = TOTAL_BUTTONS + TAIL_LENGTH;
  const greenStartStep = totalSteps - GREEN_OVERLAP;
  const greenStartFrame = greenStartStep * SWEEP_HOLD;
  const totalAnimFrames = greenStartFrame + GREEN_STEPS;

  for (let f = 0; f < totalAnimFrames; f++) {
    // Check if we're in the green flash zone
    if (f >= greenStartFrame) {
      const h = f - greenStartFrame;
      const peak = Math.floor(GREEN_STEPS * 0.3);
      let opacity: number;

      if (h <= peak) {
        opacity = (h / peak) * GREEN_PEAK_OPACITY;
      } else {
        opacity = GREEN_PEAK_OPACITY * (1 - (h - peak) / (GREEN_STEPS - peak));
      }

      frames.push({ opacity: Math.max(0, opacity), color: GREEN_COLOR });
      continue;
    }

    // Snake sweep frame
    const step = Math.floor(f / SWEEP_HOLD);
    let opacity = 0;

    for (let t = 0; t < TAIL_LENGTH; t++) {
      const tailStep = step - t;

      if (tailStep === snakePos) {
        const fade = t / (TAIL_LENGTH - 1);
        opacity = t === 0 ? 0.85 : 0.7 * (1 - fade * fade);
        opacity = Math.max(0.08, opacity);
        break;
      }
    }

    frames.push({ opacity, color: SNAKE_COLOR });
  }

  return frames;
}

/**
 * Pre-compute frame data for all snake positions.
 */
function precomputeFrames(): void {
  initSnakeOrder();
  framesByIndex.clear();

  for (let i = 0; i < TOTAL_BUTTONS; i++) {
    framesByIndex.set(i, buildFramesForSnakePosition(i));
  }

  // Derive totalFrames from actual array length (single source of truth)
  totalFrames = framesByIndex.get(0)?.length ?? 0;
}

// ── Telemetry detection ──────────────────────────────────────────────────────

function onTelemetryUpdate(
  telemetry: { EngineWarnings?: number; RPM?: number; IsOnTrackCar?: boolean; IsInGarage?: boolean } | null,
  isConnected: boolean,
): void {
  if (!isConnected || !telemetry) {
    prevStalled = null;

    return;
  }

  // Don't detect when not in car or in garage
  if (telemetry.IsOnTrackCar === false || telemetry.IsInGarage === true) {
    prevStalled = null;

    return;
  }

  const warnings = telemetry.EngineWarnings;

  if (warnings === undefined) return;

  const currentlyStalled = hasFlag(warnings, EngineWarnings.EngineStalled);
  const rpm = telemetry.RPM ?? 0;

  // Detect transition: was stalled → now running with RPM > threshold
  if (prevStalled === true && !currentlyStalled && rpm > RPM_THRESHOLD) {
    logger?.info("Engine startup detected");
    logger?.debug(`RPM=${rpm}, EngineWarnings=0x${warnings.toString(16)}`);
    triggerAnimation();
  }

  prevStalled = currentlyStalled;
}

// ── Animation playback ───────────────────────────────────────────────────────

function triggerAnimation(): void {
  // Check if enabled in global settings
  const settings = getGlobalSettings() as Record<string, unknown>;

  if (settings.engineStartupAnimation === false || settings.engineStartupAnimation === "false") {
    logger?.debug("Engine startup animation disabled in settings");

    return;
  }

  if (isAnimating) {
    logger?.debug("Animation already playing, skipping");

    return;
  }

  if (contexts.size === 0) {
    logger?.debug("No contexts registered, skipping animation");

    return;
  }

  logger?.info("Starting engine startup animation");
  logger?.debug(`Animating ${contexts.size} contexts, ${totalFrames} frames at ${FRAME_INTERVAL_MS}ms`);

  isAnimating = true;
  currentFrame = 0;

  animationTimer = setInterval(() => {
    if (currentFrame >= totalFrames) {
      stopAnimation();

      return;
    }

    // Update all registered contexts
    for (const [contextId, ctx] of contexts) {
      // Find this button's position in the snake order
      const buttonIndex = ctx.row * NUM_COLS + ctx.column;
      const snakePos = snakeOrder.indexOf(buttonIndex);

      if (snakePos < 0) continue;

      const indexFrames = framesByIndex.get(snakePos);

      if (!indexFrames) continue;

      const frame = indexFrames[currentFrame];

      if (frame.opacity <= 0.01) {
        // No overlay needed — show original image
        ctx.action.setImage(ctx.originalSvg).catch((err) => {
          logger?.warn(`Failed to restore image for ${contextId}: ${err}`);
        });
      } else {
        // Composite the overlay onto the original icon
        const composited = compositeOverlay(ctx.originalSvg, frame.color, frame.opacity);
        ctx.action.setImage(composited).catch((err) => {
          logger?.warn(`Failed to set animation frame for ${contextId}: ${err}`);
        });
      }
    }

    currentFrame++;
  }, FRAME_INTERVAL_MS);
}

function stopAnimation(): void {
  if (animationTimer) {
    clearInterval(animationTimer);
    animationTimer = null;
  }

  isAnimating = false;
  logger?.info("Engine startup animation complete");

  // Restore all original images
  for (const [contextId, ctx] of contexts) {
    ctx.action.setImage(ctx.originalSvg).catch((err) => {
      logger?.warn(`Failed to restore image for ${contextId}: ${err}`);
    });
  }
}

// ── Telemetry subscription management ────────────────────────────────────────

function ensureTelemetrySubscription(): void {
  if (telemetrySubscribed) return;

  try {
    const controller = getController();
    controller.subscribe(TELEMETRY_SUB_ID, (telemetry, isConnected) => {
      onTelemetryUpdate(telemetry, isConnected);
    });
    telemetrySubscribed = true;
    logger?.debug("Telemetry subscription started");
  } catch (err) {
    logger?.debug(`Skipping telemetry subscription: ${err}`);
  }
}

function cleanupTelemetryIfUnneeded(): void {
  if (contexts.size > 0 || !telemetrySubscribed) return;

  try {
    const controller = getController();
    controller.unsubscribe(TELEMETRY_SUB_ID);
  } catch (err) {
    logger?.trace(`Telemetry unsubscription failed: ${err}`);
  }

  telemetrySubscribed = false;
  prevStalled = null;
  logger?.debug("Telemetry subscription stopped");
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Initialize the engine startup animation service.
 * Call once at plugin startup, after initializeSDK().
 *
 * @param log - Logger instance for this module
 */
export function initEngineStartupAnimation(log: ILogger): void {
  logger = log;

  if (initialized) {
    logger.debug("Already initialized");

    return;
  }

  logger.info("Initializing");

  // Pre-compute animation frame data for all rows
  precomputeFrames();

  initialized = true;
  logger.info("Initialized");
}

/**
 * Register an action context for engine startup animation.
 * Called by BaseAction.onWillAppear.
 *
 * @param contextId - The action context ID
 * @param action - The action context handle (for setImage)
 * @param row - The row position on the device (from event coordinates)
 * @param column - The column position on the device (from event coordinates)
 * @param currentSvg - The current SVG being displayed
 */
export function registerStartupAnimationContext(
  contextId: string,
  action: IDeckActionContext,
  row: number,
  column: number,
  currentSvg: string,
): void {
  if (!initialized) return;

  // Clamp to valid range
  const clampedRow = Math.min(Math.max(0, row), NUM_ROWS - 1);
  const clampedCol = Math.min(Math.max(0, column), NUM_COLS - 1);
  contexts.set(contextId, { action, row: clampedRow, column: clampedCol, originalSvg: currentSvg });
  ensureTelemetrySubscription();
}

/**
 * Unregister an action context from engine startup animation.
 * Called by BaseAction.onWillDisappear.
 *
 * @param contextId - The action context ID
 */
export function unregisterStartupAnimationContext(contextId: string): void {
  contexts.delete(contextId);
  cleanupTelemetryIfUnneeded();
}

/**
 * Update the stored original SVG for a context.
 * Called when an action updates its icon (so the animation restores the latest image).
 *
 * @param contextId - The action context ID
 * @param svg - The new current SVG
 */
export function updateStartupAnimationSvg(contextId: string, svg: string): void {
  const ctx = contexts.get(contextId);

  if (ctx) {
    ctx.originalSvg = svg;
  }
}

/**
 * Check if the engine startup animation is currently playing.
 */
export function isStartupAnimationPlaying(): boolean {
  return isAnimating;
}

/**
 * Check if the engine startup animation service has been initialized.
 */
export function isEngineStartupAnimationInitialized(): boolean {
  return initialized;
}

/**
 * Reset engine startup animation state (for testing purposes only).
 * @internal
 */
export function _resetEngineStartupAnimation(): void {
  if (animationTimer) {
    clearInterval(animationTimer);
    animationTimer = null;
  }

  contexts.clear();
  framesByIndex.clear();
  isAnimating = false;
  currentFrame = 0;
  prevStalled = null;
  telemetrySubscribed = false;
  initialized = false;
  logger = null;
}
