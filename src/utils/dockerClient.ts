import Docker from "dockerode";
import fs from "fs";
import path from "path";
import logger from "./logger.js";

// Function to dynamically load config on each request
function loadDockerConfig() {
  const configPath = "./src/config/dockerConfig.json";
  try {
    const rawData = fs.readFileSync(configPath);
    logger.debug("Refreshed DockerConfig.json");
    return JSON.parse(rawData);
  } catch (error) {
    logger.error("Error loading dockerConfig.json: " + error.message);
    throw new Error("Failed to load Docker configuration");
  }
}

// Function to create the Docker client using separate url and port
function createDockerClient(hostConfig) {
  logger.info(
    `Creating Docker client for host: ${hostConfig.url} on port: ${hostConfig.port}`,
  );
  return new Docker({
    host: hostConfig.url,
    port: hostConfig.port || 2375, // Use 2375 as default port for non-TLS
    protocol: "http", // Ensure the use of http for non-TLS
  });
}

// This function will get the Docker client based on the host configuration
const getDockerClient = (hostName) => {
  logger.debug(`Getting Docker Client for ${hostName}`);
  const config = loadDockerConfig(); // Dynamically load config
  const hostConfig = config.hosts.find((host) => host.name === hostName);

  if (!hostConfig) {
    const errorMsg = `Docker host ${hostName} not found in configuration`;
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }
  return createDockerClient(hostConfig);
};

export default getDockerClient;
