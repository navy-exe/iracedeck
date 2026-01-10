import streamDeck from "@elgato/streamdeck";
import { createSDK, ILogger, LogLevel } from "@iracedeck/iracing-sdk";

// Comms actions
import { DoChatMessage } from "./actions/comms/do-chat-message.js";

// Enable trace logging
streamDeck.logger.setLevel("trace");

// Create a wrapper to adapt Stream Deck logger to our ILogger interface
function createSDLogger(
  sdLogger: ReturnType<typeof streamDeck.logger.createScope>,
  level: LogLevel = LogLevel.Info,
): ILogger {
  return {
    trace: (msg: string) => {
      if (level <= LogLevel.Trace) sdLogger.trace(msg);
    },
    debug: (msg: string) => {
      if (level <= LogLevel.Debug) sdLogger.debug(msg);
    },
    info: (msg: string) => {
      if (level <= LogLevel.Info) sdLogger.info(msg);
    },
    warn: (msg: string) => {
      if (level <= LogLevel.Warn) sdLogger.warn(msg);
    },
    error: (msg: string) => {
      if (level <= LogLevel.Error) sdLogger.error(msg);
    },
    withLevel: (newLevel: LogLevel) => createSDLogger(sdLogger, newLevel),
    createScope: (scope: string) => createSDLogger(sdLogger.createScope(scope), level),
  };
}

// Create SDK with all components wired together
const { controller, commands } = createSDK(createSDLogger(streamDeck.logger.createScope("iRacingSDK")));

// Export for use in actions
export { controller, commands };

// Register iRacing actions
streamDeck.actions.registerAction(new DoChatMessage());

// Connect to the Stream Deck
streamDeck.connect();
