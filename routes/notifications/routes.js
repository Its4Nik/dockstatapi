import express from "express";
const router = express.Router();
import logger from "../../utils/logger.js";
import path from "path";
import fs from "fs";
import notify from "../../utils/notifications/_notify.js";
const dataTemplate = "./utils/notifications/data/template.json";
/**
 * @swagger
 * /notification-service/get-template:
 *   get:
 *     summary: Retrieve the notification template
 *     tags: [Notification Service]
 *     responses:
 *       200:
 *         description: Template data retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates if the operation was successful
 *                 data:
 *                   type: object
 *                   description: The template data in JSON format
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 */
router.get("/get-template", (req, res) => {
  fs.readFile(dataTemplate, "utf-8", (error, data) => {
    if (error) {
      logger.error("Errored opening:", error);
      return res.status(500).json({ message: `Error opening: ${error}` });
    }
    res.json(JSON.parse(data));
  });
});

/**
 * @swagger
 * /notification-service/set-template:
 *   post:
 *     summary: Update the notification template
 *     tags: [Notification Service]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: New template data to save
 *     responses:
 *       200:
 *         description: Template updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 */
router.post("/set-template", (req, res) => {
  const newData = req.body;

  fs.writeFile(
    dataTemplate,
    JSON.stringify(newData, null, 2),
    "utf-8",
    (error) => {
      if (error) {
        logger.error("Errored writing to file:", error);
        return res
          .status(500)
          .json({ message: `Error writing to file: ${error}` });
      }
      res.json({ message: "Template updated successfully." });
    },
  );
});

/**
 * @swagger
 * /notification-service/test/{type}/{containerId}:
 *   post:
 *     summary: Send a test notification for a specific container
 *     tags: [Notification Service]
 *     parameters:
 *       - in: path
 *         name: type
 *         schema:
 *           type: string
 *         required: true
 *         description: Type of notification to test
 *       - in: path
 *         name: containerId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the container for the notification test
 *     responses:
 *       200:
 *         description: Test notification sent successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.post("/test/:type/:containerId", async (req, res) => {
  const { type, containerId } = req.params;
  try {
    await notify(type, containerId);
    res.json({ success: true, message: `Sent test notification to ${type}` });
  } catch (error) {
    res.json({ success: false, message: `Errored: ${error}` });
  }
});

export default router;
