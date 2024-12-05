import { Router, Request, Response } from "express";
import logger from "../../utils/logger";
import { readConfig } from "../../controllers/highAvailability";

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
  var data = await readConfig();
  res.status(200).json({ data });
});

export default router;
