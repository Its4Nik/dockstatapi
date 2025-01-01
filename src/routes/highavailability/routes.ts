import { Router, Request, Response } from "express";
import { SyncRequestBody } from "../../typings/syncRequestBody";
import { createHaHandler } from "../../handlers/ha";
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
  const HaHandler = createHaHandler(req, res);
  return HaHandler.config();
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
    req: Request<{}, {}, SyncRequestBody>, // eslint-disable-line
    res: Response,
  ): Promise<void> => {
    const HaHandler = createHaHandler(req, res);
    return HaHandler.sync(req);
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
  const HaHandler = createHaHandler(req, res);
  return HaHandler.prepare();
});

export default router;
