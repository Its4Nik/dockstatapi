import express, { Request, Response } from "express";
const router = express.Router();
import { createDatabaseHandler } from "../../handlers/data";

/**
 * @swagger
 * /data/latest:
 *   get:
 *     summary: Retrieve the latest container statistics for a specific host
 *     tags: [Database queries]
 *     responses:
 *       200:
 *         description: A JSON object containing the latest container statistics for the specified host.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 Fin-2:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         description: The name of the container
 *                         example: "Container A"
 *                       id:
 *                         type: string
 *                         description: Unique identifier for the container
 *                         example: "abcd1234"
 *                       hostName:
 *                         type: string
 *                         description: Name of the host system running this container
 *                         example: "Fin-2"
 *                       state:
 *                         type: string
 *                         description: Current state of the container
 *                         example: "running"
 *                       cpu_usage:
 *                         type: number
 *                         description: CPU usage percentage for this container
 *                         example: 30
 *                       mem_usage:
 *                         type: number
 *                         description: Memory usage in bytes
 *                         example: 2097152
 *                       mem_limit:
 *                         type: number
 *                         description: Memory limit in bytes set for this container
 *                         example: 8123764736
 *                       net_rx:
 *                         type: number
 *                         description: Total network received bytes since container start
 *                         example: 151763111
 *                       net_tx:
 *                         type: number
 *                         description: Total network transmitted bytes since container start
 *                         example: 7104386
 *                       current_net_rx:
 *                         type: number
 *                         description: Current received bytes in the recent period
 *                         example: 1048576
 *                       current_net_tx:
 *                         type: number
 *                         description: Current transmitted bytes in the recent period
 *                         example: 524288
 *                       networkMode:
 *                         type: string
 *                         description: Networking mode for the container
 *                         example: "bridge"
 */
router.get("/latest", (req: Request, res: Response) => {
  const DatabaseHandler = createDatabaseHandler(req, res);
  return DatabaseHandler.latest();
});

/**
 * @swagger
 * /data/all:
 *   get:
 *     summary: Retrieve container statistics entries from the last 24 hours
 *     tags: [Database queries]
 *     responses:
 *       200:
 *         description: A numbered array of 'info' JSON objects from the last 24 hours.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 0:
 *                   type: object
 *                   description: Statistics for the first entry within 24 hours.
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Container A"
 *                     id:
 *                       type: string
 *                       example: "abcd1234"
 *                     cpu_usage:
 *                       type: number
 *                       example: 30
 *                     mem_usage:
 *                       type: number
 *                       example: 2048
 *                 1:
 *                   type: object
 *                   description: Statistics for the second entry within 24 hours.
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Container B"
 *                     id:
 *                       type: string
 *                       example: "efgh5678"
 *                     cpu_usage:
 *                       type: number
 *                       example: 45
 *                     mem_usage:
 *                       type: number
 *                       example: 3072
 */
router.get("/all", (req: Request, res: Response) => {
  const DatabaseHandler = createDatabaseHandler(req, res);
  return DatabaseHandler.all();
});

/**
 * @swagger
 * /data/clear:
 *   delete:
 *     summary: Clear all container statistics entries from the database
 *     tags: [Database queries]
 *     responses:
 *       200:
 *         description: A message indicating whether the database was cleared successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message upon database clearance
 *                   example: "Database cleared successfully."
 */
router.delete("/clear", (req: Request, res: Response) => {
  const DatabaseHandler = createDatabaseHandler(req, res);
  return DatabaseHandler.clear();
});

export default router;
