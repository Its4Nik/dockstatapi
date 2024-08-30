const express = require('express');
const yaml = require('yamljs');
const Docker = require('dockerode');
const cors = require('cors');
const fs = require('fs');
const logger = require('./logger');
const app = express();
const port = 7070;
const key = process.env.SECRET || 'CHANGE-ME';
const allowLocalhost = process.env.ALLOW_LOCALHOST || 'False';
const jsonLogging = process.env.JSON_LOGGING || 'True'

let config = yaml.load('./config/hosts.yaml');
let hosts = config.hosts;
let containerConfigs = config.container || {};
let maxlogsize = config.log.logsize || 1;
let LogAmount = config.log.LogCount || 5;
let queryInterval = config.mintimeout || 5000;
let latestDetailedStats = {};
let hostQueues = {};
let previousNetworkStats = {};

app.use(cors());
app.use(express.json());

const authenticateHeader = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (allowLocalhost === "False") {
        if (!authHeader || authHeader !== key) {
            logger.error(`${authHeader} != ${key}`);
            return res.status(401).json({ error: "Unauthorized" });
        }
        else {
            logger.info('Client authenticated! 👍');
            next();
        }
    } else if (allowLocalhost === "True") {
        logger.info('Allowed localhost traffic');
        next();
    }
};

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

async function queryDetailedStats(hostName, hostConfig) {
    logger.debug(`Querying Docker detailed stats for host: ${hostName} (${hostConfig.url}:${hostConfig.port})`);

    const docker = createDockerClient(hostConfig);

    try {
        const containers = await docker.listContainers({ all: true });

        // Initialize counters and accumulators
        let totalContainers = 0;
        let runningContainers = 0;
        let stoppedContainers = 0;
        let exitedContainers = 0;
        let totalCpuUsage = 0;
        let totalMemUsage = 0;
        let totalMemLimit = 0;
        let totalNetRx = 0;
        let totalNetTx = 0;
        let totalCurrentNetRx = 0;
        let totalCurrentNetTx = 0;

        const containerDetails = [];

        for (const container of containers) {
            const state = container.State.toLowerCase();
            totalContainers++;

            if (state === 'running') {
                runningContainers++;
                try {
                    const containerStats = await getContainerStats(docker, container.Id);
                    const networkMode = container.HostConfig.NetworkMode;

                    const containerName = container.Names[0].replace('/', '');
                    const config = containerConfigs[containerName] || {};

                    // Update totals
                    totalCpuUsage += containerStats.cpu_stats.cpu_usage.total_usage || 0;
                    totalMemUsage += containerStats.memory_stats.usage || 0;
                    totalMemLimit += containerStats.memory_stats.limit || 0;

                    // Calculate network usage
                    const previousStats = previousNetworkStats[container.Id] || { rx_bytes: 0, tx_bytes: 0 };
                    const currentNetRx = containerStats.networks.eth0.rx_bytes - previousStats.rx_bytes;
                    const currentNetTx = containerStats.networks.eth0.tx_bytes - previousStats.tx_bytes;

                    totalNetRx += containerStats.networks.eth0.rx_bytes || 0;
                    totalNetTx += containerStats.networks.eth0.tx_bytes || 0;
                    totalCurrentNetRx += currentNetRx;
                    totalCurrentNetTx += currentNetTx;

                    // Store new network stats for next calculation
                    previousNetworkStats[container.Id] = {
                        rx_bytes: containerStats.networks.eth0.rx_bytes,
                        tx_bytes: containerStats.networks.eth0.tx_bytes
                    };

                    containerDetails.push({
                        name: containerName,
                        id: container.Id,
                        state: container.State,
                        cpu_usage: containerStats.cpu_stats.cpu_usage.total_usage,
                        mem_usage: containerStats.memory_stats.usage,
                        mem_limit: containerStats.memory_stats.limit,
                        net_rx: containerStats.networks.eth0.rx_bytes,
                        net_tx: containerStats.networks.eth0.tx_bytes,
                        current_net_rx: currentNetRx,
                        current_net_tx: currentNetTx,
                        networkMode: networkMode,
                        link: config.link || '',
                        icon: config.icon || ''
                    });
                } catch (err) {
                    logger.error(`Failed to fetch detailed stats for container ${container.Names[0]} (${container.Id}): ${err.message}`);
                }
            } else {
                // Update counts for stopped and exited containers
                if (state === 'exited') {
                    exitedContainers++;
                } else if (state === 'paused' || state === 'created') {
                    stoppedContainers++;
                }

                containerDetails.push({
                    name: container.Names[0].replace('/', ''),
                    id: container.Id,
                    state: container.State,
                    cpu_usage: null, // No CPU usage data
                    mem_usage: null, // No memory usage data
                    mem_limit: null, // No memory limit data
                    net_rx: null,   // No network RX data
                    net_tx: null,   // No network TX data
                    current_net_rx: null, // No current network RX data
                    current_net_tx: null, // No current network TX data
                    networkMode: container.HostConfig.NetworkMode,
                    link: (containerConfigs[container.Names[0].replace('/', '')] || {}).link || '',
                    icon: (containerConfigs[container.Names[0].replace('/', '')] || {}).icon || ''
                });
            }
        }

        const detailedStats = {
            total_containers: totalContainers,
            running_containers: runningContainers,
            stopped_containers: stoppedContainers,
            exited_containers: exitedContainers,
            total_cpu_usage: totalCpuUsage,
            total_mem_usage: totalMemUsage,
            total_mem_limit: totalMemLimit,
            total_net_rx: totalNetRx,
            total_net_tx: totalNetTx,
            total_current_net_rx: totalCurrentNetRx,
            total_current_net_tx: totalCurrentNetTx,
            container_details: containerDetails
        };

        latestDetailedStats[hostName] = detailedStats;
        logger.info(`Fetched detailed stats for ${totalContainers} containers from ${hostName}`);
    } catch (err) {
        latestDetailedStats[hostName] = { error: `Failed to connect: ${err.message}` };
        logger.error(`Failed to fetch containers from ${hostName}: ${err.message}`);
    }
}


async function handleHostQueue(hostName, hostConfig) {
    while (true) {
        await queryDetailedStats(hostName, hostConfig);
        await new Promise(resolve => setTimeout(resolve, queryInterval));
    }
}

function initializeHostQueues() {
    for (const [hostName, hostConfig] of Object.entries(hosts)) {
        hostQueues[hostName] = handleHostQueue(hostName, hostConfig);
    }
}

function reloadConfig() {
    try {
        config = yaml.load('./config/hosts.yaml');
        hosts = config.hosts;
        containerConfigs = config.container || {};
        maxlogsize = config.log.logsize || 1;
        LogAmount = config.log.LogCount || 5;
        queryInterval = config.mintimeout || 5000;

        logger.info('Configuration reloaded successfully.');

        initializeHostQueues();
    } catch (err) {
        logger.error(`Failed to reload configuration: ${err.message}`);
    }
}

fs.watchFile('./config/hosts.yaml', (curr, prev) => {
    if (curr.mtime !== prev.mtime) {
        logger.info('Detected change in configuration file. Reloading...');
        reloadConfig();
    }
});

app.get('/stats', authenticateHeader, (req, res) => {
    res.json(latestDetailedStats);
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
    logger.info(`Allowed localhost traffic: ${allowLocalhost}`);
    logger.info(`JSON Logging? (True/False): ${jsonLogging}`);
    logger.info(`Secret Key: ${key}`)
    logger.info("Press Ctrl+C to stop the server.");
    logger.info('========================================================================')
});

initializeHostQueues();
