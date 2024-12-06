// File: /src/routes/ha/routes.ts
import { Router, Request, Response } from "express";
import logger from "../../utils/logger";
import {
  readConfig,
  synchronizeFilesWithNodes,
  prepareFilesForSync,
  HighAvailabilityConfig,
} from "../../controllers/highAvailability";

const router = Router();

/**
 * @swagger
 * /ha/config:
 *   get:
 *     summary: Retrieve the High Availability Config
 *     tags: [High Availability]
 *     responses:
 *       200:
 *         description: A JSON object containing the config.
 */
router.get("/config", async (req: Request, res: Response) => {
  logger.info("Getting the HA-Config");
  const data = await readConfig();
  res.status(200).json(data);
});

/**
 * @swagger
 * /ha/sync:
 *   post:
 *     summary: Synchronize configuration files from master node.
 *     tags: [High Availability]
 *     responses:
 *       200:
 *         description: Files synchronized successfully.
 */
router.post("/sync", synchronizeFilesWithNodes);

/**
 * @swagger
 * /ha/prepare-sync:
 *   get:
 *     summary: Prepare files for synchronization.
 *     tags: [High Availability]
 *     responses:
 *       200:
 *         description: A JSON object containing files to sync.
 */
router.get("/prepare-sync", async (req: Request, res: Response) => {
  logger.info("Preparing files for synchronization.");
  const fileData = await prepareFilesForSync();
  res.status(200).json(fileData);
});

export default router;
