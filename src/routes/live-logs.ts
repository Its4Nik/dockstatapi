import { Elysia } from "elysia";
import type { ElysiaWS } from "elysia/dist/ws";

import { logger } from "~/core/utils/logger";

import type { log_message } from "~/typings/database";

//biome-ignore lint/suspicious/noExplicitAny:
const activeConnections = new Set<ElysiaWS<any>>();

export const liveLogs = new Elysia({ prefix: "/ws" }).ws("/logs", {
	open(ws) {
		activeConnections.add(ws);
		ws.send({
			message: "Connection established",
			level: "info",
			timestamp: new Date().toISOString(),
			file: "live-logs.ts",
			line: 14,
		});
		logger.info(`New Logs WebSocket established (${ws.id})`);
	},
	close(ws) {
		logger.info(`Logs WebSocket closed (${ws.id})`);
		activeConnections.delete(ws);
	},
});

export function logToClients(data: log_message) {
	for (const ws of activeConnections) {
		try {
			ws.send(JSON.stringify(data));
		} catch (error) {
			activeConnections.delete(ws);
			logger.error("Failed to send to WebSocket:", error);
		}
	}
}
