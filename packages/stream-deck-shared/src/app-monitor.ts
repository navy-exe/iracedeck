/**
 * App Monitor
 *
 * Monitors iRacing application state via Stream Deck's app monitoring feature.
 * Controls SDKController reconnection based on whether iRacing is running.
 *
 * Usage:
 * 1. Add ApplicationsToMonitor to manifest.json:
 *    "ApplicationsToMonitor": { "windows": ["iRacingSim64DX11.exe"] }
 * 2. Call initAppMonitor(streamDeck) at plugin startup, before streamDeck.connect()
 *
 * @example
 * // In plugin.ts
 * import streamDeck from "@elgato/streamdeck";
 * import { initAppMonitor } from "@iracedeck/stream-deck-shared";
 * initAppMonitor(streamDeck);
 * streamDeck.connect();
 */
import type StreamDeck from "@elgato/streamdeck";

import { getController } from "./sdk-singleton.js";

/** The iRacing executable name on Windows */
const IRACING_EXE = "iRacingSim64DX11.exe";

/** Whether initAppMonitor has been called */
let initialized = false;

/** Tracks whether iRacing is currently running */
let iRacingRunning = false;

/**
 * Initialize the app monitor.
 * Sets up listeners for iRacing launch/terminate events.
 * Should be called once at plugin startup, before streamDeck.connect().
 *
 * PREREQUISITES:
 * - initializeSDK() must be called before initAppMonitor()
 * - The SDK controller must be available via getController()
 *
 * @param sd - The Stream Deck SDK instance from the plugin
 * @throws Error if SDK hasn't been initialized
 */
export function initAppMonitor(sd: typeof StreamDeck): void {
  if (initialized) {
    sd.logger.warn("[AppMonitor] Already initialized");

    return;
  }

  sd.logger.info("[AppMonitor] Initializing iRacing app monitor");

  // Validate SDK is initialized before proceeding
  let controller;

  try {
    controller = getController();
  } catch {
    sd.logger.error("[AppMonitor] Cannot initialize: SDK not initialized");
    throw new Error("initAppMonitor requires SDK to be initialized first (call initializeSDK())");
  }

  // Listen for iRacing launch
  sd.system.onApplicationDidLaunch((ev) => {
    if (ev.application.toLowerCase() === IRACING_EXE.toLowerCase()) {
      sd.logger.info("[AppMonitor] iRacing was launched");
      iRacingRunning = true;
      getController().setReconnectEnabled(true);
    }
  });

  // Listen for iRacing termination
  sd.system.onApplicationDidTerminate((ev) => {
    if (ev.application.toLowerCase() === IRACING_EXE.toLowerCase()) {
      sd.logger.info("[AppMonitor] iRacing was terminated");
      iRacingRunning = false;
      getController().setReconnectEnabled(false);
    }
  });

  initialized = true;

  // Check if SDK is already connected (iRacing was running before plugin loaded)
  // If so, assume iRacing is running and keep reconnect enabled
  if (controller.getConnectionStatus()) {
    iRacingRunning = true;
    sd.logger.info("[AppMonitor] App monitor initialized (already connected, assuming iRacing is running)");
  } else {
    // Not connected - disable reconnection until iRacing launches
    // Stream Deck will fire applicationDidLaunch immediately if iRacing is already running
    controller.setReconnectEnabled(false);
    sd.logger.info("[AppMonitor] App monitor initialized (reconnect disabled until iRacing launches)");
  }
}

/**
 * Check if iRacing is currently running (as known to the app monitor).
 *
 * @returns true if iRacing is running, false otherwise
 */
export function isIRacingRunning(): boolean {
  return iRacingRunning;
}

/**
 * Check if the app monitor has been initialized.
 *
 * @returns true if initialized, false otherwise
 */
export function isAppMonitorInitialized(): boolean {
  return initialized;
}

/**
 * Reset app monitor state (for testing purposes only).
 * @internal
 */
export function _resetAppMonitor(): void {
  initialized = false;
  iRacingRunning = false;
}
