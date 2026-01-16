import streamDeck from "@elgato/streamdeck";
import { createSDLogger, initializeSDK } from "@iracedeck/stream-deck-shared";

// Environment actions
import { DisplaySky } from "./actions/environment/display-sky.js";
// Pit actions
import { DisplayFuelToAdd } from "./actions/pit/display-fuel-to-add.js";
import { DoChangeTires } from "./actions/pit/do-change-tires.js";
import { DoFastRepair } from "./actions/pit/do-fast-repair.js";
import { DoFuelAdd } from "./actions/pit/do-fuel-add.js";
import { DoFuelReduce } from "./actions/pit/do-fuel-reduce.js";
import { DoTireCompound } from "./actions/pit/do-tire-compound.js";
import { DisplayGear } from "./actions/vehicle/display-gear.js";
// Vehicle actions
import { DisplaySpeed } from "./actions/vehicle/display-speed.js";

// Enable trace logging
streamDeck.logger.setLevel("trace");

// Initialize the SDK singleton
initializeSDK(createSDLogger(streamDeck.logger.createScope("iRacingSDK")));

// Register iRacing actions
streamDeck.actions.registerAction(new DisplaySpeed());
streamDeck.actions.registerAction(new DisplayGear());
streamDeck.actions.registerAction(new DisplaySky());
streamDeck.actions.registerAction(new DisplayFuelToAdd());
streamDeck.actions.registerAction(new DoFuelAdd());
streamDeck.actions.registerAction(new DoFuelReduce());
streamDeck.actions.registerAction(new DoTireCompound());
streamDeck.actions.registerAction(new DoChangeTires());
streamDeck.actions.registerAction(new DoFastRepair());

// Connect to the Stream Deck
streamDeck.connect();
