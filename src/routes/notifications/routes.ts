import { Request, Response, Router } from "express";
import { createNotificationHandler } from "../../handlers/notification";
const router = Router();

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
router.get("/get-template", (req: Request, res: Response) => {
  const NotificationHandler = createNotificationHandler(req, res);
  return NotificationHandler.getTemplate();
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
router.post("/set-template", (req: Request, res: Response): void => {
  const NotificationHandler = createNotificationHandler(req, res);
  return NotificationHandler.setTemplate(req);
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
router.post("/test/:type/:containerId", async (req: Request, res: Response) => {
  const NotificationHandler = createNotificationHandler(req, res);
  NotificationHandler.test(req);
});

export default router;
