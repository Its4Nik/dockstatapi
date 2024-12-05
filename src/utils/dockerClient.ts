// src/utils/dockerClient.ts
import Docker from "dockerode";
import fs from "fs";
import logger from "./logger";

interface DockerHostConfig {
  name: string;
  url: string;
  port?: number;
}

interface DockerConfig {
  hosts: DockerHostConfig[];
}

function loadDockerConfig(): DockerConfig {
  const configPath = "./src/config/dockerConfig.json";
  try {
    const rawData = fs.readFileSync(configPath, "utf-8");
    logger.debug("Refreshed DockerConfig.json");
    return JSON.parse(rawData) as DockerConfig;
  } catch (error: any) {
    logger.error(
      "Error loading dockerConfig.json: " + (error as Error).message,
    );
    throw new Error("Failed to load Docker configuration");
  }
}

function createDockerClient(hostConfig: DockerHostConfig): Docker {
  logger.info(
    `Creating Docker client for host: ${hostConfig.url} on port: ${hostConfig.port || 2375}`,
  );
  return new Docker({
    host: hostConfig.url,
    port: hostConfig.port || 2375,
    protocol: "http",
  });
}

const getDockerClient = (hostName: string): Docker => {
  logger.debug(`Getting Docker Client for ${hostName}`);
  const config = loadDockerConfig();
  const hostConfig = config.hosts.find((host) => host.name === hostName);

  if (!hostConfig) {
    const errorMsg = `Docker host ${hostName} not found in configuration`;
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }
  return createDockerClient(hostConfig);
};

export default getDockerClient;
