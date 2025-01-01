import express from "express";
const router = express.Router();
import { createFrontendHandler } from "../../handlers/frontend";

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
router.post("/show/:containerName", async (req, res) => {
  const FrontendHandler = createFrontendHandler(req, res);
  const containerName = req.params.containerName;
  return FrontendHandler.show(containerName);
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
router.post("/tag/:containerName/:tag", async (req, res) => {
  const { containerName, tag } = req.params;
  const FrontendHandler = createFrontendHandler(req, res);
  return FrontendHandler.addTag(containerName, tag);
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
router.post("/pin/:containerName", async (req, res) => {
  const { containerName } = req.params;
  const FrontendHandler = createFrontendHandler(req, res);
  return FrontendHandler.pin(containerName);
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
router.post("/add-link/:containerName/:link", async (req, res) => {
  const { containerName, link } = req.params;
  const FrontendHandler = createFrontendHandler(req, res);
  return FrontendHandler.addLink(containerName, link);
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
router.post(
  "/add-icon/:containerName/:icon/:useCustomIcon",
  async (req, res) => {
    const { containerName, icon, useCustomIcon } = req.params;
    const FrontendHandler = createFrontendHandler(req, res);
    return FrontendHandler.addIcon(containerName, icon, useCustomIcon);
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
  const FrontendHandler = createFrontendHandler(req, res);
  return FrontendHandler.hide(containerName);
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
router.delete("/remove-tag/:containerName/:tag", async (req, res) => {
  const { containerName, tag } = req.params;
  const FrontendHandler = createFrontendHandler(req, res);
  return FrontendHandler.removeTag(containerName, tag);
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
router.delete("/unpin/:containerName", async (req, res) => {
  const { containerName } = req.params;
  const FrontendHandler = createFrontendHandler(req, res);
  return FrontendHandler.unPin(containerName);
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
router.delete("/remove-link/:containerName", async (req, res) => {
  const { containerName } = req.params;
  const FrontendHandler = createFrontendHandler(req, res);
  return FrontendHandler.removeLink(containerName);
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
router.delete("/remove-icon/:containerName", async (req, res) => {
  const { containerName } = req.params;
  const FrontendHandler = createFrontendHandler(req, res);
  return FrontendHandler.removeIcon(containerName);
});

export default router;
