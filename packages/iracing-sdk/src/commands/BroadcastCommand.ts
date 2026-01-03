/**
 * BroadcastCommand - Base class for all iRacing broadcast commands
 *
 * Provides the core messaging functionality that all command classes inherit.
 */

import { registerWindowMessage, sendNotifyMessage, HWND_BROADCAST } from '@iracedeck/iracing-native';
import { getLogger } from '../logger';
import { BroadcastMsg, IRSDK_BROADCAST_MSG_NAME, MAKELONG } from './constants';

/**
 * Base class for iRacing broadcast commands
 */
export abstract class BroadcastCommand {
    protected broadcastMsgID: number;

    protected constructor() {
        this.broadcastMsgID = registerWindowMessage(IRSDK_BROADCAST_MSG_NAME);
    }

    /**
     * Send a raw broadcast message to iRacing
     * @param msg Broadcast message type
     * @param var1 First parameter
     * @param var2 Second parameter (for MAKELONG with var3)
     * @param var3 Third parameter (for MAKELONG with var2)
     */
    protected sendBroadcast(msg: BroadcastMsg, var1: number = 0, var2: number = 0, var3: number = 0): boolean {
        const wParam = MAKELONG(msg, var1);
        const lParam = MAKELONG(var2, var3);
        getLogger().debug(`[BroadcastCommand] Sending: msg=${BroadcastMsg[msg]}, var1=${var1}, var2=${var2}, var3=${var3}`);
        return sendNotifyMessage(HWND_BROADCAST, this.broadcastMsgID, wParam, lParam);
    }
}
