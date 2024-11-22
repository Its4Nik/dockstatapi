import { setFetchInterval, parseInterval } from "../../controllers/scheduler";
import logger from "../../utils/logger";
import { Router, Request, Response } from "express";
import fs from "fs";

const router = Router();
const configPath: string = "./src/config/dockerConfig.json";

interface Host {
  name: string;
  url: string;
  port: string;
}

interface DockerConfig {
  hosts: Host[];
}

/**
 * @swagger
 * /conf/addHost:
 *   put:
 *     summary: Add a new host to the Docker configuration
 *     tags: [Configuration]
 *     parameters:
 *       - name: name
 *         in: query
 *         required: true
 *         description: The name of the new host.
 *       - name: url
 *         in: query
 *         required: true
 *         description: The URL of the new host.
 *       - name: port
 *         in: query
 *         required: true
 *         description: The port of the new host.
 *     responses:
 *       200:
 *         description: Host added successfully.
 *       400:
 *         description: Bad request, invalid input.
 *       500:
 *         description: An error occurred while adding the host.
 */
router.put("/addHost", async (req: Request, res: Response) => {
  const name = req.query.name as string;
  const url = req.query.url as string;
  const port = req.query.port as string;

  if (!name || !url || !port) {
    return res.status(400).json({ error: "Name, Port, and URL are required." });
  }

  try {
    const config: DockerConfig = JSON.parse(
      fs.readFileSync(configPath, "utf-8"),
    );

    if (config.hosts.some((host) => host.name === name)) {
      return res.status(400).json({ error: "Host already exists." });
    }

    config.hosts.push({ name, url, port });
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    logger.info(`Added new host: ${name}`);
    res.status(200).json({ message: "Host added successfully." });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error("Error adding host: " + err.message);
    res.status(500).json({ error: "Failed to add host." });
  }
});

/**
 * @swagger
 * /conf/scheduler:
 *   put:
 *     summary: Set fetch interval for data fetching
 *     tags: [Configuration]
 *     parameters:
 *       - name: interval
 *         in: query
 *         required: true
 *         description: The new interval for fetching data, e.g., "6h 20m", "300s".
 *     responses:
 *       200:
 *         description: Fetch interval set successfully.
 *       400:
 *         description: Invalid interval format or out of range.
 */
router.put("/scheduler", (req: any, res: any) => {
  const interval = req.query.interval as string;

  try {
    const newInterval = parseInterval(interval);

    if (newInterval < 5 * 60 * 1000 || newInterval > 6 * 60 * 60 * 1000) {
      return res
        .status(400)
        .json({ error: "Interval must be between 5 minutes and 6 hours." });
    }

    setFetchInterval(newInterval);
    res.json({ message: `Fetch interval set to ${interval}.` });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error("Error setting fetch interval: " + err.message);
    res.status(400).json({ error: "Invalid interval format." });
  }
});

/**
 * @swagger
 * /conf/removeHost:
 *   delete:
 *     summary: Remove a host from the Docker configuration
 *     tags: [Configuration]
 *     parameters:
 *       - name: hostName
 *         in: query
 *         required: true
 *         description: The name of the host to remove.
 *     responses:
 *       200:
 *         description: Host removed successfully.
 *       404:
 *         description: Host not found.
 *       500:
 *         description: An error occurred while removing the host.
 */
router.delete("/removeHost", async (req: Request, res: Response) => {
  const hostName = req.query.hostName as string;

  if (!hostName) {
    return res.status(400).json({ error: "Host name is required." });
  }

  try {
    const rawData = fs.readFileSync(configPath, "utf-8");
    const config: DockerConfig = JSON.parse(rawData);

    const hostIndex = config.hosts.findIndex((host) => host.name === hostName);
    if (hostIndex === -1) {
      return res.status(404).json({ error: "Host not found." });
    }

    config.hosts.splice(hostIndex, 1);
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    logger.info(`Removed host: ${hostName}`);
    res.status(200).json({ message: "Host removed successfully." });
  } catch (error: unknown) {
    const err = error as Error;
    logger.error("Error removing host: " + err.message);
    res.status(500).json({ error: "Failed to remove host." });
  }
});

export default router;