const { getDockerClient } = require('../utils/dockerClient');
const logger = require('../utils/logger');

const getContainers = async (req, res) => {
    const host = req.query.host || 'local';
    logger.info(`Fetching containers from host: ${host}`);
    try {
        const docker = getDockerClient(host);
        const containers = await docker.listContainers();
        logger.info(`Successfully fetched ${containers.length} containers from host: ${host}`);
        res.status(200).json(containers);
    } catch (error) {
        logger.error(`Error fetching containers from host: ${host} - ${error.message || 'Unknown error'} - Full error: ${JSON.stringify(error, null, 2)}`);
        res.status(500).json({ error: `Error fetching containers: ${error.message || 'Unknown error'}` });
    }
};

const getContainerStats = async (containerID, containerHost) => {
    logger.info(`Fetching stats for container: ${containerID} from host: ${containerHost}`);
    try {
        const docker = getDockerClient(containerHost);
        const container = docker.getContainer(containerID);
        const stats = await container.stats({ stream: false });
        logger.info(`Successfully fetched stats for container: ${containerID} from host: ${containerHost}`);
        res.status(200).json(stats);
    } catch (error) {
        logger.error(`Error fetching stats for container: ${containerID} from host: ${containerHost} - ${error.message}`);
        res.status(500).json({ error: `Error fetching container stats: ${error.message}` });
    }
};

module.exports = {
    getContainers,
    getContainerStats,
};
