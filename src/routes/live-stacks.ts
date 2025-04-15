import { Elysia } from "elysia";
import type { ElysiaWS } from "elysia/dist/ws";

import { logger } from "~/core/utils/logger";
import { stackSocketMessage } from "~/typings/websocket";

const activeConnections = new Set<ElysiaWS<any>>();

export const liveStacks = new Elysia().ws("/stacks", {
  open(ws) {
    activeConnections.add(ws);
    ws.send({ message: "Connection established" });
    logger.info(`New Stacks WebSocket established (${ws.id})`);
  },
  close(ws) {
    logger.info(`Stacks WebSocket closed (${ws.id})`);
    activeConnections.delete(ws);
  },
});

export function postToClient(data: stackSocketMessage) {
  activeConnections.forEach((ws) => {
    try {
      ws.send(JSON.stringify(data));
    } catch (error) {
      activeConnections.delete(ws);
      logger.error("Failed to send to WebSocket:", error);
    }
  });
}
