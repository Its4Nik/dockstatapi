import express from "express";
const router = express.Router();

import {
  hideContainer,
  unhideContainer,
  addTagToContainer,
  removeTagFromContainer,
  pinContainer,
  unpinContainer,
  setLink,
  removeLink,
  setIcon,
  removeIcon,
} from "../../controllers/frontendConfiguration";

/*
____   ___  ____ _____
|  _ \ / _ \/ ___|_   _|
| |_) | | | \___ \ | |
|  __/| |_| |___) || |
|_|    \___/|____/ |_|
*/

/**
 * @swagger
 * /frontend/show/{containerName}:
 *   post:
 *     summary: Unhide a container
 *     tags: [Frontend Configuration]
 *     parameters:
 *       - in: path
 *         name: containerName
 *         schema:
 *           type: string
 *         required: true
 *         description: The name of the container to unhide
 *     responses:
 *       200:
 *         description: Container unhidden successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates if the operation was successful
 *                 message:
 *                   type: string
 *                   description: Success message
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates if the operation was successful
 *                 error:
 *                   type: string
 *                   description: Error message
 */
// Unhide a container
router.post("/show/:containerName", async (req, res) => {
  const { containerName } = req.params;
  try {
    await unhideContainer(containerName);
    res.json({ success: true, message: "Container unhidden successfully." });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /frontend/tag/{containerName}/{tag}:
 *   post:
 *     summary: Add a tag to a container
 *     tags: [Frontend Configuration]
 *     parameters:
 *       - in: path
 *         name: containerName
 *         schema:
 *           type: string
 *         required: true
 *         description: The name of the container to add tag to
 *       - in: path
 *         name: tag
 *         schema:
 *           type: string
 *         required: true
 *         description: The tag to add
 *     responses:
 *       200:
 *         description: Tag added successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates if the operation was successful
 *                 message:
 *                   type: string
 *                   description: Success message
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates if the operation was successful
 *                 error:
 *                   type: string
 *                   description: Error message
 */
// Add a tag to a container
router.post("/tag/:containerName/:tag", async (req, res) => {
  const { containerName, tag } = req.params;
  try {
    await addTagToContainer(containerName, tag);
    res.json({ success: true, message: "Tag added successfully." });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /frontend/pin/{containerName}:
 *   post:
 *     summary: Pin a container
 *     tags: [Frontend Configuration]
 *     parameters:
 *       - in: path
 *         name: containerName
 *         schema:
 *           type: string
 *         required: true
 *         description: The name of the container to pin
 *     responses:
 *       200:
 *         description: Container pinned successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates if the operation was successful
 *                 message:
 *                   type: string
 *                   description: Success message
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates if the operation was successful
 *                 error:
 *                   type: string
 *                   description: Error message
 */
// Pin a container
router.post("/pin/:containerName", async (req, res) => {
  const { containerName } = req.params;
  try {
    await pinContainer(containerName);
    res.json({ success: true, message: "Container pinned successfully." });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /frontend/add-link/{containerName}/{link}:
 *   post:
 *     summary: Add a link to a container
 *     tags: [Frontend Configuration]
 *     parameters:
 *       - in: path
 *         name: containerName
 *         schema:
 *           type: string
 *         required: true
 *         description: The name of the container to add link to
 *       - in: path
 *         name: link
 *         schema:
 *           type: string
 *         required: true
 *         description: The link to add
 *     responses:
 *       200:
 *         description: Link added successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates if the operation was successful
 *                 message:
 *                   type: string
 *                   description: Success message
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates if the operation was successful
 *                 error:
 *                   type: string
 *                   description: Error message
 */
// Add link to container
router.post("/add-link/:containerName/:link", async (req, res) => {
  const { containerName, link } = req.params;
  try {
    await setLink(containerName, link);
    res.json({ success: true, message: "Link added successfully." });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /frontend/add-icon/{containerName}/{icon}/{useCustomIcon}:
 *   post:
 *     summary: Add an Icon to a container
 *     tags: [Frontend Configuration]
 *     parameters:
 *       - in: path
 *         name: containerName
 *         schema:
 *           type: string
 *         required: true
 *         description: The name of the container to add link to
 *       - in: path
 *         name: icon
 *         schema:
 *           type: string
 *         required: true
 *         description: The Icon to add
 *       - in: path
 *         name: useCustomIcon
 *         shema:
 *           type: boolean
 *         required: false
 *         description: If this icon is a custom icon or nor
 *     responses:
 *       200:
 *         description: Icon added successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates if the operation was successful
 *                 message:
 *                   type: string
 *                   description: Success message
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates if the operation was successful
 *                 error:
 *                   type: string
 *                   description: Error message
 */
// Add Icon to container
router.post(
  "/add-icon/:containerName/:icon/:useCustomIcon",
  async (req, res) => {
    const { containerName, icon, useCustomIcon } = req.params;
    try {
      const custom = useCustomIcon === "true";

      await setIcon(containerName, icon, custom);
      res.json({ success: true, message: "Icon added successfully." });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  },
);

/*
 ____  _____ _     _____ _____ _____
|  _ \| ____| |   | ____|_   _| ____|
| | | |  _| | |   |  _|   | | |  _|
| |_| | |___| |___| |___  | | | |___
|____/|_____|_____|_____| |_| |_____|
*/

/**
 * @swagger
 * /frontend/hide/{containerName}:
 *   delete:
 *     summary: Hide a container
 *     tags: [Frontend Configuration]
 *     parameters:
 *       - in: path
 *         name: containerName
 *         schema:
 *           type: string
 *         required: true
 *         description: The name of the container to hide
 *     responses:
 *       200:
 *         description: Container hidden successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates if the operation was successful
 *                 message:
 *                   type: string
 *                   description: Success message
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates if the operation was successful
 *                 error:
 *                   type: string
 *                   description: Error message
 */
// Hide a container
router.delete("/hide/:containerName", async (req, res) => {
  const { containerName } = req.params;
  const target = containerName;
  try {
    await hideContainer(target);
    res.json({ success: true, message: `Container, ${target}, hidden.` });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /frontend/remove-tag/{containerName}/{tag}:
 *   delete:
 *     summary: Remove a tag from a container
 *     tags: [Frontend Configuration]
 *     parameters:
 *       - in: path
 *         name: containerName
 *         schema:
 *           type: string
 *         required: true
 *         description: The name of the container to remove tag from
 *       - in: path
 *         name: tag
 *         schema:
 *           type: string
 *         required: true
 *         description: The tag to remove
 *     responses:
 *       200:
 *         description: Tag removed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates if the operation was successful
 *                 message:
 *                   type: string
 *                   description: Success message
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates if the operation was successful
 *                 error:
 *                   type: string
 *                   description: Error message
 */
// Remove a tag from a container
router.delete("/remove-tag/:containerName/:tag", async (req, res) => {
  const { containerName, tag } = req.params;
  try {
    await removeTagFromContainer(containerName, tag);
    res.json({ success: true, message: "Tag removed successfully." });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /frontend/unpin/{containerName}:
 *   delete:
 *     summary: Unpin a container
 *     tags: [Frontend Configuration]
 *     parameters:
 *       - in: path
 *         name: containerName
 *         schema:
 *           type: string
 *         required: true
 *         description: The name of the container to unpin
 *     responses:
 *       200:
 *         description: Container unpinned successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates if the operation was successful
 *                 message:
 *                   type: string
 *                   description: Success message
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates if the operation was successful
 *                 error:
 *                   type: string
 *                   description: Error message
 */
// Unpin a container
router.delete("/unpin/:containerName", async (req, res) => {
  const { containerName } = req.params;
  try {
    await unpinContainer(containerName);
    res.json({ success: true, message: "Container unpinned successfully." });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /frontend/remove-link/{containerName}:
 *   delete:
 *     summary: Remove a link from a container
 *     tags: [Frontend Configuration]
 *     parameters:
 *       - in: path
 *         name: containerName
 *         schema:
 *           type: string
 *         required: true
 *         description: The name of the container to remove link from
 *     responses:
 *       200:
 *         description: Link removed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates if the operation was successful
 *                 message:
 *                   type: string
 *                   description: Success message
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates if the operation was successful
 *                 error:
 *                   type: string
 *                   description: Error message
 */
// Remove link from container
router.delete("/remove-link/:containerName", async (req, res) => {
  const { containerName } = req.params;
  try {
    await removeLink(containerName);
    res.json({ success: true, message: "Link removed successfully." });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /frontend/remove-icon/{containerName}:
 *   delete:
 *     summary: Remove an icon from a container
 *     tags: [Frontend Configuration]
 *     parameters:
 *       - in: path
 *         name: containerName
 *         schema:
 *           type: string
 *         required: true
 *         description: The name of the container to remove the icon from
 *     responses:
 *       200:
 *         description: Icon removed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates if the operation was successful
 *                 message:
 *                   type: string
 *                   description: Success message
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Indicates if the operation was successful
 *                 error:
 *                   type: string
 *                   description: Error message
 */
// Remove icon from container
router.delete("/remove-icon/:containerName", async (req, res) => {
  const { containerName } = req.params;
  try {
    await removeIcon(containerName);
    res.json({ success: true, message: "Icon removed successfully." });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
