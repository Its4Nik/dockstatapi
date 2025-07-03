import { serve } from "bun";
import split2 from "split2";
import { dbFunctions } from "~/core/database";
import { getDockerClient } from "~/core/docker/client";
import {
	calculateCpuPercent,
	calculateMemoryUsage,
} from "~/core/utils/calculations";
import { logger } from "~/core/utils/logger";
import type { DockerStatsEvent } from "~/typings/docker";

// Track all connected WebSocket clients
const clients = new Set<Bun.ServerWebSocket<unknown>>();

// Broadcast a DockerStatsEvent to every connected client
function broadcast(event: DockerStatsEvent) {
	const message = JSON.stringify(event);
	for (const ws of clients) {
		if (ws.readyState === 1) {
			ws.send(message);
		}
	}
}

// Start Docker stats polling and broadcasting
export async function startDockerStatsBroadcast() {
	logger.debug("Starting Docker stats broadcast...");

	try {
		const hosts = dbFunctions.getDockerHosts();
		logger.debug(`Retrieved ${hosts.length} Docker host(s)`);

		for (const host of hosts) {
			try {
				const docker = getDockerClient(host);
				await docker.ping();
				const containers = await docker.listContainers({ all: true });
				logger.debug(
					`Host ${host.name} contains ${containers.length} containers`,
				);

				for (const info of containers) {
					// Kick off one independent async task per container
					(async () => {
						try {
							const statsStream = await docker
								.getContainer(info.Id)
								.stats({ stream: true });
							const splitter = split2();
							statsStream.pipe(splitter);

							for await (const line of splitter) {
								if (!line) continue;
								try {
									const stats = JSON.parse(line);
									broadcast({
										type: "stats",
										id: info.Id,
										hostId: host.id,
										name: info.Names[0].replace(/^\//, ""),
										image: info.Image,
										status: info.Status,
										state: stats.state || info.State,
										cpuUsage: calculateCpuPercent(stats) ?? 0,
										memoryUsage: calculateMemoryUsage(stats) ?? 0,
									});
								} catch (err) {
									broadcast({
										type: "error",
										hostId: host.id,
										containerId: info.Id,
										error: `Parse error: ${(err as Error).message}`,
									});
								}
							}
						} catch (err) {
							broadcast({
								type: "error",
								hostId: host.id,
								containerId: info.Id,
								error: `Stats stream error: ${(err as Error).message}`,
							});
						}
					})();
				}
			} catch (err) {
				broadcast({
					type: "error",
					hostId: host.id,
					error: `Host connection error: ${(err as Error).message}`,
				});
			}
		}
	} catch (err) {
		broadcast({
			type: "error",
			hostId: 0,
			error: `Initialization error: ${(err as Error).message}`,
		});
	}
}

serve({
	port: 4837,
	reusePort: true,
	fetch(req, server) {
		// Upgrade requests to WebSocket
		if (req.url.endsWith("/ws/docker")) {
			if (server.upgrade(req)) {
				return; // auto 101 Switching Protocols
			}
		}
		return new Response("Expected WebSocket upgrade", { status: 426 });
	},

	websocket: {
		open(ws) {
			logger.debug("Client connected via WebSocket");
			clients.add(ws);
		},
		close(ws, code, reason) {
			logger.debug(`Client disconnected (${code}): ${reason}`);
			clients.delete(ws);
		},
		message() {},
	},
});
