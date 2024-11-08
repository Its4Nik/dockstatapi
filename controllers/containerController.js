import fs from "fs";
import path from "path";
import { getDockerClient } from "../utils/dockerClient.js";
import logger from "../utils/logger.js";

const getContainers = async (req, res) => {
  const host = req.query.host || "local";
  logger.info(`Fetching containers from host: ${host}`);
  try {
    const docker = getDockerClient(host);
    const containers = await docker.listContainers();

    res.status(200).json(containers);
  } catch (err) {
    logger.error(
      `Error fetching containers from host: ${host} - ${err.message || "Unknown error"} - Full error: ${JSON.stringify(err, null, 2)}`,
    );
    res.status(500).json({
      error: `Error fetching containers: ${err.message || "Unknown error"}`,
    });
  }
};

const getContainerStats = async (containerID, containerHost) => {
  logger.info(
    `Fetching stats for container: ${containerID} from host: ${containerHost}`,
  );
  try {
    const docker = getDockerClient(containerHost);
    const container = docker.getContainer(containerID);
    const stats = await container.stats({ stream: false });
    logger.info(
      `Successfully fetched stats for container: ${containerID} from host: ${containerHost}`,
    );
    res.status(200).json(stats);
  } catch (error) {
    logger.error(
      `Error fetching stats for container: ${containerID} from host: ${containerHost} - ${error.message}`,
    );
    res
      .status(500)
      .json({ error: `Error fetching container stats: ${error.message}` });
  }
};

export default {
  getContainers,
  getContainerStats,
};
