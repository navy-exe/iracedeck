import streamDeck from "@elgato/streamdeck";

import { SpeedDisplay } from "./actions/speed-display";
import { GearDisplay } from "./actions/gear-display";

// We can enable "trace" logging so that all messages between the Stream Deck, and the plugin are recorded. When storing sensitive information
streamDeck.logger.setLevel("trace");

// Register iRacing actions
streamDeck.actions.registerAction(new SpeedDisplay());
streamDeck.actions.registerAction(new GearDisplay());

// Finally, connect to the Stream Deck.
streamDeck.connect();
