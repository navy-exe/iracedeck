import streamDeck from "@elgato/streamdeck";
import { IRacingSDK, Logger, LogLevel } from "@iracedeck/iracing-sdk";

// Comms actions
import { DoChatMessage } from "./actions/comms/do-chat-message.js";

// We can enable "trace" logging so that all messages between the Stream Deck, and the plugin are recorded. When storing sensitive information
streamDeck.logger.setLevel("trace");

// Map LogLevel enum to Stream Deck logger level strings
const logLevelToString: Record<LogLevel, "trace" | "debug" | "info" | "warn" | "error"> = {
  [LogLevel.Trace]: "trace",
  [LogLevel.Debug]: "debug",
  [LogLevel.Info]: "info",
  [LogLevel.Warn]: "warn",
  [LogLevel.Error]: "error",
  [LogLevel.Silent]: "error",
};

// Create a wrapper to adapt Stream Deck logger to our Logger interface
function createSDLogger(sdLogger: ReturnType<typeof streamDeck.logger.createScope>): Logger {
  const logger: Logger = {
    trace: (msg) => sdLogger.trace(msg),
    debug: (msg) => sdLogger.debug(msg),
    info: (msg) => sdLogger.info(msg),
    warn: (msg) => sdLogger.warn(msg),
    error: (msg) => sdLogger.error(msg),
    setLevel: (level) => {
      sdLogger.setLevel(logLevelToString[level]);
    },
    createScope: (scope) => createSDLogger(sdLogger.createScope(scope)),
  };

  return logger;
}

// Set up loggers for all SDK singletons
IRacingSDK.setLoggers(createSDLogger(streamDeck.logger.createScope("iRacingSDK")));

// Register iRacing actions
streamDeck.actions.registerAction(new DoChatMessage());

// Connect to the Stream Deck
streamDeck.connect();
