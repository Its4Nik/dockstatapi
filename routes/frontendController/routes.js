const express = require("express");
const router = express.Router();
const logger = require("../../utils/logger");
const {
  hideContainer,
  unhideContainer,
  addTagToContainer,
  removeTagFromContainer,
  pinContainer,
  unpinContainer,
} = require("../../controllers/frontendConfiguration");

/**
 * @swagger
 * /frontend/hide/{containerName}:
 *   post:
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
router.post("/hide/:containerName", async (req, res) => {
  const { containerName } = req.params;
  const target = containerName;
  //console.log(target);

  try {
    await hideContainer(target);
    res.json({ success: true, message: `Container, ${target}, hidden.` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /frontend/unhide/{containerName}:
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
router.post("/unhide/:containerName", async (req, res) => {
  const { containerName } = req.params;
  try {
    await unhideContainer(containerName);
    res.json({ success: true, message: "Container unhidden successfully." });
  } catch (error) {
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
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /frontend/remove-tag/{containerName}/{tag}:
 *   post:
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
router.post("/remove-tag/:containerName/:tag", async (req, res) => {
  const { containerName, tag } = req.params;
  try {
    await removeTagFromContainer(containerName, tag);
    res.json({ success: true, message: "Tag removed successfully." });
  } catch (error) {
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
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /frontend/unpin/{containerName}:
 *   post:
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
router.post("/unpin/:containerName", async (req, res) => {
  const { containerName } = req.params;
  try {
    await unpinContainer(containerName);
    res.json({ success: true, message: "Container unpinned successfully." });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
