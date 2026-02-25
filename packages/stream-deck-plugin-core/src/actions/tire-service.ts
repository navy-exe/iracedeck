import streamDeck, {
  action,
  DialDownEvent,
  DidReceiveSettingsEvent,
  KeyDownEvent,
  WillAppearEvent,
  WillDisappearEvent,
} from "@elgato/streamdeck";
import { hasFlag, PitSvFlags, TelemetryData } from "@iracedeck/iracing-sdk";
import {
  ConnectionStateAwareAction,
  createSDLogger,
  generateIconText,
  getCommands,
  LogLevel,
  renderIconTemplate,
  svgToDataUri,
} from "@iracedeck/stream-deck-shared";
import z from "zod";

import tireServiceTemplate from "../../icons/tire-service.svg";

const TireServiceSettings = z.object({
  lf: z.coerce.boolean().default(true),
  rf: z.coerce.boolean().default(true),
  lr: z.coerce.boolean().default(true),
  rr: z.coerce.boolean().default(true),
});

type TireServiceSettings = z.infer<typeof TireServiceSettings>;

/**
 * Get tire fill color based on settings and current state.
 * Black: not configured (nothing happens on press).
 * Red: configured and currently OFF (will turn ON on press).
 * Green: configured and currently ON (will turn OFF on press).
 */
function getTireColor(isConfigured: boolean, isCurrentlyOn: boolean): string {
  if (!isConfigured) return "#000000ff";

  if (isCurrentlyOn) return "#44FF44";

  return "#FF4444";
}

/**
 * Get current tire change state from telemetry flags.
 */
function getTireState(telemetry: TelemetryData | null): {
  lf: boolean;
  rf: boolean;
  lr: boolean;
  rr: boolean;
} {
  if (!telemetry || telemetry.PitSvFlags === undefined) {
    return { lf: false, rf: false, lr: false, rr: false };
  }

  const flags = telemetry.PitSvFlags;

  return {
    lf: hasFlag(flags, PitSvFlags.LFTireChange),
    rf: hasFlag(flags, PitSvFlags.RFTireChange),
    lr: hasFlag(flags, PitSvFlags.LRTireChange),
    rr: hasFlag(flags, PitSvFlags.RRTireChange),
  };
}

/**
 * @internal Exported for testing
 *
 * Builds a pit macro string to toggle the configured tires.
 * Returns null if no tires are configured.
 */
export function buildTireToggleMacro(settings: TireServiceSettings): string | null {
  const parts: string[] = [];

  if (settings.lf) parts.push("!lf");
  if (settings.rf) parts.push("!rf");
  if (settings.lr) parts.push("!lr");
  if (settings.rr) parts.push("!rr");

  return parts.length > 0 ? `#${parts.join(" ")}` : null;
}

/**
 * @internal Exported for testing
 *
 * Generates an SVG data URI icon for the tire service based on settings and current tire state.
 */
export function generateTireServiceSvg(
  settings: TireServiceSettings,
  currentState: { lf: boolean; rf: boolean; lr: boolean; rr: boolean },
): string {
  const lfColor = getTireColor(settings.lf ?? false, currentState.lf);
  const rfColor = getTireColor(settings.rf ?? false, currentState.rf);
  const lrColor = getTireColor(settings.lr ?? false, currentState.lr);
  const rrColor = getTireColor(settings.rr ?? false, currentState.rr);

  const anyTireOn =
    (settings.lf && currentState.lf) ||
    (settings.rf && currentState.rf) ||
    (settings.lr && currentState.lr) ||
    (settings.rr && currentState.rr);

  const titleText = anyTireOn ? "Change" : "No Change";
  const titleColor = anyTireOn ? "#FFFFFF" : "#FF4444";

  const textElement = generateIconText({ text: titleText, fontSize: 12, fill: titleColor });
  const svg = renderIconTemplate(tireServiceTemplate, {
    lfColor,
    rfColor,
    lrColor,
    rrColor,
    textElement,
  });

  return svgToDataUri(svg);
}

/**
 * Tire Service
 * Toggles tire change selections in pit service based on configured checkboxes.
 * Dynamic icon shows car from above with tire colors based on current iRacing state.
 * Green = will be changed, Red = configured but not active, Black = not configured.
 * On press: toggles the configured tires (if currently on, turns off; if off, turns on).
 */
@action({ UUID: "com.iracedeck.sd.core.tire-service" })
export class TireService extends ConnectionStateAwareAction<TireServiceSettings> {
  protected override logger = createSDLogger(streamDeck.logger.createScope("TireService"), LogLevel.Info);

  private activeContexts = new Map<string, TireServiceSettings>();
  private lastState = new Map<string, string>();

  override async onWillAppear(ev: WillAppearEvent<TireServiceSettings>): Promise<void> {
    const settings = this.parseSettings(ev.payload.settings);
    this.activeContexts.set(ev.action.id, settings);

    await this.updateDisplayWithEvent(ev, settings);

    this.sdkController.subscribe(ev.action.id, (telemetry) => {
      this.updateConnectionState();

      const storedSettings = this.activeContexts.get(ev.action.id);

      if (storedSettings) {
        this.updateDisplayFromTelemetry(ev.action.id, telemetry, storedSettings);
      }
    });
  }

  override async onWillDisappear(ev: WillDisappearEvent<TireServiceSettings>): Promise<void> {
    await super.onWillDisappear(ev);
    this.sdkController.unsubscribe(ev.action.id);
    this.activeContexts.delete(ev.action.id);
    this.lastState.delete(ev.action.id);
  }

  override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<TireServiceSettings>): Promise<void> {
    const settings = this.parseSettings(ev.payload.settings);
    this.activeContexts.set(ev.action.id, settings);

    const telemetry = this.sdkController.getCurrentTelemetry();
    const tireState = getTireState(telemetry);

    this.updateConnectionState();

    const svgDataUri = generateTireServiceSvg(settings, tireState);
    await ev.action.setTitle("");
    await this.setKeyImage(ev, svgDataUri);

    const stateKey = this.buildStateKey(settings, tireState);
    this.lastState.set(ev.action.id, stateKey);
  }

  override async onKeyDown(ev: KeyDownEvent<TireServiceSettings>): Promise<void> {
    this.logger.info("Key down received");
    this.executeTireToggle(ev.payload.settings);
  }

  override async onDialDown(ev: DialDownEvent<TireServiceSettings>): Promise<void> {
    this.logger.info("Dial down received");
    this.executeTireToggle(ev.payload.settings);
  }

  private parseSettings(settings: unknown): TireServiceSettings {
    const parsed = TireServiceSettings.safeParse(settings);

    return parsed.success ? parsed.data : TireServiceSettings.parse({});
  }

  private async updateDisplayWithEvent(
    ev: WillAppearEvent<TireServiceSettings>,
    settings: TireServiceSettings,
  ): Promise<void> {
    const telemetry = this.sdkController.getCurrentTelemetry();
    const tireState = getTireState(telemetry);

    this.updateConnectionState();

    const svgDataUri = generateTireServiceSvg(settings, tireState);
    await ev.action.setTitle("");
    await this.setKeyImage(ev, svgDataUri);

    const stateKey = this.buildStateKey(settings, tireState);
    this.lastState.set(ev.action.id, stateKey);
  }

  private async updateDisplayFromTelemetry(
    contextId: string,
    telemetry: TelemetryData | null,
    settings: TireServiceSettings,
  ): Promise<void> {
    const tireState = getTireState(telemetry);
    const stateKey = this.buildStateKey(settings, tireState);
    const lastStateKey = this.lastState.get(contextId);

    if (lastStateKey !== stateKey) {
      this.lastState.set(contextId, stateKey);
      const svgDataUri = generateTireServiceSvg(settings, tireState);
      await this.updateKeyImage(contextId, svgDataUri);
    }
  }

  private buildStateKey(
    settings: TireServiceSettings,
    tireState: { lf: boolean; rf: boolean; lr: boolean; rr: boolean },
  ): string {
    return `${settings.lf}|${settings.rf}|${settings.lr}|${settings.rr}|${tireState.lf}|${tireState.rf}|${tireState.lr}|${tireState.rr}`;
  }

  private executeTireToggle(rawSettings: unknown): void {
    if (!this.sdkController.getConnectionStatus()) {
      this.logger.info("Not connected to iRacing");

      return;
    }

    const settings = this.parseSettings(rawSettings);
    const macro = buildTireToggleMacro(settings);

    if (!macro) {
      this.logger.warn("No tires configured");

      return;
    }

    this.logger.debug(`Sending pit macro: ${macro}`);
    const success = getCommands().chat.sendMessage(macro);

    if (success) {
      this.logger.info("Tire toggle sent");
    } else {
      this.logger.warn("Failed to send tire toggle");
    }
  }
}
