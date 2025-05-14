import { Elysia } from "elysia";
import type { ElysiaWS } from "elysia/dist/ws";
import { logger } from "~/core/utils/logger";
import type { stackSocketMessage } from "~/typings/websocket";

//biome-ignore lint/suspicious/noExplicitAny: Any = Connections
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
	for (const ws of activeConnections) {
		try {
			ws.send(JSON.stringify(data));
		} catch (error) {
			activeConnections.delete(ws);
			logger.error("Failed to send to WebSocket:", error);
		}
	}
}
