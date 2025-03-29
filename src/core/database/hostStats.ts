import { db } from "./database";
import { executeDbOperation } from "./helper";
import type { HostStats } from "~/typings/docker";

const stmt = db.prepare(`
  INSERT INTO host_stats (
    hostId, hostName, dockerVersion, apiVersion, os, architecture,
    totalMemory, totalCPU, labels, containers, containersRunning,
    containersStopped, containersPaused, images
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(hostId) DO UPDATE SET
    dockerVersion = excluded.dockerVersion,
    apiVersion = excluded.apiVersion,
    os = excluded.os,
    architecture = excluded.architecture,
    totalMemory = excluded.totalMemory,
    totalCPU = excluded.totalCPU,
    labels = excluded.labels,
    containers = excluded.containers,
    containersRunning = excluded.containersRunning,
    containersStopped = excluded.containersStopped,
    containersPaused = excluded.containersPaused,
    images = excluded.images
`);

export function updateHostStats(stats: HostStats) {
  return executeDbOperation("Update Host Stats", () =>
    stmt.run(
      stats.hostId,
      stats.hostName,
      stats.dockerVersion,
      stats.apiVersion,
      stats.os,
      stats.architecture,
      stats.totalMemory,
      stats.totalCPU,
      JSON.stringify(stats.labels),
      stats.containers,
      stats.containersRunning,
      stats.containersStopped,
      stats.containersPaused,
      stats.images,
    ),
  );
}
