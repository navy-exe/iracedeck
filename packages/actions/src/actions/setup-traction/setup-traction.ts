import {
  assembleIcon,
  CommonSettings,
  ConnectionStateAwareAction,
  getGlobalBorderSettings,
  getGlobalColors,
  getGlobalGraphicSettings,
  getGlobalTitleSettings,
  type IDeckDialDownEvent,
  type IDeckDialRotateEvent,
  type IDeckDidReceiveSettingsEvent,
  type IDeckKeyDownEvent,
  type IDeckWillAppearEvent,
  resolveBorderSettings,
  resolveGraphicSettings,
  resolveIconColors,
  resolveTitleSettings,
} from "@iracedeck/deck-core";
import tcSlot1DecreaseIconSvg from "@iracedeck/icons/setup-traction/tc-slot-1-decrease.svg";
import tcSlot1IncreaseIconSvg from "@iracedeck/icons/setup-traction/tc-slot-1-increase.svg";
import tcSlot2DecreaseIconSvg from "@iracedeck/icons/setup-traction/tc-slot-2-decrease.svg";
import tcSlot2IncreaseIconSvg from "@iracedeck/icons/setup-traction/tc-slot-2-increase.svg";
import tcSlot3DecreaseIconSvg from "@iracedeck/icons/setup-traction/tc-slot-3-decrease.svg";
import tcSlot3IncreaseIconSvg from "@iracedeck/icons/setup-traction/tc-slot-3-increase.svg";
import tcSlot4DecreaseIconSvg from "@iracedeck/icons/setup-traction/tc-slot-4-decrease.svg";
import tcSlot4IncreaseIconSvg from "@iracedeck/icons/setup-traction/tc-slot-4-increase.svg";
import tcToggleIconSvg from "@iracedeck/icons/setup-traction/tc-toggle.svg";
import z from "zod";

type SetupTractionSetting = "tc-toggle" | "tc-slot-1" | "tc-slot-2" | "tc-slot-3" | "tc-slot-4";

type DirectionType = "increase" | "decrease";

/** Controls that have +/- direction */
const DIRECTIONAL_CONTROLS: Set<SetupTractionSetting> = new Set([
  "tc-slot-1",
  "tc-slot-2",
  "tc-slot-3",
  "tc-slot-4",
]);

/**
 * Flat icon lookup record mapping setting + direction keys to standalone SVG templates.
 */
const SETUP_TRACTION_ICONS: Record<string, string> = {
  "tc-toggle": tcToggleIconSvg,
  "tc-slot-1-increase": tcSlot1IncreaseIconSvg,
  "tc-slot-1-decrease": tcSlot1DecreaseIconSvg,
  "tc-slot-2-increase": tcSlot2IncreaseIconSvg,
  "tc-slot-2-decrease": tcSlot2DecreaseIconSvg,
  "tc-slot-3-increase": tcSlot3IncreaseIconSvg,
  "tc-slot-3-decrease": tcSlot3DecreaseIconSvg,
  "tc-slot-4-increase": tcSlot4IncreaseIconSvg,
  "tc-slot-4-decrease": tcSlot4DecreaseIconSvg,
};

/**
 * Title text for each setting + direction combination (format: "subLabel\nmainLabel")
 */
const SETUP_TRACTION_TITLES: Record<string, string> = {
  "tc-toggle": "TOGGLE\nTC",
  "tc-slot-1-increase": "INCREASE\nTC SLOT 1",
  "tc-slot-1-decrease": "DECREASE\nTC SLOT 1",
  "tc-slot-2-increase": "INCREASE\nTC SLOT 2",
  "tc-slot-2-decrease": "DECREASE\nTC SLOT 2",
  "tc-slot-3-increase": "INCREASE\nTC SLOT 3",
  "tc-slot-3-decrease": "DECREASE\nTC SLOT 3",
  "tc-slot-4-increase": "INCREASE\nTC SLOT 4",
  "tc-slot-4-decrease": "DECREASE\nTC SLOT 4",
};

/**
 * @internal Exported for testing
 *
 * Mapping from setting + direction to global settings keys.
 * Directional controls use composite keys (e.g., "tc-slot-1-increase").
 */
export const SETUP_TRACTION_GLOBAL_KEYS: Record<string, string> = {
  "tc-toggle": "setupTractionTcToggle",
  "tc-slot-1-increase": "setupTractionTcSlot1Increase",
  "tc-slot-1-decrease": "setupTractionTcSlot1Decrease",
  "tc-slot-2-increase": "setupTractionTcSlot2Increase",
  "tc-slot-2-decrease": "setupTractionTcSlot2Decrease",
  "tc-slot-3-increase": "setupTractionTcSlot3Increase",
  "tc-slot-3-decrease": "setupTractionTcSlot3Decrease",
  "tc-slot-4-increase": "setupTractionTcSlot4Increase",
  "tc-slot-4-decrease": "setupTractionTcSlot4Decrease",
};

const SetupTractionSettings = CommonSettings.extend({
  setting: z.enum(["tc-toggle", "tc-slot-1", "tc-slot-2", "tc-slot-3", "tc-slot-4"]).default("tc-toggle"),
  direction: z.enum(["increase", "decrease"]).default("increase"),
});

type SetupTractionSettings = z.infer<typeof SetupTractionSettings>;

/**
 * Resolves the flat icon lookup key from setting and direction.
 */
function resolveIconKey(setting: SetupTractionSetting, direction: DirectionType): string {
  if (DIRECTIONAL_CONTROLS.has(setting)) {
    return `${setting}-${direction}`;
  }

  return setting;
}

/**
 * @internal Exported for testing
 *
 * Generates an SVG data URI icon for the setup traction action.
 */
export function generateSetupTractionSvg(settings: SetupTractionSettings): string {
  const iconKey = resolveIconKey(settings.setting, settings.direction);

  const iconSvg = SETUP_TRACTION_ICONS[iconKey] || SETUP_TRACTION_ICONS["tc-toggle"];
  const defaultTitle = SETUP_TRACTION_TITLES[iconKey] || "SETUP\nTC";

  const colors = resolveIconColors(iconSvg, getGlobalColors(), settings.colorOverrides);
  const title = resolveTitleSettings(iconSvg, getGlobalTitleSettings(), settings.titleOverrides, defaultTitle);

  const border = resolveBorderSettings(iconSvg, getGlobalBorderSettings(), settings.borderOverrides);

  const graphic = resolveGraphicSettings(getGlobalGraphicSettings(), settings.graphicOverrides);

  return assembleIcon({ graphicSvg: iconSvg, colors, title, border, graphic });
}

/**
 * Setup Traction Action
 * Provides traction control in-car adjustments (TC Toggle, TC Slots 1-4)
 * via keyboard shortcuts.
 */
export const SETUP_TRACTION_UUID = "com.iracedeck.sd.core.setup-traction" as const;

export class SetupTraction extends ConnectionStateAwareAction<SetupTractionSettings> {
  override async onWillAppear(ev: IDeckWillAppearEvent<SetupTractionSettings>): Promise<void> {
    await super.onWillAppear(ev);
    const settings = this.parseSettings(ev.payload.settings);
    const activeKey = this.resolveGlobalKey(settings.setting, settings.direction);

    if (activeKey) {
      this.setActiveBinding(activeKey);
    }

    await this.updateDisplay(ev, settings);
  }

  override async onDidReceiveSettings(ev: IDeckDidReceiveSettingsEvent<SetupTractionSettings>): Promise<void> {
    await super.onDidReceiveSettings(ev);
    const settings = this.parseSettings(ev.payload.settings);
    const activeKey = this.resolveGlobalKey(settings.setting, settings.direction);

    if (activeKey) {
      this.setActiveBinding(activeKey);
    }

    await this.updateDisplay(ev, settings);
  }

  override async onKeyDown(ev: IDeckKeyDownEvent<SetupTractionSettings>): Promise<void> {
    this.logger.info("Key down received");
    const settings = this.parseSettings(ev.payload.settings);
    await this.executeSetting(settings.setting, settings.direction);
  }

  override async onDialDown(ev: IDeckDialDownEvent<SetupTractionSettings>): Promise<void> {
    this.logger.info("Dial down received");
    const settings = this.parseSettings(ev.payload.settings);
    await this.executeSetting(settings.setting, settings.direction);
  }

  override async onDialRotate(ev: IDeckDialRotateEvent<SetupTractionSettings>): Promise<void> {
    this.logger.info("Dial rotated");
    const settings = this.parseSettings(ev.payload.settings);

    // Non-directional controls have no +/- adjustment — ignore rotation
    if (!DIRECTIONAL_CONTROLS.has(settings.setting)) {
      this.logger.debug(`Rotation ignored for ${settings.setting}`);

      return;
    }

    // Clockwise (ticks > 0) = increase, Counter-clockwise (ticks < 0) = decrease
    const direction: DirectionType = ev.payload.ticks > 0 ? "increase" : "decrease";
    await this.executeSetting(settings.setting, direction);
  }

  private parseSettings(settings: unknown): SetupTractionSettings {
    const parsed = SetupTractionSettings.safeParse(settings);

    return parsed.success ? parsed.data : SetupTractionSettings.parse({});
  }

  private async executeSetting(setting: SetupTractionSetting, direction: DirectionType): Promise<void> {
    const settingKey = this.resolveGlobalKey(setting, direction);

    if (!settingKey) {
      this.logger.warn(`No global key mapping for ${setting} ${direction}`);

      return;
    }

    await this.tapBinding(settingKey);
  }

  private resolveGlobalKey(setting: SetupTractionSetting, direction: DirectionType): string | null {
    if (DIRECTIONAL_CONTROLS.has(setting)) {
      const key = `${setting}-${direction}`;

      return SETUP_TRACTION_GLOBAL_KEYS[key] ?? null;
    }

    return SETUP_TRACTION_GLOBAL_KEYS[setting] ?? null;
  }

  private async updateDisplay(
    ev: IDeckWillAppearEvent<SetupTractionSettings> | IDeckDidReceiveSettingsEvent<SetupTractionSettings>,
    settings: SetupTractionSettings,
  ): Promise<void> {
    const svgDataUri = generateSetupTractionSvg(settings);
    await ev.action.setTitle("");
    await this.setKeyImage(ev, svgDataUri);
    this.setRegenerateCallback(ev.action.id, () => generateSetupTractionSvg(settings));
  }
}
