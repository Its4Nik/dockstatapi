const extractRelevantData = require('../../utils/extractHostData');
const express = require('express');
const router = express.Router();
const { getDockerClient } = require('../../utils/dockerClient');
const logger = require('../../utils/logger');
const path = require('path');
const fs = require('fs');

/**
 * @swagger
 * /api/hosts:
 *   get:
 *     summary: Retrieve a list of all available Docker hosts
 *     tags: [Hosts]
 *     responses:
 *       200:
 *         description: A JSON object containing an array of host names.
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
    const config = require('../../config/dockerConfig.json');
    const hosts = config.hosts.map((host) => host.name);
    logger.info('Fetching all available Docker hosts');
    res.status(200).json({ hosts });
});

/**
 * @swagger
 * /api/host/{hostName}/stats:
 *   get:
 *     summary: Retrieve statistics for a specified Docker host
 *     tags: [Hosts]
 *     parameters:
 *       - name: hostName
 *         in: path
 *         required: true
 *         description: The name of the host for which to fetch statistics.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: A JSON object containing relevant statistics for the specified host.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hostName:
 *                   type: string
 *                   description: The name of the Docker host.
 *                 info:
 *                   type: object
 *                   description: Information about the Docker host (e.g., storage, running containers).
 *                 version:
 *                   type: object
 *                   description: Version details of the Docker installation on the host.
 *       500:
 *         description: An error occurred while fetching host statistics.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message detailing the issue encountered.
 */
router.get('/host/:hostName/stats', async (req, res) => {
    const hostName = req.params.hostName;
    logger.info(`Fetching stats for host: ${hostName}`);
    try {
        const docker = getDockerClient(hostName);
        const info = await docker.info();
        const version = await docker.version();
        const relevantData = extractRelevantData({ hostName, info, version });
        
        res.status(200).json(relevantData);
    } catch (error) {
        logger.error(`Error fetching stats for host: ${hostName} - ${error.message || 'Unknown error'}`);
        res.status(500).json({ error: `Error fetching host stats: ${error.message || 'Unknown error'}` });
    }
});

/**
 * @swagger
 * /api/containers:
 *   get:
 *     summary: Retrieve all Docker containers across all configured hosts
 *     tags: [Containers]
 *     responses:
 *       200:
 *         description: A JSON object containing container data for all hosts.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: object
 *                 properties:
 *                   name:
 *                     type: string
 *                     description: Name of the container.
 *                   id:
 *                     type: string
 *                     description: Unique identifier for the container.
 *                   hostName:
 *                     type: string
 *                     description: The host on which the container is running.
 *                   state:
 *                     type: string
 *                     description: Current state of the container (e.g., running, exited).
 *                   cpu_usage:
 *                     type: number
 *                     format: double
 *                     description: CPU usage in nanoseconds.
 *                   mem_usage:
 *                     type: number
 *                     description: Memory usage in bytes.
 *                   mem_limit:
 *                     type: number
 *                     description: Memory limit in bytes.
 *                   net_rx:
 *                     type: number
 *                     description: Total received bytes over the network.
 *                   net_tx:
 *                     type: number
 *                     description: Total transmitted bytes over the network.
 *                   current_net_rx:
 *                     type: number
 *                     description: Current received bytes over the network.
 *                   current_net_tx:
 *                     type: number
 *                     description: Current transmitted bytes over the network.
 *                   networkMode:
 *                     type: string
 *                     description: Network mode configured for the container.
 *                   link:
 *                     type: string
 *                     description: Optional link to additional information.
 *                   icon:
 *                     type: string
 *                     description: Optional icon representing the container.
 *                   tags:
 *                     type: string
 *                     description: Optional tags associated with the container.
 *       500:
 *         description: An error occurred while fetching container data.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message detailing the issue encountered.
 */
router.get('/containers', async (req, res) => {
    const config = require('../../config/dockerConfig.json');
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

/**
 * @swagger
 * /api/config:
 *   get:
 *     summary: Retrieve Docker configuration
 *     tags: [Configuration]
 *     responses:
 *       200:
 *         description: A JSON object containing the Docker configuration.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties: true
 *       500:
 *         description: An error occurred while loading the Docker configuration.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message detailing the issue encountered.
 */

router.get('/config', async (req, res) => {
    const configPath = path.join(__dirname, '../../config/dockerConfig.json');
    try {
        const rawData = fs.readFileSync(configPath);
        const jsonData = JSON.parse(rawData.toString());
        res.status(200).json(jsonData);
    } catch (error) {
        logger.error('Error loading dockerConfig.json: ' + error.message);
        res.status(500).json({ error: 'Failed to load Docker configuration' });
    }
});

module.exports = router;
