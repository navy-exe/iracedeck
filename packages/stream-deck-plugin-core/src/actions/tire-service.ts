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

const GRAY = "#888888";
const WHITE = "#ffffff";
const YELLOW = "#f1c40f";
const RED = "#e74c3c";
const BLUE = "#3498db";

/** Tire compound index: 0 = dry, 1 = wet */
const COMPOUND_DRY = 0;
const COMPOUND_WET = 1;

const TireServiceSettings = z.object({
  action: z.enum(["toggle-tires", "change-compound", "clear-tires"]).default("toggle-tires"),
  lf: z.coerce.boolean().default(true),
  rf: z.coerce.boolean().default(true),
  lr: z.coerce.boolean().default(true),
  rr: z.coerce.boolean().default(true),
});

type TireServiceSettings = z.infer<typeof TireServiceSettings>;

/**
 * @internal Exported for testing
 *
 * Get compound name from telemetry value. Defaults to "DRY" for unknown values.
 */
export function getCompoundName(compound: number): string {
  return compound === COMPOUND_WET ? "WET" : "DRY";
}

/** Dry tire: circle with straight block tread pattern */
const DRY_TIRE_ICON = `
    <circle cx="36" cy="22" r="12" fill="none" stroke="${WHITE}" stroke-width="1.5"/>
    <circle cx="36" cy="22" r="5" fill="none" stroke="${GRAY}" stroke-width="1"/>
    <line x1="36" y1="10" x2="36" y2="15" stroke="${WHITE}" stroke-width="2" stroke-linecap="round"/>
    <line x1="36" y1="29" x2="36" y2="34" stroke="${WHITE}" stroke-width="2" stroke-linecap="round"/>
    <line x1="24" y1="22" x2="29" y2="22" stroke="${WHITE}" stroke-width="2" stroke-linecap="round"/>
    <line x1="43" y1="22" x2="48" y2="22" stroke="${WHITE}" stroke-width="2" stroke-linecap="round"/>
    <line x1="27.5" y1="13.5" x2="31" y2="17" stroke="${WHITE}" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="41" y1="27" x2="44.5" y2="30.5" stroke="${WHITE}" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="44.5" y1="13.5" x2="41" y2="17" stroke="${WHITE}" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="31" y1="27" x2="27.5" y2="30.5" stroke="${WHITE}" stroke-width="1.5" stroke-linecap="round"/>`;

/** Wet tire: circle with diagonal rain grooves and water drops */
const WET_TIRE_ICON = `
    <circle cx="36" cy="22" r="12" fill="none" stroke="${BLUE}" stroke-width="1.5"/>
    <circle cx="36" cy="22" r="5" fill="none" stroke="${GRAY}" stroke-width="1"/>
    <path d="M30 14 Q36 18 30 22" fill="none" stroke="${BLUE}" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M36 12 Q42 16 36 20" fill="none" stroke="${BLUE}" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M42 14 Q48 18 42 22" fill="none" stroke="${BLUE}" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M30 24 Q36 28 30 32" fill="none" stroke="${BLUE}" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M36 24 Q42 28 36 32" fill="none" stroke="${BLUE}" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M42 24 Q48 28 42 32" fill="none" stroke="${BLUE}" stroke-width="1.5" stroke-linecap="round"/>`;

const CLEAR_TIRES_ICON_CONTENT = `
    <circle cx="36" cy="26" r="10" fill="none" stroke="${WHITE}" stroke-width="1.5"/>
    <circle cx="36" cy="26" r="4" fill="none" stroke="${GRAY}" stroke-width="1"/>
    <line x1="29" y1="19" x2="43" y2="33" stroke="${RED}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="43" y1="19" x2="29" y2="33" stroke="${RED}" stroke-width="2.5" stroke-linecap="round"/>`;

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
 * Get tire compound info from telemetry.
 * playerCompound: tires currently on the car.
 * pitSvCompound: compound selected for the next pit stop.
 */
function getCompoundState(telemetry: TelemetryData | null): { player: number; pitSv: number } {
  return {
    player: telemetry?.PlayerTireCompound ?? COMPOUND_DRY,
    pitSv: telemetry?.PitSvTireCompound ?? COMPOUND_DRY,
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
 * Generates the car body SVG content with colored tires for the toggle-tires action.
 */
function generateToggleTiresIconContent(
  settings: TireServiceSettings,
  currentState: { lf: boolean; rf: boolean; lr: boolean; rr: boolean },
): string {
  const lfColor = getTireColor(settings.lf ?? false, currentState.lf);
  const rfColor = getTireColor(settings.rf ?? false, currentState.rf);
  const lrColor = getTireColor(settings.lr ?? false, currentState.lr);
  const rrColor = getTireColor(settings.rr ?? false, currentState.rr);

  return `
    <rect x="26" y="6" width="20" height="32" rx="3" fill="none" stroke="${GRAY}" stroke-width="2"/>
    <rect x="14" y="8" width="8" height="10" rx="1.5" fill="${lfColor}" stroke="${GRAY}" stroke-width="1"/>
    <rect x="50" y="8" width="8" height="10" rx="1.5" fill="${rfColor}" stroke="${GRAY}" stroke-width="1"/>
    <rect x="14" y="26" width="8" height="10" rx="1.5" fill="${lrColor}" stroke="${GRAY}" stroke-width="1"/>
    <rect x="50" y="26" width="8" height="10" rx="1.5" fill="${rrColor}" stroke="${GRAY}" stroke-width="1"/>`;
}

/**
 * @internal Exported for testing
 *
 * Generates an SVG data URI icon for the tire service based on settings and current tire state.
 */
export function generateTireServiceSvg(
  settings: TireServiceSettings,
  currentState: { lf: boolean; rf: boolean; lr: boolean; rr: boolean },
  compoundState: { player: number; pitSv: number } = { player: COMPOUND_DRY, pitSv: COMPOUND_DRY },
): string {
  let iconContent: string;
  let textElement: string;

  switch (settings.action) {
    case "change-compound": {
      const pitSvName = getCompoundName(compoundState.pitSv);
      const isChanging = compoundState.player !== compoundState.pitSv;

      iconContent = compoundState.pitSv === COMPOUND_WET ? WET_TIRE_ICON : DRY_TIRE_ICON;

      if (isChanging) {
        textElement = [
          generateIconText({ text: `Change to`, fontSize: 9, fill: YELLOW, baseY: 50 }),
          generateIconText({ text: pitSvName, fontSize: 12, fill: YELLOW, baseY: 63 }),
        ].join("\n");
      } else {
        textElement = [
          generateIconText({ text: `Stay on`, fontSize: 9, fill: "#ffffff", baseY: 50 }),
          generateIconText({ text: pitSvName, fontSize: 12, fill: "#ffffff", baseY: 63 }),
        ].join("\n");
      }

      break;
    }
    case "clear-tires": {
      iconContent = CLEAR_TIRES_ICON_CONTENT;
      textElement = [
        generateIconText({ text: "CLEAR", fontSize: 10, fill: "#ffffff", baseY: 52 }),
        generateIconText({ text: "TIRES", fontSize: 8, fill: "#aaaaaa", baseY: 63 }),
      ].join("\n");
      break;
    }
    default: {
      iconContent = generateToggleTiresIconContent(settings, currentState);

      const anyTireOn =
        (settings.lf && currentState.lf) ||
        (settings.rf && currentState.rf) ||
        (settings.lr && currentState.lr) ||
        (settings.rr && currentState.rr);

      const titleText = anyTireOn ? "Change" : "No Change";
      const titleColor = anyTireOn ? "#FFFFFF" : "#FF4444";

      textElement = generateIconText({ text: titleText, fontSize: 12, fill: titleColor });
      break;
    }
  }

  const svg = renderIconTemplate(tireServiceTemplate, {
    iconContent,
    textElement,
  });

  return svgToDataUri(svg);
}

/**
 * Tire Service
 * Manages tire pit service: toggle tire changes, change compound, or clear tire selections.
 * Toggle mode: dynamic icon shows car with tire colors based on current iRacing state.
 * Green = will be changed, Red = configured but not active, Black = not configured.
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
    const compound = getCompoundState(telemetry);

    this.updateConnectionState();

    const svgDataUri = generateTireServiceSvg(settings, tireState, compound);
    await ev.action.setTitle("");
    await this.setKeyImage(ev, svgDataUri);

    const stateKey = this.buildStateKey(settings, tireState, compound);
    this.lastState.set(ev.action.id, stateKey);
  }

  override async onKeyDown(ev: KeyDownEvent<TireServiceSettings>): Promise<void> {
    this.logger.info("Key down received");
    this.executeAction(ev.payload.settings);
  }

  override async onDialDown(ev: DialDownEvent<TireServiceSettings>): Promise<void> {
    this.logger.info("Dial down received");
    this.executeAction(ev.payload.settings);
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
    const compound = getCompoundState(telemetry);

    this.updateConnectionState();

    const svgDataUri = generateTireServiceSvg(settings, tireState, compound);
    await ev.action.setTitle("");
    await this.setKeyImage(ev, svgDataUri);

    const stateKey = this.buildStateKey(settings, tireState, compound);
    this.lastState.set(ev.action.id, stateKey);
  }

  private async updateDisplayFromTelemetry(
    contextId: string,
    telemetry: TelemetryData | null,
    settings: TireServiceSettings,
  ): Promise<void> {
    const tireState = getTireState(telemetry);
    const compound = getCompoundState(telemetry);
    const stateKey = this.buildStateKey(settings, tireState, compound);
    const lastStateKey = this.lastState.get(contextId);

    if (lastStateKey !== stateKey) {
      this.lastState.set(contextId, stateKey);
      const svgDataUri = generateTireServiceSvg(settings, tireState, compound);
      await this.updateKeyImage(contextId, svgDataUri);
    }
  }

  private buildStateKey(
    settings: TireServiceSettings,
    tireState: { lf: boolean; rf: boolean; lr: boolean; rr: boolean },
    compound: { player: number; pitSv: number },
  ): string {
    return `${settings.action}|${settings.lf}|${settings.rf}|${settings.lr}|${settings.rr}|${tireState.lf}|${tireState.rf}|${tireState.lr}|${tireState.rr}|${compound.player}|${compound.pitSv}`;
  }

  private executeAction(rawSettings: unknown): void {
    if (!this.sdkController.getConnectionStatus()) {
      this.logger.info("Not connected to iRacing");

      return;
    }

    const settings = this.parseSettings(rawSettings);

    switch (settings.action) {
      case "change-compound": {
        const telemetry = this.sdkController.getCurrentTelemetry();
        const { pitSv } = getCompoundState(telemetry);
        const targetCompound = pitSv === COMPOUND_WET ? COMPOUND_DRY : COMPOUND_WET;

        this.logger.debug(`Changing compound from ${getCompoundName(pitSv)} to ${getCompoundName(targetCompound)}`);
        const success = getCommands().pit.tireCompound(targetCompound);

        if (success) {
          this.logger.info("Tire compound change sent");
        } else {
          this.logger.warn("Failed to send tire compound change");
        }

        break;
      }
      case "clear-tires": {
        this.logger.debug("Sending clear tires");
        const success = getCommands().pit.clearTires();

        if (success) {
          this.logger.info("Clear tires sent");
        } else {
          this.logger.warn("Failed to send clear tires");
        }

        break;
      }
      default: {
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

        break;
      }
    }
  }
}
