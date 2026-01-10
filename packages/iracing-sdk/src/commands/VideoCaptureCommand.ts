/**
 * VideoCaptureCommand - Video capture commands for iRacing
 */
import { ILogger } from "@iracedeck/logger";

import type { INativeSDK } from "../interfaces.js";
import { BroadcastCommand } from "./BroadcastCommand.js";
import { BroadcastMsg, VideoCaptureMode } from "./constants.js";

/**
 * Video capture commands
 */
export class VideoCaptureCommand extends BroadcastCommand {
  constructor(native: INativeSDK, logger?: ILogger) {
    super(native, logger);
  }

  /**
   * Take a screenshot
   */
  screenshot(): boolean {
    this.logger.info("Screenshot");

    return this.sendBroadcast(BroadcastMsg.VideoCapture, VideoCaptureMode.TriggerScreenShot);
  }

  /**
   * Start video capture
   */
  start(): boolean {
    this.logger.info("Start");

    return this.sendBroadcast(BroadcastMsg.VideoCapture, VideoCaptureMode.StartVideoCapture);
  }

  /**
   * Stop video capture
   */
  stop(): boolean {
    this.logger.info("Stop");

    return this.sendBroadcast(BroadcastMsg.VideoCapture, VideoCaptureMode.EndVideoCapture);
  }

  /**
   * Toggle video capture on/off
   */
  toggle(): boolean {
    this.logger.info("Toggle");

    return this.sendBroadcast(BroadcastMsg.VideoCapture, VideoCaptureMode.ToggleVideoCapture);
  }

  /**
   * Show video timer in upper left corner
   */
  showTimer(): boolean {
    this.logger.info("Show timer");

    return this.sendBroadcast(BroadcastMsg.VideoCapture, VideoCaptureMode.ShowVideoTimer);
  }

  /**
   * Hide video timer
   */
  hideTimer(): boolean {
    this.logger.info("Hide timer");

    return this.sendBroadcast(BroadcastMsg.VideoCapture, VideoCaptureMode.HideVideoTimer);
  }
}
