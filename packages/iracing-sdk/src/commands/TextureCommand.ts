/**
 * TextureCommand - Texture reload commands for iRacing
 */
import { ILogger } from "@iracedeck/logger";

import type { INativeSDK } from "../interfaces.js";
import { BroadcastCommand } from "./BroadcastCommand.js";
import { BroadcastMsg, ReloadTexturesMode } from "./constants.js";

/**
 * Texture reload commands
 */
export class TextureCommand extends BroadcastCommand {
  constructor(native: INativeSDK, logger?: ILogger) {
    super(native, logger);
  }

  /**
   * Reload all textures
   */
  reloadAll(): boolean {
    this.logger.info("Reload all");

    return this.sendBroadcast(BroadcastMsg.ReloadTextures, ReloadTexturesMode.All);
  }

  /**
   * Reload textures for a specific car
   * @param carIdx Car index
   */
  reloadCar(carIdx: number): boolean {
    this.logger.info(`Reload car: ${carIdx}`);

    return this.sendBroadcast(BroadcastMsg.ReloadTextures, ReloadTexturesMode.CarIdx, carIdx);
  }
}
