import type { containerStatistics } from "~/typings/database";
import { db } from "./database";
import { executeDbOperation } from "./helper";

const insert = db.prepare(`
  INSERT INTO container_stats (id, hostId, name, image, status, state, cpu_usage, memory_usage)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const get = db.prepare("SELECT * FROM container_stats");

export function addContainerStats(
  id: string,
  hostId: string,
  name: string,
  image: string,
  status: string,
  state: string,
  cpu_usage: number,
  memory_usage: number
) {
  return executeDbOperation(
    "Add Container Stats",
    () =>
      insert.run(
        id,
        hostId,
        name,
        image,
        status,
        state,
        cpu_usage,
        memory_usage
      ),
    () => {
      if (
        typeof id !== "string" ||
        typeof hostId !== "string" ||
        typeof cpu_usage !== "number" ||
        typeof memory_usage !== "number"
      ) {
        throw new TypeError("Invalid container stats parameters");
      }
    }
  );
}

export function getContainerStats(): containerStatistics[] {
  return executeDbOperation("Get Container Stats", () =>
    get.all()
  ) as containerStatistics[];
}
