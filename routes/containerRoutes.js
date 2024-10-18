// routes/containerRoutes.js
const express = require('express');
const { getContainers, getContainerStats } = require('../controllers/containerController');

const router = express.Router();

/**
 * @swagger
 * /api/containers:
 *   get:
 *     summary: Get all containers
 *     parameters:
 *       - in: query
 *         name: host
 *         schema:
 *           type: string
 *         description: Docker host name
 *     responses:
 *       200:
 *         description: List of Docker containers
 */
router.get('/', getContainers);

/**
 * @swagger
 * /api/containers/{id}/stats:
 *   get:
 *     summary: Get stats for a specific container
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Container ID
 *       - in: query
 *         name: host
 *         schema:
 *           type: string
 *         description: Docker host name
 *     responses:
 *       200:
 *         description: Container stats
 */
router.get('/:id/stats', getContainerStats);

module.exports = router;
