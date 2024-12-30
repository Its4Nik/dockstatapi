import express from "express";
const router = express.Router();
import db from "../../config/db";
import logger from "../../utils/logger";
import Table from "../../typings/table";

interface DataRow {
  info: string;
}

function formatRows(rows: DataRow[]): Record<number, string> {
  return rows.reduce(
    (
      acc: Record<number, string>,
      row,
      index: number,
    ): Record<number, string> => {
      acc[index] = JSON.parse(row.info);
      return acc;
    },
    {},
  );
}

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
router.get("/latest", (req, res) => {
  db.get(
    "SELECT info FROM data ORDER BY timestamp DESC LIMIT 1",
    (error: unknown, row: Partial<Pick<Table, "info">> | undefined) => {
      if (error) {
        logger.error("Error fetching latest data:", (error as Error).message);
        return res.status(500).json({ error: "Internal server error" });
      }

      if (!row || !row.info) {
        logger.warn("No data available for /data/latest");
        return res.status(404).json({ error: "No data available" });
      }

      logger.debug("Fetching /data/latest");
      try {
        res.json(JSON.parse(row.info));
      } catch (error: unknown) {
        logger.error("Error parsing data:", (error as Error).message);
        res.status(500).json({ error: "Data format error" });
      }
    },
  );
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
router.get("/all", (req, res) => {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  db.all(
    "SELECT info FROM data WHERE timestamp >= ?",
    [oneDayAgo],
    (error: unknown, rows: Pick<Table, "info">[] | undefined) => {
      if (error) {
        logger.error(
          "Error fetching data from last 24 hours:",
          (error as Error).message,
        );
        return res.status(500).json({ error: "Internal server error" });
      }

      logger.debug("Fetching /data/time/24h");
      if (!rows || rows.length === 0) {
        logger.warn("No data available for /data/time/24h");
        return res.status(404).json({ error: "No data available" });
      }

      res.json(formatRows(rows));
    },
  );
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
router.delete("/clear", (req, res) => {
  db.run("DELETE FROM data", (error: unknown) => {
    if (error) {
      logger.error("Error clearing the database:", (error as Error).message);
      return res.status(500).json({ error: "Internal server error" });
    }
    logger.debug("Database cleared successfully");
    res.json({ message: "Database cleared successfully" });
  });
});

export default router;
