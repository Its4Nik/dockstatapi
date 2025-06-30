import type { container_stats } from "~/typings/database";
import { db } from "./database";
import { executeDbOperation } from "./helper";

const insert = db.prepare(`
  INSERT INTO container_stats (id, hostId, name, image, status, state, cpu_usage, memory_usage)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const get = db.prepare("SELECT * FROM container_stats");

export function addContainerStats(stats: container_stats) {
	return executeDbOperation(
		"Add Container Stats",
		() =>
			insert.run(
				stats.id,
				stats.hostId,
				stats.name,
				stats.image,
				stats.status,
				stats.state,
				stats.cpu_usage,
				stats.memory_usage,
			),
		() => {
			if (
				typeof stats.id !== "string" ||
				typeof stats.hostId !== "number" ||
				typeof stats.cpu_usage !== "number" ||
				typeof stats.memory_usage !== "number"
			) {
				throw new TypeError("Invalid container stats parameters");
			}
		},
	);
}

export function getContainerStats(): container_stats[] {
	return executeDbOperation("Get Container Stats", () =>
		get.all(),
	) as container_stats[];
}
