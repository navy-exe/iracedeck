import streamDeck, { action, DidReceiveSettingsEvent, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";
import { buildTemplateContext, DisplayUnits, resolveTemplate, type TelemetryData } from "@iracedeck/iracing-sdk";
import z from "zod";

import sessionInfoTemplate from "../../icons/session-info.svg";
import {
  ConnectionStateAwareAction,
  createSDLogger,
  LogLevel,
  renderIconTemplate,
  svgToDataUri,
} from "../shared/index.js";

const TelemetryDisplaySettings = z.object({
  mode: z.enum(["speed", "oil-temp", "water-temp", "brake-bias", "gear", "custom"]).default("speed"),
  customTemplate: z.string().default("{{telemetry.Speed}}"),
  customTitle: z.string().default("CUSTOM"),
  backgroundColor: z.string().default("#2a3444"),
  textColor: z.string().default("#ffffff"),
  fontSize: z.coerce.number().default(18),
});

type TelemetryDisplaySettings = z.infer<typeof TelemetryDisplaySettings>;

interface PresetMode {
  title: string;
  field: string;
  format: (value: number, telemetry: TelemetryData) => string;
}

const KMH_PER_MS = 3.6;
const MPH_PER_MS = 2.23694;

/**
 * @internal Exported for testing
 */
export const PRESET_MODES: Record<string, PresetMode> = {
  speed: {
    title: "SPEED",
    field: "Speed",
    format: (val, telemetry) => {
      if (telemetry.DisplayUnits === DisplayUnits.English) {
        return `${Math.round(val * MPH_PER_MS)} mph`;
      }

      return `${Math.round(val * KMH_PER_MS)} km/h`;
    },
  },
  "oil-temp": {
    title: "OIL TEMP",
    field: "OilTemp",
    format: (val) => `${Math.round(val)}°C`,
  },
  "water-temp": {
    title: "WATER TEMP",
    field: "WaterTemp",
    format: (val) => `${Math.round(val)}°C`,
  },
  "brake-bias": {
    title: "BRAKE BIAS",
    field: "dcBrakeBias",
    format: (val) => `${val.toFixed(1)}%`,
  },
  gear: {
    title: "GEAR",
    field: "Gear",
    format: (val) => {
      if (val === -1) return "R";

      if (val === 0) return "N";

      return String(val);
    },
  },
};

/**
 * @internal Exported for testing
 */
export function generateTelemetryDisplaySvg(title: string, value: string, settings: TelemetryDisplaySettings): string {
  const svg = renderIconTemplate(sessionInfoTemplate, {
    backgroundColor: settings.backgroundColor,
    titleLabel: title,
    value,
    valueFontSize: String(settings.fontSize),
    valueY: "50",
    textColor: settings.textColor,
  });

  return svgToDataUri(svg);
}

/**
 * @internal Exported for testing
 */
export function extractPresetValue(mode: string, telemetry: TelemetryData | null): { title: string; value: string } {
  const preset = PRESET_MODES[mode];

  if (!preset) return { title: "---", value: "---" };

  if (!telemetry) return { title: preset.title, value: "---" };

  const raw = (telemetry as unknown as Record<string, unknown>)[preset.field];

  if (raw === undefined || raw === null || typeof raw !== "number") {
    return { title: preset.title, value: "---" };
  }

  return { title: preset.title, value: preset.format(raw, telemetry) };
}

/**
 * Telemetry Display Action
 * Displays live telemetry values on the Stream Deck key.
 * Supports preset modes (speed, oil temp, water temp, brake bias, gear)
 * and a custom mode with mustache template support.
 */
@action({ UUID: "com.iracedeck.sd.core.telemetry-display" })
export class TelemetryDisplay extends ConnectionStateAwareAction<TelemetryDisplaySettings> {
  protected override logger = createSDLogger(streamDeck.logger.createScope("TelemetryDisplay"), LogLevel.Info);

  private activeContexts = new Map<string, TelemetryDisplaySettings>();
  private lastState = new Map<string, string>();

  override async onWillAppear(ev: WillAppearEvent<TelemetryDisplaySettings>): Promise<void> {
    const settings = this.parseSettings(ev.payload.settings);
    this.activeContexts.set(ev.action.id, settings);
    await this.updateDisplay(ev, settings);

    this.sdkController.subscribe(ev.action.id, (telemetry) => {
      this.updateConnectionState();

      const storedSettings = this.activeContexts.get(ev.action.id);

      if (storedSettings) {
        this.updateDisplayFromTelemetry(ev.action.id, telemetry, storedSettings);
      }
    });
  }

  override async onWillDisappear(ev: WillDisappearEvent<TelemetryDisplaySettings>): Promise<void> {
    await super.onWillDisappear(ev);
    this.sdkController.unsubscribe(ev.action.id);
    this.activeContexts.delete(ev.action.id);
    this.lastState.delete(ev.action.id);
  }

  override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<TelemetryDisplaySettings>): Promise<void> {
    const settings = this.parseSettings(ev.payload.settings);
    this.activeContexts.set(ev.action.id, settings);
    this.lastState.delete(ev.action.id);
    await this.updateDisplay(ev, settings);
  }

  private parseSettings(settings: unknown): TelemetryDisplaySettings {
    const parsed = TelemetryDisplaySettings.safeParse(settings);

    return parsed.success ? parsed.data : TelemetryDisplaySettings.parse({});
  }

  private async updateDisplay(
    ev: WillAppearEvent<TelemetryDisplaySettings> | DidReceiveSettingsEvent<TelemetryDisplaySettings>,
    settings: TelemetryDisplaySettings,
  ): Promise<void> {
    this.updateConnectionState();

    const telemetry = this.sdkController.getCurrentTelemetry();
    const { title, value } = this.resolveDisplay(settings, telemetry);

    const svgDataUri = generateTelemetryDisplaySvg(title, value, settings);
    await ev.action.setTitle("");
    await this.setKeyImage(ev, svgDataUri);

    const stateKey = this.buildStateKey(title, value, settings);
    this.lastState.set(ev.action.id, stateKey);
  }

  private resolveDisplay(
    settings: TelemetryDisplaySettings,
    telemetry: TelemetryData | null,
  ): { title: string; value: string } {
    if (settings.mode === "custom") {
      if (!telemetry) return { title: settings.customTitle, value: "---" };

      const context = buildTemplateContext(this.sdkController);
      const value = resolveTemplate(settings.customTemplate, context);

      return { title: settings.customTitle, value: value || "---" };
    }

    return extractPresetValue(settings.mode, telemetry);
  }

  private buildStateKey(title: string, value: string, settings: TelemetryDisplaySettings): string {
    return `${title}|${value}|${settings.backgroundColor}|${settings.textColor}|${settings.fontSize}`;
  }

  private async updateDisplayFromTelemetry(
    contextId: string,
    telemetry: TelemetryData | null,
    settings: TelemetryDisplaySettings,
  ): Promise<void> {
    const { title, value } = this.resolveDisplay(settings, telemetry);
    const stateKey = this.buildStateKey(title, value, settings);
    const lastStateKey = this.lastState.get(contextId);

    if (lastStateKey !== stateKey) {
      this.lastState.set(contextId, stateKey);
      const svgDataUri = generateTelemetryDisplaySvg(title, value, settings);
      await this.updateKeyImage(contextId, svgDataUri);
    }
  }
}
