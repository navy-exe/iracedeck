import streamDeck, { action, SingletonAction, KeyDownEvent, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";
import { SDKController } from "../../iracing/sdk-controller";
import { PitCommand } from "../../iracing/broadcast/index";
import { PitSvFlags, TelemetryData } from "../../iracing/types";
import { hasFlag } from "../../iracing/utils";

/**
 * Settings for the change tires action
 */
type ChangeTiresSettings = {
	lf?: boolean;  // Toggle left front
	rf?: boolean;  // Toggle right front
	lr?: boolean;  // Toggle left rear
	rr?: boolean;  // Toggle right rear
};

/**
 * Toggle Tires Action
 * Toggles tire change selections in pit service based on configured checkboxes.
 * Dynamic icon shows car from above with tire outlines based on CURRENT iRacing state.
 * White outline = will be changed, Gray outline = will NOT be changed.
 * On press: toggles the configured tires (if currently on, turns off; if off, turns on).
 */
@action({ UUID: "fi.lampen.niklas.iracedeck.pit.do-change-tires" })
export class DoChangeTires extends SingletonAction<ChangeTiresSettings> {
	private sdkController = SDKController.getInstance();
	private pitCommand = PitCommand.getInstance();
	private activeContexts = new Map<string, ChangeTiresSettings>();
	private lastState = new Map<string, string>();

	override async onWillAppear(ev: WillAppearEvent<ChangeTiresSettings>): Promise<void> {
		this.activeContexts.set(ev.action.id, ev.payload.settings);

		// Subscribe to telemetry updates
		this.sdkController.subscribe(ev.action.id, (telemetry, isConnected) => {
			this.updateDisplay(ev.action.id, telemetry, isConnected);
		});
	}

	override async onWillDisappear(ev: WillDisappearEvent): Promise<void> {
		this.sdkController.unsubscribe(ev.action.id);
		this.activeContexts.delete(ev.action.id);
		this.lastState.delete(ev.action.id);
	}

	/**
	 * Get tire fill color based on settings and current state
	 * Light gray: not configured (nothing happens)
	 * Red: configured and currently OFF (will turn ON)
	 * Green: configured and currently ON (will turn OFF)
	 */
	private getTireColor(isConfigured: boolean, isCurrentlyOn: boolean): string {
		if (!isConfigured) return "#666666";  // Light gray - nothing happens
		if (isCurrentlyOn) return "#44FF44";   // Green - currently ON, will turn OFF
		return "#FF4444";                       // Red - currently OFF, will turn ON
	}

	/**
	 * Generate car SVG with tires colored based on settings and current state
	 */
	private generateCarSvg(
		settings: ChangeTiresSettings,
		currentState: { lf: boolean; rf: boolean; lr: boolean; rr: boolean }
	): string {
		const lfColor = this.getTireColor(settings.lf ?? false, currentState.lf);
		const rfColor = this.getTireColor(settings.rf ?? false, currentState.rf);
		const lrColor = this.getTireColor(settings.lr ?? false, currentState.lr);
		const rrColor = this.getTireColor(settings.rr ?? false, currentState.rr);

		const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72">
  <!-- Car body -->
  <rect x="24" y="10" width="24" height="52" rx="4" fill="none" stroke="#888888" stroke-width="2"/>
  <!-- Left Front tire -->
  <rect x="10" y="12" width="10" height="16" rx="2" fill="${lfColor}" stroke="#888888" stroke-width="1"/>
  <!-- Right Front tire -->
  <rect x="52" y="12" width="10" height="16" rx="2" fill="${rfColor}" stroke="#888888" stroke-width="1"/>
  <!-- Left Rear tire -->
  <rect x="10" y="44" width="10" height="16" rx="2" fill="${lrColor}" stroke="#888888" stroke-width="1"/>
  <!-- Right Rear tire -->
  <rect x="52" y="44" width="10" height="16" rx="2" fill="${rrColor}" stroke="#888888" stroke-width="1"/>
</svg>`;
		return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
	}

	/**
	 * Get current tire change state from telemetry
	 */
	private getTireState(telemetry: TelemetryData | null): { lf: boolean; rf: boolean; lr: boolean; rr: boolean } {
		if (!telemetry || telemetry.PitSvFlags === undefined) {
			return { lf: false, rf: false, lr: false, rr: false };
		}

		const flags = telemetry.PitSvFlags;
		return {
			lf: hasFlag(flags, PitSvFlags.LFTireChange),
			rf: hasFlag(flags, PitSvFlags.RFTireChange),
			lr: hasFlag(flags, PitSvFlags.LRTireChange),
			rr: hasFlag(flags, PitSvFlags.RRTireChange)
		};
	}

	/**
	 * Update the display for a specific context
	 */
	private async updateDisplay(
		contextId: string,
		telemetry: TelemetryData | null,
		isConnected: boolean
	): Promise<void> {
		const action = streamDeck.actions.getActionById(contextId);
		if (!action) return;

		const settings = this.activeContexts.get(contextId) || {};
		let title = "";

		// Show "iRacing not connected" when disconnected
		if (!isConnected) {
			title = "iRacing\nnot\nconnected";
		}

		// Get current tire state from telemetry (for icon display)
		const tireState = this.getTireState(telemetry);

		// Generate SVG based on settings and current iRacing state
		const svgDataUri = this.generateCarSvg(settings, tireState);

		// Create state key for caching (include settings)
		const stateKey = `${title}|${settings.lf}|${settings.rf}|${settings.lr}|${settings.rr}|${tireState.lf}|${tireState.rf}|${tireState.lr}|${tireState.rr}`;
		const lastState = this.lastState.get(contextId);

		if (lastState !== stateKey) {
			this.lastState.set(contextId, stateKey);
			await action.setTitle(title);
			await action.setImage(svgDataUri);
		}
	}

	/**
	 * When settings are received or updated from Property Inspector
	 */
	override async onDidReceiveSettings(ev: any): Promise<void> {
		this.activeContexts.set(ev.action.id, ev.payload.settings);
	}

	/**
	 * When the key is pressed - toggle tire change selections
	 */
	override async onKeyDown(ev: KeyDownEvent<ChangeTiresSettings>): Promise<void> {
		streamDeck.logger.info('[DoChangeTires] Key down received');

		// Check if connected to iRacing
		if (!this.sdkController.getConnectionStatus()) {
			streamDeck.logger.info('[DoChangeTires] Not connected to iRacing');
			return;
		}

		const telemetry = this.sdkController.getCurrentTelemetry();
		if (!telemetry) {
			streamDeck.logger.warn('[DoChangeTires] No telemetry data available');
			return;
		}

		// Get current state and settings
		const currentState = this.getTireState(telemetry);
		const settings = ev.payload.settings;

		// Toggle each configured tire
		if (settings.lf) {
			if (currentState.lf) {
				// Currently on, turn off by clearing and re-enabling others
				streamDeck.logger.info('[DoChangeTires] Toggling LF off');
			} else {
				this.pitCommand.leftFront(0);
				streamDeck.logger.info('[DoChangeTires] Toggling LF on');
			}
		}
		if (settings.rf) {
			if (currentState.rf) {
				streamDeck.logger.info('[DoChangeTires] Toggling RF off');
			} else {
				this.pitCommand.rightFront(0);
				streamDeck.logger.info('[DoChangeTires] Toggling RF on');
			}
		}
		if (settings.lr) {
			if (currentState.lr) {
				streamDeck.logger.info('[DoChangeTires] Toggling LR off');
			} else {
				this.pitCommand.leftRear(0);
				streamDeck.logger.info('[DoChangeTires] Toggling LR on');
			}
		}
		if (settings.rr) {
			if (currentState.rr) {
				streamDeck.logger.info('[DoChangeTires] Toggling RR off');
			} else {
				this.pitCommand.rightRear(0);
				streamDeck.logger.info('[DoChangeTires] Toggling RR on');
			}
		}

		// If we need to turn any tires OFF, we have to clear all and re-enable the ones we want
		const turningOff = (settings.lf && currentState.lf) ||
						   (settings.rf && currentState.rf) ||
						   (settings.lr && currentState.lr) ||
						   (settings.rr && currentState.rr);

		if (turningOff) {
			// Clear all tires first
			this.pitCommand.clearTires();

			// Re-enable tires that should stay on (were on and not being toggled off)
			if (currentState.lf && !settings.lf) this.pitCommand.leftFront(0);
			if (currentState.rf && !settings.rf) this.pitCommand.rightFront(0);
			if (currentState.lr && !settings.lr) this.pitCommand.leftRear(0);
			if (currentState.rr && !settings.rr) this.pitCommand.rightRear(0);

			// Enable tires that are being toggled on (were off and configured)
			if (!currentState.lf && settings.lf) this.pitCommand.leftFront(0);
			if (!currentState.rf && settings.rf) this.pitCommand.rightFront(0);
			if (!currentState.lr && settings.lr) this.pitCommand.leftRear(0);
			if (!currentState.rr && settings.rr) this.pitCommand.rightRear(0);
		}

		streamDeck.logger.info('[DoChangeTires] Tire toggle complete');
	}
}
