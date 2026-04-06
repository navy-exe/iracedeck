import {
  assembleIcon,
  CommonSettings,
  ConnectionStateAwareAction,
  extractGraphicContent,
  generateBorderParts,
  generateIconText,
  generateTitleText,
  getCommands,
  getGlobalBorderSettings,
  getGlobalColors,
  getGlobalTitleSettings,
  getSDK,
  ICON_BASE_TEMPLATE,
  type IDeckDialDownEvent,
  type IDeckDidReceiveSettingsEvent,
  type IDeckKeyDownEvent,
  type IDeckWillAppearEvent,
  type IDeckWillDisappearEvent,
  renderIconTemplate,
  resolveBorderSettings,
  resolveIconColors,
  resolveTitleSettings,
  svgToDataUri,
} from "@iracedeck/deck-core";
import changeAllTiresIconSvg from "@iracedeck/icons/tire-service/change-all-tires.svg";
import clearTiresIconSvg from "@iracedeck/icons/tire-service/clear-tires.svg";
import toggleTiresCarSvg from "@iracedeck/icons/tire-service/toggle-tires.svg";
import { hasFlag, PitSvFlags, TelemetryData } from "@iracedeck/iracing-sdk";
import z from "zod";

import tireServiceTemplate from "../../icons/tire-service.svg";

const GRAY = "#888888";
const WHITE = "#ffffff";
const GREEN = "#2ecc71";
const YELLOW = "#f1c40f";
const RED = "#e74c3c";
const BLUE = "#3498db";

/** F1-style compound color mapping */
const COMPOUND_COLORS: Record<string, string> = {
  hard: WHITE,
  medium: YELLOW,
  soft: RED,
  intermediate: GREEN,
  wet: BLUE,
};

const DEFAULT_TIRES: DriverTire[] = [{ TireIndex: 0, TireCompoundType: "Dry" }];

type DriverTire = { TireIndex: number; TireCompoundType: string };

const TireServiceSettings = CommonSettings.extend({
  action: z.enum(["change-all-tires", "clear-tires", "toggle-tires", "change-compound"]).default("change-all-tires"),
  lf: z.coerce.boolean().default(true),
  rf: z.coerce.boolean().default(true),
  lr: z.coerce.boolean().default(true),
  rr: z.coerce.boolean().default(true),
});

type TireServiceSettings = z.infer<typeof TireServiceSettings>;

/**
 * @internal Exported for testing
 *
 * Get available tire compounds from session info.
 * Returns the DriverTires array from the first driver, or a single "Hard" fallback.
 */
export function getDriverTires(): DriverTire[] {
  try {
    const sessionInfo = getSDK().sdk.getSessionInfo();
    const driverInfo = sessionInfo?.DriverInfo as Record<string, unknown> | undefined;
    const tires = driverInfo?.DriverTires as DriverTire[] | undefined;

    return tires && tires.length > 0 ? tires : DEFAULT_TIRES;
  } catch {
    return DEFAULT_TIRES;
  }
}

/**
 * @internal Exported for testing
 *
 * Get F1-style color for a compound type. Case-insensitive. Falls back to gray.
 */
export function getCompoundColor(compoundType: string): string {
  return COMPOUND_COLORS[compoundType.toLowerCase()] ?? GRAY;
}

/**
 * @internal Exported for testing
 *
 * Get display name for a compound index.
 * - 1 compound: use its actual name, uppercased
 * - 2 compounds with one "Wet": the non-wet compound is "DRY", the wet is "WET"
 * - 3+ compounds: use the actual compound type name
 */
export function getCompoundName(compound: number): string {
  const tires = getDriverTires();
  const tire = tires.find((t) => t.TireIndex === compound);
  const typeName = tire?.TireCompoundType ?? "Dry";

  if (tires.length === 1) {
    return typeName.toUpperCase();
  }

  if (tires.length === 2 && tires.some((t) => t.TireCompoundType.toLowerCase() === "wet")) {
    return typeName.toLowerCase() === "wet" ? "WET" : "DRY";
  }

  return typeName;
}

/**
 * @internal Exported for testing
 *
 * Generate a simple colored tire icon for a compound type.
 */
export function generateTireIcon(compoundType: string): string {
  const color = getCompoundColor(compoundType);

  return `
    <circle cx="72" cy="44" r="24" fill="${color}" fill-opacity="0.25" stroke="${color}" stroke-width="4"/>
    <circle cx="72" cy="44" r="10" fill="${GRAY}" stroke="${GRAY}" stroke-width="2"/>`;
}

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
    player: telemetry?.PlayerTireCompound ?? 0,
    pitSv: telemetry?.PitSvTireCompound ?? 0,
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
 * Shared transform for the 512->144 car coordinate space.
 * Rotates 90 deg CCW, scales from 512 to ~90px, centers at (72, 53).
 */
const CAR_TRANSFORM = "translate(72, 53) rotate(-90) scale(0.176) translate(-256, -256)";

/**
 * @internal Exported for testing
 *
 * Generates dynamic tire indicator SVG paths for the toggle-tires action.
 * Uses the same coordinate space and transform as the static car silhouette.
 */
export function generateToggleTiresIconContent(
  settings: TireServiceSettings,
  currentState: { lf: boolean; rf: boolean; lr: boolean; rr: boolean },
): string {
  const lfColor = getTireColor(settings.lf ?? false, currentState.lf);
  const rfColor = getTireColor(settings.rf ?? false, currentState.rf);
  const lrColor = getTireColor(settings.lr ?? false, currentState.lr);
  const rrColor = getTireColor(settings.rr ?? false, currentState.rr);

  return `<g transform="${CAR_TRANSFORM}">
    <path fill="${lfColor}" stroke="${GRAY}" stroke-width="8" d="M346.451,158.291h68.507c5.779,0,10.451-4.682,10.451-10.452V119.88c0-5.77-4.672-10.442-10.451-10.442h-68.507c-5.77,0-10.452,4.672-10.452,10.442v27.959C335.999,153.609,340.681,158.291,346.451,158.291z"/>
    <path fill="${rfColor}" stroke="${GRAY}" stroke-width="8" d="M414.958,353.711h-68.507c-5.77,0-10.452,4.672-10.452,10.442v27.959c0,5.77,4.682,10.461,10.452,10.461h68.507c5.779,0,10.451-4.692,10.451-10.461v-27.959C425.409,358.383,420.737,353.711,414.958,353.711z"/>
    <path fill="${lrColor}" stroke="${GRAY}" stroke-width="8" d="M62.217,159.681h72.206c5.77,0,10.452-4.692,10.452-10.461v-35.328c0-5.779-4.682-10.451-10.452-10.451H62.217c-5.769,0-10.442,4.672-10.442,10.451v35.328C51.775,154.99,56.448,159.681,62.217,159.681z"/>
    <path fill="${rrColor}" stroke="${GRAY}" stroke-width="8" d="M134.422,352.329H62.217c-5.769,0-10.451,4.682-10.451,10.461v35.317c0,5.77,4.682,10.451,10.451,10.451h72.206c5.77,0,10.452-4.682,10.452-10.451v-35.317C144.874,357.011,140.192,352.329,134.422,352.329z"/>
  </g>`;
}

/**
 * @internal Exported for testing
 *
 * Generates an SVG data URI icon for the tire service based on settings and current tire state.
 */
export function generateTireServiceSvg(
  settings: TireServiceSettings,
  currentState: { lf: boolean; rf: boolean; lr: boolean; rr: boolean },
  compoundState: { player: number; pitSv: number } = { player: 0, pitSv: 0 },
): string {
  let iconContent: string;
  let textElement: string;

  switch (settings.action) {
    case "change-all-tires": {
      const colors = resolveIconColors(changeAllTiresIconSvg, getGlobalColors(), settings.colorOverrides);
      const title = resolveTitleSettings(
        changeAllTiresIconSvg,
        getGlobalTitleSettings(),
        settings.titleOverrides,
        "ALL TIRES\nCHANGE",
      );

      const border = resolveBorderSettings(changeAllTiresIconSvg, getGlobalBorderSettings(), settings.borderOverrides);

      return assembleIcon({
        graphicSvg: changeAllTiresIconSvg,
        colors,
        title,
        border,
      });
    }
    case "change-compound": {
      const compoundType = getCompoundName(compoundState.pitSv);
      const isChanging = compoundState.player !== compoundState.pitSv;

      iconContent = generateTireIcon(compoundType);

      if (isChanging) {
        textElement = [
          generateIconText({ text: `Change to`, fontSize: 18, fill: YELLOW, baseY: 112, centerX: 72 }),
          generateIconText({ text: compoundType, fontSize: 24, fill: YELLOW, baseY: 138, centerX: 72 }),
        ].join("\n");
      } else {
        textElement = [
          generateIconText({ text: `Stay on`, fontSize: 18, fill: "#ffffff", baseY: 112, centerX: 72 }),
          generateIconText({ text: compoundType, fontSize: 24, fill: "#ffffff", baseY: 138, centerX: 72 }),
        ].join("\n");
      }

      const compoundColors = resolveIconColors(tireServiceTemplate, getGlobalColors(), settings.colorOverrides);
      const border = resolveBorderSettings(tireServiceTemplate, getGlobalBorderSettings(), settings.borderOverrides);
      const borderSvg = generateBorderParts(border);

      const compoundSvg = renderIconTemplate(tireServiceTemplate, {
        iconContent,
        textElement,
        borderDefs: borderSvg.defs,
        borderContent: borderSvg.rects,
        ...compoundColors,
      });

      return svgToDataUri(compoundSvg);
    }
    case "clear-tires": {
      const colors = resolveIconColors(clearTiresIconSvg, getGlobalColors(), settings.colorOverrides);
      const title = resolveTitleSettings(
        clearTiresIconSvg,
        getGlobalTitleSettings(),
        settings.titleOverrides,
        "TIRES\nCLEAR",
      );

      const border = resolveBorderSettings(clearTiresIconSvg, getGlobalBorderSettings(), settings.borderOverrides);

      return assembleIcon({ graphicSvg: clearTiresIconSvg, colors, title, border });
    }
    default: {
      const tireElements = generateToggleTiresIconContent(settings, currentState);

      const colors = resolveIconColors(toggleTiresCarSvg, getGlobalColors(), settings.colorOverrides);
      const title = resolveTitleSettings(toggleTiresCarSvg, getGlobalTitleSettings(), settings.titleOverrides, "TIRES");
      const border = resolveBorderSettings(toggleTiresCarSvg, getGlobalBorderSettings(), settings.borderOverrides);

      const rawCarGraphic = extractGraphicContent(toggleTiresCarSvg);
      const colorizedCar = title.showGraphics ? renderIconTemplate(rawCarGraphic, colors) : "";
      const graphicContent = colorizedCar + "\n" + tireElements;

      const titleContent = title.showTitle
        ? generateTitleText({
            text: title.titleText,
            fontSize: title.fontSize,
            bold: title.bold,
            position: title.position,
            customPosition: title.customPosition,
            fill: colors.textColor ?? "#ffffff",
          })
        : "";

      const borderSvg = generateBorderParts(border);
      const borderContent = borderSvg.defs + borderSvg.rects;

      const svg = renderIconTemplate(ICON_BASE_TEMPLATE, {
        backgroundColor: colors.backgroundColor ?? "#000000",
        borderContent,
        graphicContent,
        titleContent,
      });

      return svgToDataUri(svg);
    }
  }
}

/**
 * Tire Service
 * Manages tire pit service: toggle tire changes, change compound, or clear tire selections.
 * Toggle mode: dynamic icon shows car with tire colors based on current iRacing state.
 * Green = will be changed, Red = configured but not active, Black = not configured.
 */
export const TIRE_SERVICE_UUID = "com.iracedeck.sd.core.tire-service" as const;

export class TireService extends ConnectionStateAwareAction<TireServiceSettings> {
  private activeContexts = new Map<string, TireServiceSettings>();
  private lastState = new Map<string, string>();

  override async onWillAppear(ev: IDeckWillAppearEvent<TireServiceSettings>): Promise<void> {
    await super.onWillAppear(ev);
    const settings = this.parseSettings(ev.payload.settings);
    this.activeContexts.set(ev.action.id, settings);

    await this.updateDisplayWithEvent(ev, settings);

    this.sdkController.subscribe(ev.action.id, (telemetry) => {
      const storedSettings = this.activeContexts.get(ev.action.id);

      if (storedSettings) {
        this.updateDisplayFromTelemetry(ev.action.id, telemetry, storedSettings);
      }
    });
  }

  override async onWillDisappear(ev: IDeckWillDisappearEvent<TireServiceSettings>): Promise<void> {
    await super.onWillDisappear(ev);
    this.sdkController.unsubscribe(ev.action.id);
    this.activeContexts.delete(ev.action.id);
    this.lastState.delete(ev.action.id);
  }

  override async onDidReceiveSettings(ev: IDeckDidReceiveSettingsEvent<TireServiceSettings>): Promise<void> {
    await super.onDidReceiveSettings(ev);
    const settings = this.parseSettings(ev.payload.settings);
    this.activeContexts.set(ev.action.id, settings);

    const telemetry = this.sdkController.getCurrentTelemetry();
    const tireState = getTireState(telemetry);
    const compound = getCompoundState(telemetry);

    const svgDataUri = generateTireServiceSvg(settings, tireState, compound);
    await ev.action.setTitle("");
    await this.setKeyImage(ev, svgDataUri);
    this.setRegenerateCallback(ev.action.id, () => generateTireServiceSvg(settings, tireState, compound));

    const stateKey = this.buildStateKey(settings, tireState, compound);
    this.lastState.set(ev.action.id, stateKey);
  }

  override async onKeyDown(ev: IDeckKeyDownEvent<TireServiceSettings>): Promise<void> {
    this.logger.info("Key down received");
    this.executeAction(ev.payload.settings);
  }

  override async onDialDown(ev: IDeckDialDownEvent<TireServiceSettings>): Promise<void> {
    this.logger.info("Dial down received");
    this.executeAction(ev.payload.settings);
  }

  private parseSettings(settings: unknown): TireServiceSettings {
    const parsed = TireServiceSettings.safeParse(settings);

    return parsed.success ? parsed.data : TireServiceSettings.parse({});
  }

  private async updateDisplayWithEvent(
    ev: IDeckWillAppearEvent<TireServiceSettings>,
    settings: TireServiceSettings,
  ): Promise<void> {
    const telemetry = this.sdkController.getCurrentTelemetry();
    const tireState = getTireState(telemetry);
    const compound = getCompoundState(telemetry);

    const svgDataUri = generateTireServiceSvg(settings, tireState, compound);
    await ev.action.setTitle("");
    await this.setKeyImage(ev, svgDataUri);
    this.setRegenerateCallback(ev.action.id, () => generateTireServiceSvg(settings, tireState, compound));

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
      this.setRegenerateCallback(contextId, () => generateTireServiceSvg(settings, tireState, compound));
    }
  }

  private buildStateKey(
    settings: TireServiceSettings,
    tireState: { lf: boolean; rf: boolean; lr: boolean; rr: boolean },
    compound: { player: number; pitSv: number },
  ): string {
    // Static-icon modes don't depend on telemetry — avoid unnecessary re-renders
    if (settings.action === "change-all-tires" || settings.action === "clear-tires") {
      return settings.action;
    }

    const tires = getDriverTires();
    const compoundType = getCompoundName(compound.pitSv);
    const bo = settings.borderOverrides;
    const borderKey = `${bo?.enabled ?? ""}|${bo?.borderWidth ?? ""}|${bo?.borderColor ?? ""}|${bo?.glowEnabled ?? ""}|${bo?.glowWidth ?? ""}`;

    return `${settings.action}|${settings.lf}|${settings.rf}|${settings.lr}|${settings.rr}|${tireState.lf}|${tireState.rf}|${tireState.lr}|${tireState.rr}|${compound.player}|${compound.pitSv}|${tires.length}|${compoundType}|${borderKey}`;
  }

  private executeAction(rawSettings: unknown): void {
    if (!this.sdkController.getConnectionStatus()) {
      this.logger.info("Not connected to iRacing");

      return;
    }

    const settings = this.parseSettings(rawSettings);

    switch (settings.action) {
      case "change-all-tires": {
        this.logger.debug("Sending change all tires macro");
        const success = getCommands().chat.sendMessage("#t");

        if (success) {
          this.logger.info("Change all tires sent");
        } else {
          this.logger.warn("Failed to send change all tires");
        }

        break;
      }
      case "change-compound": {
        const telemetry = this.sdkController.getCurrentTelemetry();
        const { pitSv } = getCompoundState(telemetry);
        const compounds = getDriverTires();
        const currentArrayIdx = compounds.findIndex((t) => t.TireIndex === pitSv);
        const nextArrayIdx = (currentArrayIdx + 1) % compounds.length;
        const nextTire = compounds[nextArrayIdx];

        this.logger.debug(`Changing compound from ${getCompoundName(pitSv)} to ${getCompoundName(nextTire.TireIndex)}`);
        const success = getCommands().pit.tireCompound(nextTire.TireIndex);

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
