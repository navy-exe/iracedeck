/**
 * VSDinside WebSocket Client
 *
 * Implements the VSD Craft plugin WebSocket protocol directly in TypeScript.
 * The VSD protocol is similar to Elgato's: connect to ws://127.0.0.1:{port},
 * send a registration message, then exchange JSON events.
 *
 * VSD Craft passes connection parameters via process.argv:
 *   argv[3] = port
 *   argv[5] = plugin UUID
 *   argv[7] = register event name
 *   argv[9] = JSON info (includes application.language)
 */
import type { ILogger } from "@iracedeck/logger";
import { silentLogger } from "@iracedeck/logger";
import { type WebSocket as WSType } from "ws";

/**
 * Event data received from VSD Craft via WebSocket.
 */
export interface VSDEvent {
  event: string;
  action?: string;
  context?: string;
  payload?: {
    settings?: Record<string, unknown>;
    ticks?: number;
    coordinates?: { column: number; row: number };
    controller?: string;
    [key: string]: unknown;
  };
}

/**
 * Callback type for VSD event handlers.
 */
export type VSDEventHandler = (data: VSDEvent) => void;

/**
 * Registration for a per-action event handler.
 */
interface ActionEventRegistration {
  uuid: string;
  event: string;
  handler: VSDEventHandler;
}

/**
 * Low-level WebSocket client for the VSD Craft plugin protocol.
 * Handles connection, registration, event routing, and outbound commands.
 */
export class VSDClient {
  private ws: WSType | null = null;
  private readonly port: string;
  private readonly pluginUuid: string;
  private readonly registerEvent: string;
  private readonly actionHandlers: ActionEventRegistration[] = [];
  private readonly globalHandlers = new Map<string, VSDEventHandler[]>();
  private logger: ILogger;
  private globalSettingsRequested = false;

  constructor(logger: ILogger = silentLogger) {
    this.logger = logger;
    this.port = process.argv[3] ?? "";
    this.pluginUuid = process.argv[5] ?? "";
    this.registerEvent = process.argv[7] ?? "";
  }

  /**
   * Register a handler for a specific action UUID and event type.
   */
  onActionEvent(uuid: string, event: string, handler: VSDEventHandler): void {
    this.actionHandlers.push({ uuid, event, handler });
  }

  /**
   * Register a handler for a global (non-action) event.
   */
  onGlobalEvent(event: string, handler: VSDEventHandler): void {
    const handlers = this.globalHandlers.get(event) ?? [];
    handlers.push(handler);
    this.globalHandlers.set(event, handlers);
  }

  /**
   * Connect to VSD Craft and start receiving events.
   */
  async connect(): Promise<void> {
    if (!this.port) {
      this.logger.error("No port provided in process.argv[3] — cannot connect to VSD Craft");

      return;
    }

    this.logger.info("Connecting to VSD Craft");
    this.logger.debug(`WebSocket port: ${this.port}, UUID: ${this.pluginUuid}`);

    // Dynamic import to avoid bundling issues with native CommonJS module
    const { WebSocket } = await import("ws");
    this.ws = new WebSocket(`ws://127.0.0.1:${this.port}`);

    this.ws.on("open", () => {
      this.logger.info("Connected to VSD Craft");
      this.send({ uuid: this.pluginUuid, event: this.registerEvent });

      // Request global settings once on first connection
      if (!this.globalSettingsRequested) {
        this.globalSettingsRequested = true;
        this.requestGlobalSettings();
      }
    });

    this.ws.on("message", (raw: Buffer | string) => {
      try {
        const data = JSON.parse(raw.toString()) as VSDEvent;
        this.routeEvent(data);
      } catch (error) {
        this.logger.error(`Failed to parse WebSocket message: ${error}`);
      }
    });

    this.ws.on("close", () => {
      this.logger.info("Disconnected from VSD Craft");
      process.exit(0);
    });

    this.ws.on("error", (error: Error) => {
      this.logger.error(`WebSocket error: ${error.message}`);
    });
  }

  /**
   * Route an incoming event to the appropriate handler(s).
   */
  private routeEvent(data: VSDEvent): void {
    const { event, action } = data;

    // Route to action-specific handlers
    if (action) {
      for (const reg of this.actionHandlers) {
        if (reg.uuid === action && reg.event === event) {
          reg.handler(data);
        }
      }
    }

    // Route to global event handlers
    const globalHandlers = this.globalHandlers.get(event);

    if (globalHandlers) {
      for (const handler of globalHandlers) {
        handler(data);
      }
    }
  }

  /**
   * Send a JSON message to VSD Craft.
   */
  private send(message: Record<string, unknown>): void {
    if (this.ws?.readyState === 1 /* WebSocket.OPEN */) {
      this.ws.send(JSON.stringify(message));
    }
  }

  // --- Outbound commands ---

  setImage(context: string, dataUri: string): void {
    this.send({
      event: "setImage",
      context,
      payload: { target: 0, image: dataUri },
    });
  }

  setTitle(context: string, title: string): void {
    this.send({
      event: "setTitle",
      context,
      payload: { target: 0, title },
    });
  }

  setSettings(context: string, payload: Record<string, unknown>): void {
    this.send({
      event: "setSettings",
      context,
      payload,
    });
  }

  setGlobalSettings(payload: Record<string, unknown>): void {
    this.send({
      event: "setGlobalSettings",
      context: this.pluginUuid,
      payload,
    });
  }

  requestGlobalSettings(): void {
    this.send({
      event: "getGlobalSettings",
      context: this.pluginUuid,
    });
  }

  showAlert(context: string): void {
    this.send({ event: "showAlert", context });
  }

  showOk(context: string): void {
    this.send({ event: "showOk", context });
  }

  openUrl(url: string): void {
    this.send({
      event: "openUrl",
      payload: { url },
    });
  }
}
