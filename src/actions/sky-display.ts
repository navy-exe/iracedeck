import streamDeck, { action, SingletonAction, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";
import { SDKController } from "../iracing/sdk-controller";
import { TelemetryData, Skies } from "../iracing/types";

/**
 * Sky Display Action
 * Displays current sky conditions from iRacing telemetry
 */
@action({ UUID: "fi.lampen.niklas.iracedeck.sky" })
export class SkyDisplay extends SingletonAction {
	private sdkController = SDKController.getInstance();
	private lastState = new Map<string, string>();

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
		this.lastState.delete(ev.action.id);
	}

	/**
	 * Get the display name for a sky condition
	 */
	private getSkyName(skies: number): string {
		switch (skies) {
			case Skies.Clear:
				return "Clear";
			case Skies.PartlyCloudy:
				return "Partly\nCloudy";
			case Skies.MostlyCloudy:
				return "Mostly\nCloudy";
			case Skies.Overcast:
				return "Overcast";
			default:
				return "N/A";
		}
	}

	/**
	 * Get the image path for a sky condition
	 */
	private getSkyImage(skies: number): string {
		switch (skies) {
			case Skies.Clear:
				return "imgs/actions/sky/key-clear";
			case Skies.PartlyCloudy:
				return "imgs/actions/sky/key-partly";
			case Skies.MostlyCloudy:
				return "imgs/actions/sky/key-mostly";
			case Skies.Overcast:
				return "imgs/actions/sky/key-overcast";
			default:
				return "imgs/actions/sky/key";
		}
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
		let image = "imgs/actions/sky/key";

		if (isConnected && telemetry) {
			const skies = telemetry.Skies;

			if (skies !== null && skies !== undefined && typeof skies === 'number') {
				title = this.getSkyName(skies);
				image = this.getSkyImage(skies);
			} else {
				title = "N/A";
			}
		}

		// Create a state key combining title and image
		const stateKey = `${title}|${image}`;

		// Only update if the state has changed
		const lastState = this.lastState.get(contextId);
		if (lastState !== stateKey) {
			this.lastState.set(contextId, stateKey);
			await action.setTitle(title);
			await action.setImage(image);
		}
	}
}
