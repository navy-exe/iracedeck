import streamDeck from "@elgato/streamdeck";
import { createSDLogger, initializeKeyboard, initializeSDK } from "@iracedeck/stream-deck-shared";

import { DoHotkey } from "./actions/do-hotkey.js";
import { DoIRacingHotkey } from "./actions/do-iracing-hotkey.js";

// Enable trace logging
streamDeck.logger.setLevel("trace");

// Initialize the SDK singleton
initializeSDK(createSDLogger(streamDeck.logger.createScope("iRacingSDK")));

// Initialize the keyboard service
initializeKeyboard(createSDLogger(streamDeck.logger.createScope("Keyboard")));

// Register hotkey actions
streamDeck.actions.registerAction(new DoHotkey());
streamDeck.actions.registerAction(new DoIRacingHotkey());

// Connect to the Stream Deck
streamDeck.connect();
