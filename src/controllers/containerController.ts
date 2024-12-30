import getDockerClient from "../utils/dockerClient";
import logger from "../utils/logger";
import { Request, Response } from "express";

const getContainers = async (req: Request, res: Response): Promise<void> => {
  const host: string = (req.query.host as string) || "local";
  logger.info(`Fetching containers from host: ${host}`);
  try {
    const docker = getDockerClient(host);
    const containers = await docker.listContainers();

    res.status(200).json(containers);
  } catch (error: unknown) {
    logger.error(
      `Error fetching containers from host: ${host} - ${(error as Error).message || "Unknown error"} - Full error: ${JSON.stringify(error, null, 2)}`,
    );
    res.status(500).json({
      error: `Error fetching containers: ${(error as Error).message || "Unknown error"}`,
    });
  }
};

const getContainerStats = async (
  containerID: string,
  containerHost: string,
  res: Response,
): Promise<void> => {
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
  } catch (error: unknown) {
    logger.error(
      `Error fetching stats for container: ${containerID} from host: ${containerHost} - ${(error as Error).message}`,
    );
    res.status(500).json({
      error: `Error fetching container stats: ${(error as Error).message}`,
    });
  }
};

export default {
  getContainers,
  getContainerStats,
};
