import { db } from "./database";
import { executeDbOperation } from "./helper";

const stmt = db.prepare(`
  INSERT INTO container_stats (id, hostId, name, image, status, state, cpu_usage, memory_usage)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

export function addContainerStats(
  id: string,
  hostId: string,
  name: string,
  image: string,
  status: string,
  state: string,
  cpu_usage: number,
  memory_usage: number,
) {
  return executeDbOperation(
    "Add Container Stats",
    () =>
      stmt.run(id, hostId, name, image, status, state, cpu_usage, memory_usage),
    () => {
      if (
        typeof id !== "string" ||
        typeof hostId !== "string" ||
        typeof cpu_usage !== "number" ||
        typeof memory_usage !== "number"
      ) {
        throw new TypeError("Invalid container stats parameters");
      }
    },
  );
}
