import extractRelevantData from "../../utils/extractHostData";
import { Router, Request, Response } from "express";
import { writeOfflineLog, readOfflineLog } from "../../utils/writeOfflineLog";
import getDockerClient from "../../utils/dockerClient";
import fetchAllContainers from "../../utils/containerService";
import { getCurrentSchedule } from "../../controllers/scheduler";
import logger from "../../utils/logger";
import fs from "fs";
import checkReachability from "../../utils/connectionChecker";
const configPath = "./src/data/dockerConfig.json";
const router = Router();

/**
 * @swagger
 * /api/hosts:
 *   get:
 *     summary: Retrieve a list of all available Docker hosts
 *     tags: [Hosts]
 *     responses:
 *       200:
 *         description: A JSON object containing an array of host names.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hosts:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["local", "remote1"]
 */
router.get("/hosts", (req: Request, res: Response) => {
  logger.info(`Fetching config: ${configPath}`);
  try {
    const rawData = fs.readFileSync(configPath, "utf-8");
    const config = JSON.parse(rawData);

    if (!config.hosts) {
      throw new Error("No hosts defined in configuration.");
    }

    const hosts = config.hosts.map((host: any) => host.name);
    logger.debug("Fetching all available Docker hosts");
    res.status(200).json({ hosts });
  } catch (error: any) {
    logger.error("Error fetching hosts: " + error.message);
    res.status(500).json({ error: "Failed to fetch Docker hosts" });
  }
});

/**
 * @swagger
 * /api/host/{hostName}/stats:
 *   get:
 *     summary: Retrieve statistics for a specified Docker host
 *     tags: [Hosts]
 *     parameters:
 *       - name: hostName
 *         in: path
 *         required: true
 *         description: The name of the host for which to fetch statistics.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A JSON object containing relevant statistics for the specified host.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hostName:
 *                   type: string
 *                   description: The name of the Docker host.
 *                 info:
 *                   type: object
 *                   description: Information about the Docker host (e.g., storage, running containers).
 *                 version:
 *                   type: object
 *                   description: Version details of the Docker installation on the host.
 *       500:
 *         description: An error occurred while fetching host statistics.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message detailing the issue encountered.
 */
router.get("/host/:hostName/stats", async (req: Request, res: Response) => {
  const hostName = req.params.hostName;
  logger.info(`Fetching stats for host: ${hostName}`);
  if (process.env.OFFLINE === "true") {
    logger.info("Fetching offline Host Stats");
    res.status(200).json(readOfflineLog);
  } else {
    try {
      const docker = getDockerClient(hostName);
      const info = await docker.info();
      const version = await docker.version();
      const relevantData = extractRelevantData({ hostName, info, version });

      writeOfflineLog(JSON.stringify(relevantData));
      res.status(200).json(relevantData);
    } catch (error: any) {
      logger.error(
        `Error fetching stats for host: ${hostName} - ${error.message || "Unknown error"}`,
      );
      res.status(500).json({
        error: `Error fetching host stats: ${error.message || "Unknown error"}`,
      });
    }
  }
});

/**
 * @swagger
 * /api/containers:
 *   get:
 *     summary: Retrieve all Docker containers across all configured hosts
 *     tags: [Containers]
 *     responses:
 *       200:
 *         description: A JSON object containing container data for all hosts.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: Name of the container.
 *                   id:
 *                     type: string
 *                     description: Unique identifier for the container.
 *                   hostName:
 *                     type: string
 *                     description: The host on which the container is running.
 *                   state:
 *                     type: string
 *                     description: Current state of the container (e.g., running, exited).
 *                   cpu_usage:
 *                     type: number
 *                     format: double
 *                     description: CPU usage in nanoseconds.
 *                   mem_usage:
 *                     type: number
 *                     description: Memory usage in bytes.
 *                   mem_limit:
 *                     type: number
 *                     description: Memory limit in bytes.
 *                   net_rx:
 *                     type: number
 *                     description: Total received bytes over the network.
 *                   net_tx:
 *                     type: number
 *                     description: Total transmitted bytes over the network.
 *                   current_net_rx:
 *                     type: number
 *                     description: Current received bytes over the network.
 *                   current_net_tx:
 *                     type: number
 *                     description: Current transmitted bytes over the network.
 *                   networkMode:
 *                     type: string
 *                     description: Network mode configured for the container.
 *                   link:
 *                     type: string
 *                     description: Optional link to additional information.
 *                   icon:
 *                     type: string
 *                     description: Optional icon representing the container.
 *                   tags:
 *                     type: string
 *                     description: Optional tags associated with the container.
 *       500:
 *         description: An error occurred while fetching container data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message detailing the issue encountered.
 */
router.get("/containers", async (req: Request, res: Response) => {
  logger.info("Fetching all containers across all hosts");
  try {
    const allContainerData = await fetchAllContainers();
    logger.debug("Fetched /api/containers");
    res.status(200).json(allContainerData);
  } catch (error: any) {
    logger.error(`Error fetching containers: ${error.message}`);
    res.status(500).json({ error: "Failed to fetch containers" });
  }
});

/**
 * @swagger
 * /api/config:
 *   get:
 *     summary: Retrieve Docker configuration
 *     tags: [Configuration]
 *     responses:
 *       200:
 *         description: A JSON object containing the Docker configuration.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: true
 *       500:
 *         description: An error occurred while loading the Docker configuration.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message detailing the issue encountered.
 */
router.get("/config", async (req: Request, res: Response) => {
  try {
    const rawData = fs.readFileSync(configPath);
    const jsonData = JSON.parse(rawData.toString());
    logger.debug("Fetching /api/config");
    res.status(200).json(jsonData);
  } catch (error: any) {
    logger.error("Error loading dockerConfig.json: " + error.message);
    res.status(500).json({ error: "Failed to load Docker configuration" });
  }
});

/**
 * @swagger
 * /api/current-schedule:
 *   get:
 *     summary: Get the current fetch schedule in seconds
 *     tags: [Configuration]
 *     responses:
 *       200:
 *         description: Current fetch schedule retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 interval:
 *                   type: integer
 *                   description: Current fetch interval in seconds.
 */
router.get("/current-schedule", (req: Request, res: Response) => {
  const currentSchedule = getCurrentSchedule();
  logger.debug("Fetching current shedule");
  res.json(currentSchedule);
});

/**
 * @swagger
 * /api/status:
 *   get:
 *     summary: Check the DockStatAPI and docker socket status of each host
 *     tags: [Misc]
 *     description: Returns the status of the backend and online components, indicating which nodes are reachable or offline.
 *     responses:
 *       200:
 *         description: Server and backend status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 backendReachable:
 *                   type: boolean
 *                   example: true
 *                 online:
 *                   type: object
 *                   properties:
 *                     Host-1:
 *                       type: boolean
 *                       example: true
 *                     Host-2:
 *                       type: boolean
 *                       example: false
 */

router.get("/status", async (req: Request, res: Response) => {
  logger.debug("Fetching /api/status");
  try {
    let jsonData = await checkReachability();
    res.status(200).json(jsonData);
  } catch (error: any) {
    logger.error(`Error while fetching data: ${error}`);
  }
});

/**
 * @swagger
 * /api/frontend-config:
 *   get:
 *     summary: Get Frontend Configuration
 *     tags: [Configuration]
 *     description: Retrieves the frontend configuration data.
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: Container Name
 *                   hidden:
 *                     type: boolean
 *                     description: Whether the container is hidden
 *                   tags:
 *                     type: array
 *                     items:
 *                       type: string
 *                     description: Tags associated with the container
 *                   pinned:
 *                     type: boolean
 *                     description: Whether the container is pinned
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 */
router.get("/frontend-config", (req: Request, res: Response) => {
  const configPath: string = "./src/data/frontendConfiguration.json";

  fs.stat(configPath, (exists) => {
    if (exists == null) {
      logger.debug(`${configPath} exists, trying to read it`)
    } else if (exists.code === 'ENOENT') {
      logger.warn(`${configPath} doesn't exist, trying to create it`)
      fs.promises.writeFile(
        configPath,
        JSON.stringify([], null, 2),
        "utf-8",
      );
    }
  });

  try {
    const rawData = fs.readFileSync(configPath);
    const jsonData = JSON.parse(rawData.toString());

    res.status(200).json(jsonData);
  } catch (error: any) {
    logger.error("Error loading frontendConfiguration.json: " + error.message);
    res.status(500).json({ error: "Failed to load Frontend configuration" });
  }
});

export default router;
