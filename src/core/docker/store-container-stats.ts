import type Docker from "dockerode";
import { dbFunctions } from "~/core/database";
import { getDockerClient } from "~/core/docker/client";
import {
	calculateCpuPercent,
	calculateMemoryUsage,
} from "~/core/utils/calculations";
import type { container_stats } from "~/typings/database";
import { logger } from "../utils/logger";

async function storeContainerData() {
	try {
		const hosts = dbFunctions.getDockerHosts();
		logger.debug("Retrieved docker hosts for storing container data");

		// Process each host concurrently and wait for them all to finish
		await Promise.all(
			hosts.map(async (host) => {
				const docker = getDockerClient(host);

				// Test the connection with a ping
				try {
					await docker.ping();
				} catch (error) {
					const errMsg = error instanceof Error ? error.message : String(error);
					throw new Error(
						`Failed to ping docker host "${host.name}": ${errMsg}`,
					);
				}

				let containers: Docker.ContainerInfo[] = [];
				try {
					containers = await docker.listContainers({ all: true });
				} catch (error) {
					const errMsg = error instanceof Error ? error.message : String(error);
					throw new Error(
						`Failed to list containers on host "${host.name}": ${errMsg}`,
					);
				}

				// Process each container concurrently
				await Promise.all(
					containers.map(async (containerInfo) => {
						const containerName = containerInfo.Names[0].replace(/^\//, "");
						try {
							const container = docker.getContainer(containerInfo.Id);

							const stats: Docker.ContainerStats = await new Promise(
								(resolve, reject) => {
									container.stats({ stream: false }, (error, stats) => {
										if (error) {
											const errMsg =
												error instanceof Error ? error.message : String(error);
											return reject(
												new Error(
													`Failed to get stats for container "${containerName}" (ID: ${containerInfo.Id}) on host "${host.name}": ${errMsg}`,
												),
											);
										}
										if (!stats) {
											return reject(
												new Error(
													`No stats returned for container "${containerName}" (ID: ${containerInfo.Id}) on host "${host.name}".`,
												),
											);
										}
										resolve(stats);
									});
								},
							);

							const parsed: container_stats = {
								cpu_usage: calculateCpuPercent(stats),
								hostId: host.id,
								id: containerInfo.Id,
								image: containerInfo.Image,
								memory_usage: calculateMemoryUsage(stats),
								name: containerName,
								state: containerInfo.State,
								status: containerInfo.Status,
							};

							dbFunctions.addContainerStats(parsed);
						} catch (error) {
							const errMsg =
								error instanceof Error ? error.message : String(error);
							throw new Error(
								`Error processing container "${containerName}" (ID: ${containerInfo.Id}) on host "${host.name}": ${errMsg}`,
							);
						}
					}),
				);
			}),
		);
	} catch (error) {
		const errMsg = error instanceof Error ? error.message : String(error);
		throw new Error(`Failed to store container data: ${errMsg}`);
	}
}

export default storeContainerData;
