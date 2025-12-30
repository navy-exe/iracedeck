import streamDeck, { action, SingletonAction, WillAppearEvent, WillDisappearEvent, KeyDownEvent } from "@elgato/streamdeck";
import { SDKController } from "../iracing/sdk-controller";
import { TelemetryData } from "../iracing/types";

/**
 * Speed Display Action
 * Displays current speed from iRacing telemetry
 */
@action({ UUID: "fi.lampen.niklas.iracedeck.speed" })
export class SpeedDisplay extends SingletonAction<SpeedSettings> {
	private sdkController = SDKController.getInstance();
	private activeContexts = new Map<string, SpeedSettings>();
	private lastTitle = new Map<string, string>();

	/**
	 * When the action appears on the Stream Deck
	 */
	override async onWillAppear(ev: WillAppearEvent<SpeedSettings>): Promise<void> {
		this.activeContexts.set(ev.action.id, ev.payload.settings);

		// Subscribe to telemetry updates
		this.sdkController.subscribe(ev.action.id, (telemetry, isConnected) => {
			const settings = this.activeContexts.get(ev.action.id);
			if (settings) {
				this.updateDisplay(ev.action.id, settings, telemetry, isConnected);
			}
		});
	}

	/**
	 * When the action disappears from the Stream Deck
	 */
	override async onWillDisappear(ev: WillDisappearEvent<SpeedSettings>): Promise<void> {
		this.sdkController.unsubscribe(ev.action.id);
		this.activeContexts.delete(ev.action.id);
		this.lastTitle.delete(ev.action.id);
	}

	/**
	 * When settings are updated
	 */
	override async onDidReceiveSettings(ev: any): Promise<void> {
		// Update stored settings for this context
		this.activeContexts.set(ev.action.id, ev.payload.settings);
	}

	/**
	 * When the key is pressed
	 */
	override async onKeyDown(ev: KeyDownEvent<SpeedSettings>): Promise<void> {
		// Toggle units between MPH and KPH
		const currentUnit = ev.payload.settings.unit || "mph";
		const newUnit: "mph" | "kph" = currentUnit === "mph" ? "kph" : "mph";

		const newSettings: SpeedSettings = {
			...ev.payload.settings,
			unit: newUnit
		};

		await ev.action.setSettings(newSettings);

		// Update stored settings
		this.activeContexts.set(ev.action.id, newSettings);

		// Update display immediately with current telemetry
		const telemetry = this.sdkController.getCurrentTelemetry();
		const isConnected = this.sdkController.getConnectionStatus();
		this.updateDisplay(ev.action.id, newSettings, telemetry, isConnected);
	}

	/**
	 * Update the display for a specific action instance
	 */
	private async updateDisplay(
		contextId: string,
		settings: SpeedSettings,
		telemetry: TelemetryData | null,
		isConnected: boolean
	): Promise<void> {
		const action = streamDeck.actions.getActionById(contextId);
		if (!action) return;

		let title = "iRacing\nnot\nconnected";

		if (isConnected && telemetry) {
			const speed = telemetry.Speed;

			if (speed !== null && speed !== undefined && typeof speed === 'number') {
				// Speed in iRacing is in m/s
				const unit = settings.unit || "mph";
				let displaySpeed: number;

				if (unit === "kph") {
					// Convert m/s to km/h
					displaySpeed = speed * 3.6;
				} else {
					// Convert m/s to mph
					displaySpeed = speed * 2.23694;
				}

				title = Math.round(displaySpeed).toString();
			} else {
				title = "N/A";
			}
		}

		// Only update if the title has changed
		const lastTitle = this.lastTitle.get(contextId);
		if (lastTitle !== title) {
			this.lastTitle.set(contextId, title);
			await action.setTitle(title);
		}
	}
}

/**
 * Settings for the speed display action
 */
type SpeedSettings = {
	unit?: "mph" | "kph";
};
