import streamDeck, { action, SingletonAction, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";
import { SDKController } from "../iracing/sdk-controller";
import { TelemetryData } from "../iracing/types";

/**
 * Gear Display Action
 * Displays current gear from iRacing telemetry
 */
@action({ UUID: "fi.lampen.niklas.iracedeck.gear" })
export class GearDisplay extends SingletonAction {
	private sdkController = SDKController.getInstance();
	private lastTitle = new Map<string, string>();

	/**
	 * When the action appears on the Stream Deck
	 */
	override async onWillAppear(ev: WillAppearEvent): Promise<void> {
		// Subscribe to telemetry updates
		this.sdkController.subscribe(ev.action.id, (telemetry, isConnected) => {
			this.updateDisplay(ev.action.id, telemetry, isConnected);
		});
	}

	/**
	 * When the action disappears from the Stream Deck
	 */
	override async onWillDisappear(ev: WillDisappearEvent): Promise<void> {
		this.sdkController.unsubscribe(ev.action.id);
		this.lastTitle.delete(ev.action.id);
	}

	/**
	 * Update the display for a specific action instance
	 */
	private async updateDisplay(
		contextId: string,
		telemetry: TelemetryData | null,
		isConnected: boolean
	): Promise<void> {
		const action = streamDeck.actions.getActionById(contextId);
		if (!action) return;

		let title = "iRacing\nnot\nconnected";

		if (isConnected && telemetry) {
			const gear = telemetry.Gear;

			if (gear !== null && gear !== undefined && typeof gear === 'number') {
				// Display gear: -1 = R, 0 = N, 1+ = gear number
				if (gear === -1) {
					title = "R";
				} else if (gear === 0) {
					title = "N";
				} else {
					title = gear.toString();
				}
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
