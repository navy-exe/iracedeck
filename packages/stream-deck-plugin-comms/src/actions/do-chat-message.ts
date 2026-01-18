import streamDeck, { action, KeyDownEvent, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";
import { CameraState, hasFlag } from "@iracedeck/iracing-sdk";
import { ConnectionStateAwareAction, createSDLogger, getCommands, LogLevel } from "@iracedeck/stream-deck-shared";
import z from "zod";

import { debugKeyText, DEFAULT_ICON_COLOR, generateChatSvg } from "./chat-utils.js";

/**
 * Do Chat Message Action
 * Sends a custom chat message to iRacing when pressed
 */
@action({ UUID: "com.iracedeck.sd.comms.do-chat-message" })
export class DoChatMessage extends ConnectionStateAwareAction<ChatSettings> {
  protected override logger = createSDLogger(streamDeck.logger.createScope("DoChatMessage"), LogLevel.Info);

  private get cameraCommand() {
    return getCommands().camera;
  }
  private activeContexts = new Map<string, ChatSettings>();
  private lastIconColor = new Map<string, string>();
  private lastKeyText = new Map<string, string>();

  /**
   * When the action appears on the Stream Deck
   */
  override async onWillAppear(ev: WillAppearEvent<ChatSettings>): Promise<void> {
    // Parse settings through Zod to apply defaults
    const parsed = ChatSettings.safeParse(ev.payload.settings);
    const settings = parsed.success ? parsed.data : ChatSettings.parse({});

    // Check if settings changed (defaults were applied)
    const original = ev.payload.settings;
    const settingsChanged =
      settings.keyText !== original.keyText ||
      settings.message !== original.message ||
      settings.iconColor !== original.iconColor;

    // Update event with parsed settings
    ev.payload.settings = settings;
    this.activeContexts.set(ev.action.id, settings);

    if (settingsChanged) {
      await ev.action.setSettings(settings);
    }

    // Update display with event (stores action ref for later updates)
    await this.updateDisplayWithEvent(ev);

    // Subscribe to telemetry updates - callback handles connection state changes
    this.sdkController.subscribe(ev.action.id, (_telemetry, isConnected) => {
      // Update connection state (triggers grayscale overlay via BaseAction.setActive)
      this.updateConnectionState();

      const settings = this.activeContexts.get(ev.action.id);

      if (settings) {
        this.updateDisplay(ev.action.id, settings, isConnected);
      }
    });
  }

  /**
   * When the action disappears from the Stream Deck
   */
  override async onWillDisappear(ev: WillDisappearEvent<ChatSettings>): Promise<void> {
    await super.onWillDisappear(ev);
    this.sdkController.unsubscribe(ev.action.id);
    this.activeContexts.delete(ev.action.id);
    this.lastIconColor.delete(ev.action.id);
    this.lastKeyText.delete(ev.action.id);
  }

  /**
   * Update display using an event (for initial setup, stores action ref)
   */
  private async updateDisplayWithEvent(ev: WillAppearEvent<ChatSettings>): Promise<void> {
    const settings = ev.payload.settings;

    // Update connection state for initial overlay
    this.updateConnectionState();

    this.lastIconColor.set(ev.action.id, settings.iconColor);
    this.lastKeyText.set(ev.action.id, settings.keyText);

    // Generate SVG and set via BaseAction (stores for overlay refresh)
    const svgDataUri = generateChatSvg(settings.iconColor, settings.keyText);
    await this.setKeyImage(ev, svgDataUri);
  }

  /**
   * Update the display for a specific context (called from subscription callback)
   */
  private async updateDisplay(contextId: string, settings: ChatSettings, _isConnected: boolean): Promise<void> {
    // Only update if the color or keyText has changed
    const lastColor = this.lastIconColor.get(contextId);
    const lastText = this.lastKeyText.get(contextId);

    if (lastColor !== settings.iconColor || lastText !== settings.keyText) {
      this.lastIconColor.set(contextId, settings.iconColor);
      this.lastKeyText.set(contextId, settings.keyText);

      // Generate SVG and update via BaseAction (uses stored action ref)
      const svgDataUri = generateChatSvg(settings.iconColor, settings.keyText);
      await this.updateKeyImage(contextId, svgDataUri);
    }
  }

  /**
   * When settings are received or updated
   */
  override async onDidReceiveSettings(ev: any): Promise<void> {
    // Parse settings through Zod to apply defaults
    const parsed = ChatSettings.safeParse(ev.payload.settings);
    const settings = parsed.success ? parsed.data : ChatSettings.parse({});

    // Update stored settings
    this.activeContexts.set(ev.action.id, settings);

    // Debug logging to see what characters are in keyText
    this.logger.info(debugKeyText(settings.keyText));

    // Update connection state for overlay
    this.updateConnectionState();

    this.lastIconColor.set(ev.action.id, settings.iconColor);
    this.lastKeyText.set(ev.action.id, settings.keyText);

    const svgDataUri = generateChatSvg(settings.iconColor, settings.keyText);
    await this.setKeyImage(ev, svgDataUri);
  }

  /**
   * When the key is pressed
   */
  override async onKeyDown(ev: KeyDownEvent<ChatSettings>): Promise<void> {
    this.logger.info("Key down received");

    const message = ev.payload.settings.message?.trim();

    const telemetry = this.sdkController.getCurrentTelemetry();

    if (!telemetry || !telemetry.CamCameraState) {
      this.logger.error("Couldn't get CamCameraState");

      return;
    }

    var origCamCameraState = telemetry.CamCameraState;

    // Then use hasFlag on the telemetry data
    if (hasFlag(origCamCameraState, CameraState.UIHidden)) {
      this.cameraCommand.showUI(origCamCameraState);
    }

    if (!message) {
      this.logger.info("No message to send");

      return;
    }

    // Check if connected to iRacing
    if (!this.sdkController.getConnectionStatus()) {
      this.logger.info("Not connected to iRacing");

      return;
    }

    // Send the chat message
    const success = this.sdkController.sendChatMessage(message);

    if (success) {
      this.logger.info("Message sent succesfully");
    } else {
      this.logger.warn("Sending message failed");
    }

    this.cameraCommand.setState(origCamCameraState);
  }
}

const ChatSettings = z.object({
  keyText: z.string().default("Thanks"),
  message: z.string().default("Thank you!"),
  iconColor: z.string().default(DEFAULT_ICON_COLOR),
});

/**
 * Settings for the chat message action
 */
type ChatSettings = z.infer<typeof ChatSettings>;
