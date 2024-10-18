// routes/statsRoutes.js
const express = require('express');
const router = express.Router();
const { getDockerClient } = require('../utils/dockerClient');
const logger = require('../utils/logger');

/**
 * @swagger
 * /api/hosts:
 *   get:
 *     summary: Get all available Docker hosts
 *     tags: [Hosts]
 *     responses:
 *       200:
 *         description: A list of Docker hosts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hosts:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["local", "remote1"]
 */
router.get('/hosts', (req, res) => {
    const config = require('../config/dockerConfig.json');
    const hosts = config.hosts.map((host) => host.name);
    logger.info('Fetching all available Docker hosts');
    res.status(200).json({ hosts });
});

/**
 * @swagger
 * /api/host/{hostName}/stats:
 *   get:
 *     summary: Get stats for a specific Docker host
 *     tags: [Hosts]
 *     parameters:
 *       - in: path
 *         name: hostName
 *         required: true
 *         schema:
 *           type: string
 *         description: The name of the Docker host
 *     responses:
 *       200:
 *         description: Stats for the specific Docker host
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hostName:
 *                   type: string
 *                 info:
 *                   type: object
 *                 version:
 *                   type: object
 *       500:
 *         description: Error fetching stats
 */
router.get('/host/:hostName/stats', async (req, res) => {
    const hostName = req.params.hostName;
    logger.info(`Fetching stats for host: ${hostName}`);
    try {
        const docker = getDockerClient(hostName);
        const info = await docker.info();
        const version = await docker.version();
        res.status(200).json({ hostName, info, version });
    } catch (error) {
        logger.error(`Error fetching stats for host: ${hostName} - ${error.message || 'Unknown error'}`);
        res.status(500).json({ error: `Error fetching host stats: ${error.message || 'Unknown error'}` });
    }
});

/**
 * @swagger
 * /api/containers:
 *   get:
 *     summary: Get all containers from all hosts
 *     tags: [Containers]
 *     responses:
 *       200:
 *         description: A list of containers across all Docker hosts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: dockstat-demo
 *                     id:
 *                       type: string
 *                       example: 2ec35ef9d8789c09cb0bbe820d099f9794a525943e494991b3608f8aaee44466
 *                     hostName:
 *                       type: string
 *                       example: YourHost1
 *                     state:
 *                       type: string
 *                       example: running
 *                     cpu_usage:
 *                       type: number
 *                       example: 49494987000
 *                     mem_usage:
 *                       type: number
 *                       example: 31481856
 *                     mem_limit:
 *                       type: number
 *                       example: 8123764736
 *                     net_rx:
 *                       type: number
 *                       example: 224714
 *                     net_tx:
 *                       type: number
 *                       example: 648853
 *                     networkMode:
 *                       type: string
 *                       example: docker-important_default
 *       500:
 *         description: Error fetching containers
 */
router.get('/containers', async (req, res) => {
    const config = require('../config/dockerConfig.json');
    const allContainerData = {};
    logger.info('Fetching all containers across all hosts');

    for (const hostConfig of config.hosts) {
        const hostName = hostConfig.name;
        try {
            const docker = getDockerClient(hostName);
            const containers = await docker.listContainers({ all: true });

            allContainerData[hostName] = await Promise.all(containers.map(async (container) => {
                const containerInfo = await docker.getContainer(container.Id).inspect();
                const containerStats = await docker.getContainer(container.Id).stats({ stream: false });
                const cpuDelta = containerStats.cpu_stats.cpu_usage.total_usage - containerStats.precpu_stats.cpu_usage.total_usage;
                const systemCpuDelta = containerStats.cpu_stats.system_cpu_usage - containerStats.precpu_stats.system_cpu_usage;
                const cpuUsage = systemCpuDelta > 0 ? (cpuDelta / systemCpuDelta) * containerStats.cpu_stats.online_cpus : 0;

                return {
                    name: container.Names[0].replace('/', ''),
                    id: container.Id,
                    hostName: hostName,
                    state: container.State,
                    cpu_usage: cpuUsage * 1000000000,
                    mem_usage: containerStats.memory_stats.usage,
                    mem_limit: containerStats.memory_stats.limit,
                    net_rx: containerStats.networks?.eth0?.rx_bytes || 0,
                    net_tx: containerStats.networks?.eth0?.tx_bytes || 0,
                    current_net_rx: containerStats.networks?.eth0?.rx_bytes || 0,
                    current_net_tx: containerStats.networks?.eth0?.tx_bytes || 0,
                    networkMode: containerInfo.HostConfig.NetworkMode,
                    link: '',
                    icon: '',
                    tags: ''
                };
            }));
        } catch (error) {
            logger.error(`Error fetching containers for host: ${hostName} - ${error.message}`);
            allContainerData[hostName] = { error: `Error fetching containers: ${error.message}` };
        }
    }

    res.status(200).json(allContainerData);
});

module.exports = router;
