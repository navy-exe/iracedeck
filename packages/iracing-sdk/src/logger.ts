/**
 * Logger interface for the iRacing SDK
 *
 * This allows the SDK to be used with any logging implementation.
 * By default, logs to console. Can be replaced with a custom logger.
 */

export interface Logger {
    debug(message: string): void;
    info(message: string): void;
    warn(message: string): void;
    error(message: string): void;
}

/**
 * Default console logger implementation
 */
export const consoleLogger: Logger = {
    debug: (message: string) => console.debug(message),
    info: (message: string) => console.info(message),
    warn: (message: string) => console.warn(message),
    error: (message: string) => console.error(message),
};

/**
 * Silent logger that discards all messages
 */
export const silentLogger: Logger = {
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
};

/**
 * Current logger instance - can be replaced via setLogger()
 */
let currentLogger: Logger = consoleLogger;

/**
 * Set the logger implementation for the SDK
 * @param logger Logger implementation to use
 */
export function setLogger(logger: Logger): void {
    currentLogger = logger;
}

/**
 * Get the current logger instance
 */
export function getLogger(): Logger {
    return currentLogger;
}
