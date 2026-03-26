import { getSuiClient } from "./client.js";
import { config } from "../config.js";
import { logger } from "../utils/logger.js";
import type { GhostActivationEvent, GhostQueryEvent } from "./types.js";

type EventCallback<T> = (event: T) => void;

const activationListeners: EventCallback<GhostActivationEvent>[] = [];
const queryListeners: EventCallback<GhostQueryEvent>[] = [];

let pollingActive = false;
let lastCursor: string | null = null;

export function onGhostActivation(cb: EventCallback<GhostActivationEvent>) {
  activationListeners.push(cb);
}

export function onGhostQuery(cb: EventCallback<GhostQueryEvent>) {
  queryListeners.push(cb);
}

export async function startEventPolling(): Promise<void> {
  if (!config.sui.ghostPackageId) {
    logger.warn("GHOST_PACKAGE_ID not set — event polling disabled");
    return;
  }

  pollingActive = true;
  logger.info("Starting GHOST event polling");

  const poll = async () => {
    if (!pollingActive) return;

    try {
      const client = getSuiClient();
      const activationType = `${config.sui.ghostPackageId}::ghost_terminal::GhostActivation`;

      const result = await client.queryEvents({
        query: { MoveEventType: activationType },
        cursor: lastCursor ?? undefined,
        limit: 50,
        order: "ascending",
      });

      for (const item of result.data) {
        const parsed = item.parsedJson as any;
        if (!parsed) continue;

        const event: GhostActivationEvent = {
          terminalId: parsed.terminal_id,
          player: parsed.player,
          timestamp: Number(parsed.timestamp),
          activationType: Number(parsed.activation_type),
        };

        for (const listener of activationListeners) {
          try {
            listener(event);
          } catch (err) {
            logger.error({ err }, "Activation listener error");
          }
        }
      }

      if (result.nextCursor) {
        lastCursor = result.nextCursor;
      }
    } catch (err) {
      logger.debug({ err }, "Event poll cycle failed (will retry)");
    }

    setTimeout(poll, config.pollingIntervalMs);
  };

  poll();
}

export function stopEventPolling(): void {
  pollingActive = false;
}
