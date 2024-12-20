// File: /src/routes/ha/routes.ts
import { Router, Request, Response } from "express";
import logger from "../../utils/logger";
import {
  readConfig,
  synchronizeFilesWithNodes,
  prepareFilesForSync,
  HighAvailabilityConfig,
  ensureFileExists,
} from "../../controllers/highAvailability";

interface SyncRequestBody {
  files: Record<string, string>;
}

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
router.post(
  "/sync",
  async (
    req: Request<{}, {}, SyncRequestBody>,
    res: Response,
  ): Promise<void> => {
    try {
      const { files } = req.body;

      if (!files || typeof files !== "object") {
        const errorMsg =
          "Invalid request: 'files' object is missing or invalid.";
        logger.error(errorMsg);
        res.status(400).json({ message: errorMsg });
        return;
      }

      logger.info("Received synchronization request from master node.");

      for (const [filePath, content] of Object.entries(files)) {
        await ensureFileExists(filePath, content);
      }

      logger.info("Synchronization completed successfully.");
      res.status(200).json({ message: "Synchronization completed." });
    } catch (error) {
      logger.error(`Error during synchronization: ${(error as Error).message}`);
      res.status(500).json({ message: "Synchronization failed." });
    }
  },
);

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
