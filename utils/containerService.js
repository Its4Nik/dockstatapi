const config = require("../config/dockerConfig.json");
const logger = require("./logger");
const { getDockerClient } = require("./dockerClient");

async function fetchAllContainers() {
  const allContainerData = {};

  for (const hostConfig of config.hosts) {
    const hostName = hostConfig.name;
    try {
      const docker = getDockerClient(hostName);
      const containers = await docker.listContainers({ all: true });

      allContainerData[hostName] = await Promise.all(
        containers.map(async (container) => {
          const containerInfo = await docker
            .getContainer(container.Id)
            .inspect();
          const containerStats = await docker
            .getContainer(container.Id)
            .stats({ stream: false });
          const cpuDelta =
            containerStats.cpu_stats.cpu_usage.total_usage -
            containerStats.precpu_stats.cpu_usage.total_usage;
          const systemCpuDelta =
            containerStats.cpu_stats.system_cpu_usage -
            containerStats.precpu_stats.system_cpu_usage;
          const cpuUsage =
            systemCpuDelta > 0
              ? (cpuDelta / systemCpuDelta) *
                containerStats.cpu_stats.online_cpus
              : 0;

          return {
            name: container.Names[0].replace("/", ""),
            id: container.Id,
            hostName: hostName,
            state: container.State,
            cpu_usage: cpuUsage * 1000000000,
            mem_usage: containerStats.memory_stats.usage,
            mem_limit: containerStats.memory_stats.limit,
            net_rx: containerStats.networks?.eth0?.rx_bytes || 0,
            net_tx: containerStats.networks?.eth0?.tx_bytes || 0,
            current_net_rx: containerStats.networks?.eth0?.rx_bytes || 0,
            current_net_tx: containerStats.networks?.eth0?.tx_bytes || 0,
            networkMode: containerInfo.HostConfig.NetworkMode,
          };
        }),
      );
    } catch (error) {
      logger.error(
        `Error fetching containers for host: ${hostName} - ${error.message}`,
      );
      allContainerData[hostName] = {
        error: `Error fetching containers: ${error.message}`,
      };
    }
  }

  return allContainerData;
}

module.exports = { fetchAllContainers };
