const express = require('express');
const yaml = require('yamljs');
const Docker = require('dockerode');
const logger = require('./logger');
const app = express();
const config = yaml.load('./hosts.yaml');
const hosts = config.hosts;
const maxlogsize = config.log.logsize || 1;
const LogAmount = config.log.LogCount || 5;
const queryInterval = config.mintimeout || 5000;
const port = 7070;

let latestStats = {};
let hostQueues = {};
let previousNetworkStats = {};

function createDockerClient(hostConfig) {
    return new Docker({
        host: hostConfig.url,
        port: hostConfig.port,
    });
}

async function getContainerStats(docker, containerId) {
    const container = docker.getContainer(containerId);
    return new Promise((resolve, reject) => {
        container.stats({ stream: false }, (err, stats) => {
            if (err) return reject(err);
            resolve(stats);
        });
    });
}

async function queryHostStats(hostName, hostConfig) {
    logger.debug(`Querying Docker stats for host: ${hostName} (${hostConfig.url}:${hostConfig.port})`);

    const docker = createDockerClient(hostConfig);

    try {
        const containers = await docker.listContainers();
        const hostStats = [];

        for (const container of containers) {
            try {
                const containerStats = await getContainerStats(docker, container.Id);

                // Get the previous network stats for this container
                const previousStats = previousNetworkStats[container.Id] || { rx_bytes: 0, tx_bytes: 0 };

                // Calculate current network usage (difference between current and previous stats)
                const currentNetRx = containerStats.networks.eth0.rx_bytes - previousStats.rx_bytes;
                const currentNetTx = containerStats.networks.eth0.tx_bytes - previousStats.tx_bytes;

                // Store the new stats in the previousNetworkStats object
                previousNetworkStats[container.Id] = {
                    rx_bytes: containerStats.networks.eth0.rx_bytes,
                    tx_bytes: containerStats.networks.eth0.tx_bytes,
                };

                const usage = {
                    name: container.Names[0],
                    state: container.State,
                    cpu_usage: containerStats.cpu_stats.cpu_usage.total_usage,
                    mem_usage: containerStats.memory_stats.usage,
                    mem_limit: containerStats.memory_stats.limit,
                    net_rx: containerStats.networks.eth0.rx_bytes,   // Total RX since start
                    net_tx: containerStats.networks.eth0.tx_bytes,   // Total TX since start
                    current_net_rx: currentNetRx,                    // Current RX usage
                    current_net_tx: currentNetTx                     // Current TX usage
                };

                hostStats.push(usage);
            } catch (err) {
                logger.error(`Failed to fetch stats for container ${container.Id}: ${err.message}`);
                hostStats.push({ error: `Failed to fetch stats: ${err.message}` });
            }
        }

        latestStats[hostName] = hostStats;
        logger.info(`Fetched stats for ${containers.length} containers from ${hostName}`);
    } catch (err) {
        latestStats[hostName] = { error: `Failed to connect: ${err.message}` };
        logger.error(`Failed to fetch containers from ${hostName}: ${err.message}`);
    }
}
async function handleHostQueue(hostName, hostConfig) {
    while (true) {
        await queryHostStats(hostName, hostConfig);
        await new Promise(resolve => setTimeout(resolve, queryInterval)); // Wait for the interval before the next query
    }
}

function initializeHostQueues() {
    for (const [hostName, hostConfig] of Object.entries(hosts)) {
        hostQueues[hostName] = handleHostQueue(hostName, hostConfig);
    }
}

app.get('/stats', (req, res) => {
    res.json(latestStats);
});

app.get('/', (req, res) => {
    logger.debug("Redirected client from '/' to '/stats'.");
    res.redirect(301, '/stats');
});

app.listen(port, () => {
    logger.info('=============================== DockStat ===============================')
    logger.info(`DockStatAPI is running on http://localhost:${port}/stats`);
    logger.info(`Minimum timeout between stats queries is: ${queryInterval} milliseconds`);
    logger.info(`The max size for Log files is: ${maxlogsize}MB`)
    logger.info(`The amount of log files to keep is: ${LogAmount}`);
    logger.info("Press Ctrl+C to stop the server.");
    logger.info('========================================================================')
});

initializeHostQueues();