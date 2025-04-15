import type Docker from "dockerode";

const calculateCpuPercent = (stats: Docker.ContainerStats): number => {
  if (stats == null) {
    return 0.0;
  }

  const cpuDelta =
    stats.cpu_stats.cpu_usage.total_usage -
    stats.precpu_stats.cpu_usage.total_usage;
  const systemDelta =
    stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;

  if (cpuDelta <= 0) {
    return 0;
  }

  if (systemDelta <= 0) {
    return 0;
  }

  const data = (cpuDelta / systemDelta) * 100;

  if (data === null) {
    return 0;
  }

  return data;
};

const calculateMemoryUsage = (stats: Docker.ContainerStats): number => {
  if (stats == null) {
    return 0;
  }

  const data = (stats.memory_stats.usage / stats.memory_stats.limit) * 100;

  if (data === null) {
    return 0;
  }

  return data;
};

export { calculateCpuPercent, calculateMemoryUsage };
