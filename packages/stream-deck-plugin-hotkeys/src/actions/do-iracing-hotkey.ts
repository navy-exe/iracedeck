import streamDeck, { action, KeyDownEvent, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";
import {
  ConnectionStateAwareAction,
  createSDLogger,
  escapeXml,
  generateIconText,
  getHotkeyPreset,
  getKeyboard,
  type KeyboardKey,
  type KeyboardModifier,
  type KeyCombination,
  LogLevel,
  renderIconTemplate,
  svgToDataUri,
} from "@iracedeck/stream-deck-shared";
import z from "zod";

import doIRacingHotkeyTemplate from "../icons/do-iracing-hotkey.svg";

const DEFAULT_ICON_COLOR = "#d94a4a";

/**
 * Format a key combination for display (e.g., "Ctrl+Shift+F3")
 */
function formatKeyCombination(combination: KeyCombination): string {
  const parts: string[] = [];

  if (combination.modifiers) {
    if (combination.modifiers.includes("ctrl")) parts.push("Ctrl");

    if (combination.modifiers.includes("shift")) parts.push("Shift");

    if (combination.modifiers.includes("alt")) parts.push("Alt");
  }

  parts.push(combination.key.toUpperCase());

  return parts.join("+");
}

/**
 * Build a KeyCombination from override settings or preset defaults
 */
function buildKeyCombination(
  presetCombination: KeyCombination,
  overrideKey?: string,
  overrideCtrl?: boolean,
  overrideShift?: boolean,
  overrideAlt?: boolean,
): KeyCombination {
  // If override key is set, use override settings
  if (overrideKey && overrideKey.trim() !== "") {
    const modifiers: KeyboardModifier[] = [];

    if (overrideCtrl) modifiers.push("ctrl");

    if (overrideShift) modifiers.push("shift");

    if (overrideAlt) modifiers.push("alt");

    return {
      key: overrideKey as KeyboardKey,
      modifiers: modifiers.length > 0 ? modifiers : undefined,
    };
  }

  // Otherwise use preset defaults
  return presetCombination;
}

/**
 * Generates an SVG icon for the iRacing hotkey action.
 */
function generateIRacingHotkeySvg(color: string, presetName: string): string {
  const textElement = generateIconText({
    text: escapeXml(presetName),
    fontSize: 12,
    baseY: 58,
    lineHeightMultiplier: 1.2,
  });

  const svg = renderIconTemplate(doIRacingHotkeyTemplate, {
    color,
    textElement,
  });

  return svgToDataUri(svg);
}

/**
 * iRacing Hotkey Action
 * Sends a preconfigured iRacing keyboard shortcut when pressed
 */
@action({ UUID: "com.iracedeck.sd.hotkeys.do-iracing-hotkey" })
export class DoIRacingHotkey extends ConnectionStateAwareAction<IRacingHotkeySettings> {
  protected override logger = createSDLogger(streamDeck.logger.createScope("DoIRacingHotkey"), LogLevel.Info);

  private activeContexts = new Map<string, IRacingHotkeySettings>();
  private lastSettings = new Map<string, string>();

  /**
   * When the action appears on the Stream Deck
   */
  override async onWillAppear(ev: WillAppearEvent<IRacingHotkeySettings>): Promise<void> {
    const parsed = IRacingHotkeySettings.safeParse(ev.payload.settings);
    const settings = parsed.success ? parsed.data : IRacingHotkeySettings.parse({});

    const original = ev.payload.settings;
    const settingsChanged =
      settings.presetId !== original.presetId ||
      settings.overrideKey !== original.overrideKey ||
      settings.overrideCtrl !== original.overrideCtrl ||
      settings.overrideShift !== original.overrideShift ||
      settings.overrideAlt !== original.overrideAlt ||
      settings.iconColor !== original.iconColor;

    ev.payload.settings = settings;
    this.activeContexts.set(ev.action.id, settings);

    if (settingsChanged) {
      await ev.action.setSettings(settings);
    }

    await this.updateDisplayWithEvent(ev);

    this.sdkController.subscribe(ev.action.id, () => {
      this.updateConnectionState();
    });
  }

  /**
   * When the action disappears from the Stream Deck
   */
  override async onWillDisappear(ev: WillDisappearEvent<IRacingHotkeySettings>): Promise<void> {
    await super.onWillDisappear(ev);
    this.sdkController.unsubscribe(ev.action.id);
    this.activeContexts.delete(ev.action.id);
    this.lastSettings.delete(ev.action.id);
  }

  /**
   * Update display using an event (for initial setup)
   */
  private async updateDisplayWithEvent(ev: WillAppearEvent<IRacingHotkeySettings>): Promise<void> {
    const settings = ev.payload.settings;

    this.updateConnectionState();

    const settingsKey = JSON.stringify(settings);
    this.lastSettings.set(ev.action.id, settingsKey);

    const preset = getHotkeyPreset(settings.presetId);
    const presetName = preset?.name ?? "Unknown";

    const svgDataUri = generateIRacingHotkeySvg(settings.iconColor, presetName);
    await this.setKeyImage(ev, svgDataUri);
  }

  /**
   * When settings are received or updated
   */
  override async onDidReceiveSettings(ev: any): Promise<void> {
    const parsed = IRacingHotkeySettings.safeParse(ev.payload.settings);
    const settings = parsed.success ? parsed.data : IRacingHotkeySettings.parse({});

    this.activeContexts.set(ev.action.id, settings);

    this.updateConnectionState();

    const settingsKey = JSON.stringify(settings);
    this.lastSettings.set(ev.action.id, settingsKey);

    const preset = getHotkeyPreset(settings.presetId);
    const presetName = preset?.name ?? "Unknown";

    const svgDataUri = generateIRacingHotkeySvg(settings.iconColor, presetName);
    await this.setKeyImage(ev, svgDataUri);
  }

  /**
   * When the key is pressed
   */
  override async onKeyDown(ev: KeyDownEvent<IRacingHotkeySettings>): Promise<void> {
    this.logger.info("Key down received");

    const settings = ev.payload.settings;
    const preset = getHotkeyPreset(settings.presetId);

    if (!preset) {
      this.logger.warn(`Unknown preset: ${settings.presetId}`);

      return;
    }

    const combination = buildKeyCombination(
      preset.defaultKey,
      settings.overrideKey,
      settings.overrideCtrl,
      settings.overrideShift,
      settings.overrideAlt,
    );

    this.logger.debug(`Sending key combination: ${JSON.stringify(combination)}`);

    const keyboard = getKeyboard();
    const success = await keyboard.sendKeyCombination(combination);

    if (success) {
      this.logger.info(`iRacing hotkey "${preset.name}" (${formatKeyCombination(combination)}) sent successfully`);
    } else {
      this.logger.warn(`Failed to send iRacing hotkey "${preset.name}" (${formatKeyCombination(combination)})`);
    }
  }
}

const IRacingHotkeySettings = z.object({
  presetId: z.string().default("blackbox-relative"),
  overrideKey: z.string().optional(),
  overrideCtrl: z.coerce.boolean().optional(),
  overrideShift: z.coerce.boolean().optional(),
  overrideAlt: z.coerce.boolean().optional(),
  iconColor: z.string().default(DEFAULT_ICON_COLOR),
});

/**
 * Settings for the iRacing hotkey action
 */
type IRacingHotkeySettings = z.infer<typeof IRacingHotkeySettings>;
