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
import masterMuteIconSvg from "@iracedeck/icons/audio-controls/master-mute.svg";
import masterVolumeDownIconSvg from "@iracedeck/icons/audio-controls/master-volume-down.svg";
import masterVolumeUpIconSvg from "@iracedeck/icons/audio-controls/master-volume-up.svg";
import voiceChatMuteIconSvg from "@iracedeck/icons/audio-controls/voice-chat-mute.svg";
import voiceChatVolumeDownIconSvg from "@iracedeck/icons/audio-controls/voice-chat-volume-down.svg";
import voiceChatVolumeUpIconSvg from "@iracedeck/icons/audio-controls/voice-chat-volume-up.svg";
import z from "zod";

type AudioCategory = "voice-chat" | "master";
type AudioAction = "volume-up" | "volume-down" | "mute";

/** Categories that support mute */
const MUTE_CATEGORIES: Set<AudioCategory> = new Set(["voice-chat"]);

/**
 * Flat record mapping "{category}-{action}" keys to imported SVGs.
 */
const AUDIO_ICONS: Record<string, string> = {
  "voice-chat-volume-up": voiceChatVolumeUpIconSvg,
  "voice-chat-volume-down": voiceChatVolumeDownIconSvg,
  "voice-chat-mute": voiceChatMuteIconSvg,
  "master-volume-up": masterVolumeUpIconSvg,
  "master-volume-down": masterVolumeDownIconSvg,
  "master-mute": masterMuteIconSvg,
};

/**
 * Title text for each category + action combination (format: "subLabel\nmainLabel")
 */
const AUDIO_CONTROLS_TITLES: Record<string, string> = {
  "voice-chat-volume-up": "VOL UP\nVOICE",
  "voice-chat-volume-down": "VOL DOWN\nVOICE",
  "voice-chat-mute": "MUTE\nVOICE",
  "master-volume-up": "VOL UP\nMASTER",
  "master-volume-down": "VOL DOWN\nMASTER",
  "master-mute": "VOLUME\nMASTER",
};

/**
 * @internal Exported for testing
 *
 * Mapping from category + action to global settings keys.
 */
export const AUDIO_CONTROLS_GLOBAL_KEYS: Record<string, string> = {
  "voice-chat-volume-up": "audioVoiceChatVolumeUp",
  "voice-chat-volume-down": "audioVoiceChatVolumeDown",
  "voice-chat-mute": "audioVoiceChatMute",
  "master-volume-up": "audioMasterVolumeUp",
  "master-volume-down": "audioMasterVolumeDown",
};

const AudioControlsSettings = CommonSettings.extend({
  category: z.enum(["voice-chat", "master"]).default("voice-chat"),
  action: z.enum(["volume-up", "volume-down", "mute"]).default("volume-up"),
});

type AudioControlsSettings = z.infer<typeof AudioControlsSettings>;

/**
 * @internal Exported for testing
 *
 * Generates an SVG data URI icon for the audio controls action.
 */
export function generateAudioControlsSvg(settings: AudioControlsSettings): string {
  const { category, action: audioAction } = settings;

  // For master category with mute, fall back to volume-up display
  const effectiveAction = category === "master" && audioAction === "mute" ? "volume-up" : audioAction;

  const iconKey = `${category}-${effectiveAction}`;
  const iconSvg = AUDIO_ICONS[iconKey] || AUDIO_ICONS["voice-chat-volume-up"];
  const defaultTitle =
    AUDIO_CONTROLS_TITLES[`${category}-${audioAction}`] || AUDIO_CONTROLS_TITLES[iconKey] || "AUDIO\nCONTROLS";

  const colors = resolveIconColors(iconSvg, getGlobalColors(), settings.colorOverrides);
  const title = resolveTitleSettings(iconSvg, getGlobalTitleSettings(), settings.titleOverrides, defaultTitle);

  const border = resolveBorderSettings(iconSvg, getGlobalBorderSettings(), settings.borderOverrides);

  const graphic = resolveGraphicSettings(getGlobalGraphicSettings(), settings.graphicOverrides);

  return assembleIcon({ graphicSvg: iconSvg, colors, title, border, graphic });
}

/**
 * Audio Controls Action
 * Provides volume and mute controls for voice chat and master audio
 * categories via keyboard shortcuts.
 */
export const AUDIO_CONTROLS_UUID = "com.iracedeck.sd.core.audio-controls" as const;

export class AudioControls extends ConnectionStateAwareAction<AudioControlsSettings> {
  override async onWillAppear(ev: IDeckWillAppearEvent<AudioControlsSettings>): Promise<void> {
    await super.onWillAppear(ev);
    const settings = this.parseSettings(ev.payload.settings);
    const activeKey = this.resolveGlobalKey(settings.category, settings.action);

    if (activeKey) {
      this.setActiveBinding(activeKey);
    }

    await this.updateDisplay(ev, settings);
  }

  override async onDidReceiveSettings(ev: IDeckDidReceiveSettingsEvent<AudioControlsSettings>): Promise<void> {
    await super.onDidReceiveSettings(ev);
    const settings = this.parseSettings(ev.payload.settings);
    const activeKey = this.resolveGlobalKey(settings.category, settings.action);

    if (activeKey) {
      this.setActiveBinding(activeKey);
    }

    await this.updateDisplay(ev, settings);
  }

  override async onKeyDown(ev: IDeckKeyDownEvent<AudioControlsSettings>): Promise<void> {
    this.logger.info("Key down received");
    const settings = this.parseSettings(ev.payload.settings);
    await this.executeControl(settings.category, settings.action);
  }

  override async onDialDown(ev: IDeckDialDownEvent<AudioControlsSettings>): Promise<void> {
    this.logger.info("Dial down received");
    const settings = this.parseSettings(ev.payload.settings);

    if (MUTE_CATEGORIES.has(settings.category)) {
      await this.executeControl(settings.category, "mute");
    } else {
      await this.executeControl(settings.category, settings.action);
    }
  }

  override async onDialRotate(ev: IDeckDialRotateEvent<AudioControlsSettings>): Promise<void> {
    this.logger.info("Dial rotated");
    const settings = this.parseSettings(ev.payload.settings);
    const audioAction: AudioAction = ev.payload.ticks > 0 ? "volume-up" : "volume-down";
    await this.executeControl(settings.category, audioAction);
  }

  private parseSettings(settings: unknown): AudioControlsSettings {
    const parsed = AudioControlsSettings.safeParse(settings);

    return parsed.success ? parsed.data : AudioControlsSettings.parse({});
  }

  private async executeControl(category: AudioCategory, audioAction: AudioAction): Promise<void> {
    const settingKey = this.resolveGlobalKey(category, audioAction);

    if (!settingKey) {
      this.logger.warn(`No global key mapping for ${category} ${audioAction}`);

      return;
    }

    await this.tapBinding(settingKey);
  }

  private resolveGlobalKey(category: AudioCategory, audioAction: AudioAction): string | null {
    const key = `${category}-${audioAction}`;

    return AUDIO_CONTROLS_GLOBAL_KEYS[key] ?? null;
  }

  private async updateDisplay(
    ev: IDeckWillAppearEvent<AudioControlsSettings> | IDeckDidReceiveSettingsEvent<AudioControlsSettings>,
    settings: AudioControlsSettings,
  ): Promise<void> {
    const svgDataUri = generateAudioControlsSvg(settings);
    await ev.action.setTitle("");
    await this.setKeyImage(ev, svgDataUri);
    this.setRegenerateCallback(ev.action.id, () => generateAudioControlsSvg(settings));
  }
}
