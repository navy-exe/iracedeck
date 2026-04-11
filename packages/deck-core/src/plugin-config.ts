/**
 * Plugin Config Singleton
 *
 * Stores build-time plugin configuration (version, future feature flags).
 * Each plugin process has its own instance.
 *
 * Usage:
 * 1. Call initPluginConfig() once at plugin startup with config read from config.json
 * 2. Import getPluginVersion() wherever the version is needed
 */

export interface PluginConfig {
  version: string;
  platform: string;
}

let config: PluginConfig | null = null;

/**
 * Initialize the plugin config singleton.
 * Should be called once at plugin startup.
 *
 * @param pluginConfig - Config object read from config.json
 * @throws Error if called more than once
 */
export function initPluginConfig(pluginConfig: PluginConfig): void {
  if (config) {
    throw new Error("Plugin config already initialized. initPluginConfig() should only be called once.");
  }

  config = pluginConfig;
}

/**
 * Get the plugin version string (e.g., "1.13.0").
 *
 * @throws Error if initPluginConfig() has not been called
 */
export function getPluginVersion(): string {
  if (!config) {
    throw new Error("Plugin config not initialized. Call initPluginConfig() first.");
  }

  return config.version;
}

/**
 * Get the plugin platform identifier (e.g., "stream-deck", "mirabox").
 *
 * @throws Error if initPluginConfig() has not been called
 */
export function getPluginPlatform(): string {
  if (!config) {
    throw new Error("Plugin config not initialized. Call initPluginConfig() first.");
  }

  return config.platform;
}

/**
 * Check if plugin config has been initialized.
 */
export function isPluginConfigInitialized(): boolean {
  return config !== null;
}

/**
 * Reset the plugin config singleton (for testing only).
 */
export function _resetPluginConfig(): void {
  config = null;
}
