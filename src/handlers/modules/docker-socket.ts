import { Readable, type Transform } from "node:stream";
import split2 from "split2";
import { dbFunctions } from "~/core/database";
import { getDockerClient } from "~/core/docker/client";
import {
	calculateCpuPercent,
	calculateMemoryUsage,
} from "~/core/utils/calculations";
import { logger } from "~/core/utils/logger";
import type { DockerStatsEvent } from "~/typings/docker";

export function createDockerStatsStream(): Readable {
	const stream = new Readable({
		objectMode: true,
		read() {},
	});

	const substreams: Array<{
		statsStream: Readable;
		splitStream: Transform;
	}> = [];

	const cleanup = () => {
		for (const { statsStream, splitStream } of substreams) {
			try {
				statsStream.unpipe(splitStream);
				statsStream.destroy();
				splitStream.destroy();
			} catch (error) {
				logger.error(`Cleanup error: ${error}`);
			}
		}
		substreams.length = 0;
	};

	stream.on("close", cleanup);
	stream.on("error", cleanup);

	(async () => {
		try {
			const hosts = dbFunctions.getDockerHosts();
			logger.debug(`Retrieved ${hosts.length} docker host(s)`);

			for (const host of hosts) {
				if (stream.destroyed) break;

				try {
					const docker = getDockerClient(host);
					await docker.ping();
					const containers = await docker.listContainers({
						all: true,
					});

					logger.debug(
						`Found ${containers.length} containers on ${host.name} (id: ${host.id})`,
					);

					for (const containerInfo of containers) {
						if (stream.destroyed) break;

						try {
							const container = docker.getContainer(containerInfo.Id);
							const statsStream = (await container.stats({
								stream: true,
							})) as Readable;
							const splitStream = split2();

							substreams.push({ statsStream, splitStream });

							statsStream
								.on("close", () => splitStream.destroy())
								.pipe(splitStream)
								.on("data", (line: string) => {
									if (stream.destroyed || !line) return;

									try {
										const stats = JSON.parse(line);
										const event: DockerStatsEvent = {
											type: "stats",
											id: containerInfo.Id,
											hostId: host.id,
											name: containerInfo.Names[0].replace(/^\//, ""),
											image: containerInfo.Image,
											status: containerInfo.Status,
											state: containerInfo.State,
											cpuUsage: calculateCpuPercent(stats) ?? 0,
											memoryUsage: calculateMemoryUsage(stats) ?? 0,
										};
										stream.push(event);
									} catch (error) {
										stream.push({
											type: "error",
											hostId: host.id,
											containerId: containerInfo.Id,
											error: `Parse error: ${
												error instanceof Error ? error.message : String(error)
											}`,
										});
									}
								})
								.on("error", (error: Error) => {
									stream.push({
										type: "error",
										hostId: host.id,
										containerId: containerInfo.Id,
										error: `Stream error: ${error.message}`,
									});
								});
						} catch (error) {
							stream.push({
								type: "error",
								hostId: host.id,
								containerId: containerInfo.Id,
								error: `Container error: ${
									error instanceof Error ? error.message : String(error)
								}`,
							});
						}
					}
				} catch (error) {
					stream.push({
						type: "error",
						hostId: host.id,
						error: `Host connection error: ${
							error instanceof Error ? error.message : String(error)
						}`,
					});
				}
			}
		} catch (error) {
			stream.push({
				type: "error",
				error: `Initialization error: ${
					error instanceof Error ? error.message : String(error)
				}`,
			});
			stream.destroy();
		}
	})();

	return stream;
}
