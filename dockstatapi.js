const express = require('express');
const path = require('path');
const yaml = require('yamljs');
const Docker = require('dockerode');
const cors = require('cors');
const fs = require('fs');
const logger = require('./logger');
const { exec } = require('child_process');
const app = express();
const port = 7070;
const key = process.env.SECRET || 'CHANGE-ME';
const jsonLogging = process.env.JSON_LOGGING || 'True'
const skipAuth = process.env.SKIP_AUTH || 'False'

let config = yaml.load('./config/hosts.yaml');
let hosts = config.hosts;
let containerConfigs = config.container || {};
let maxlogsize = config.log.logsize || 1;
let LogAmount = config.log.LogCount || 5;
let queryInterval = config.mintimeout || 5000;
let latestStats = {};
let hostQueues = {};
let previousNetworkStats = {};
let generalStats = {};
let previousContainerStates = {};
let previousRunningContainers = {};

app.use(cors());
app.use(express.json());

const authenticateHeader = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (skipAuth === 'True') {
        next();
    } else {
        if (!authHeader || authHeader !== key) {
            logger.error(`${authHeader} != ${key}`);
            return res.status(401).json({ error: "Unauthorized" });
        }
        else {
            logger.info('Client authenticated! 👍');
            next();
        }
    }
};

function createDockerClient(hostConfig) {
    return new Docker({
        host: hostConfig.url,
        port: hostConfig.port,
    });
}

function getTagColor(tag) {
    const tagsConfig = config.tags || {};
    return tagsConfig[tag] || '';
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

async function handleContainerStateChanges(hostName, currentContainers) {
    const currentRunningContainers = currentContainers
        .filter(container => container.state === 'running')
        .reduce((map, container) => {
            map[container.id] = container;
            return map;
        }, {});

    const previousHostContainers = previousRunningContainers[hostName] || {};

    // Check for containers that have been removed or exited
    for (const containerId of Object.keys(previousHostContainers)) {
        const container = previousHostContainers[containerId];
        if (!currentRunningContainers[containerId]) {
            if (container.state === 'running') {
                // Container removed
                exec(`bash ./scripts/notify.sh REMOVE ${containerId} ${container.name} ${hostName} ${container.state}`, (error, stdout, stderr) => {
                    if (error) {
                        logger.error(`Error executing REMOVE notify.sh: ${error.message}`);
                    } else {
                        logger.info(`Container removed: ${container.name} (${containerId}) from host ${hostName}`);
                        logger.info(stdout);
                    }
                });
            }
            else if (container.state === 'exited') {
                // Container exited
                exec(`bash ./scripts/notify.sh EXIT ${containerId} ${container.name} ${hostName} ${container.state}`, (error, stdout, stderr) => {
                    if (error) {
                        logger.error(`Error executing EXIT notify.sh: ${error.message}`);
                    } else {
                        logger.info(`Container exited: ${container.name} (${containerId}) from host ${hostName}`);
                        logger.info(stdout);
                    }
                });
            }
        }
    }

    // Check for new containers or state changes
    for (const containerId of Object.keys(currentRunningContainers)) {
        const container = currentRunningContainers[containerId];
        const previousContainer = previousHostContainers[containerId];

        if (!previousContainer) {
            // New container added
            exec(`bash ./scripts/notify.sh ADD ${containerId} ${container.name} ${hostName} ${container.state}`, (error, stdout, stderr) => {
                if (error) {
                    logger.error(`Error executing ADD notify.sh: ${error.message}`);
                } else {
                    logger.info(`Container added: ${container.name} (${containerId}) to host ${hostName}`);
                    logger.info(stdout);
                }
            });
        } else if (previousContainer.state !== container.state) {
            // Container state has changed
            const newState = container.state;
            if (newState === 'exited') {
                exec(`bash ./scripts/notify.sh EXIT ${containerId} ${container.name} ${hostName} ${newState}`, (error, stdout, stderr) => {
                    if (error) {
                        logger.error(`Error executing EXIT notify.sh: ${error.message}`);
                    } else {
                        logger.info(`Container exited: ${container.name} (${containerId}) from host ${hostName}`);
                        logger.info(stdout);
                    }
                });
            } else {
                // Any other state change
                exec(`bash ./scripts/notify.sh ANY ${containerId} ${container.name} ${hostName} ${newState}`, (error, stdout, stderr) => {
                    if (error) {
                        logger.error(`Error executing ANY notify.sh: ${error.message}`);
                    } else {
                        logger.info(`Container state changed to ${newState}: ${container.name} (${containerId}) from host ${hostName}`);
                        logger.info(stdout);
                    }
                });
            }
        }
    }

    // Update the previous state for the next comparison
    previousRunningContainers[hostName] = currentRunningContainers;
}

async function queryHostStats(hostName, hostConfig) {
    logger.debug(`Querying Docker stats for host: ${hostName} (${hostConfig.url}:${hostConfig.port})`);

    const docker = createDockerClient(hostConfig);

    try {
        const info = await docker.info();
        const totalMemory = info.MemTotal;
        const totalCPUs = info.NCPU;

        const containers = await docker.listContainers({ all: true });

        const statsPromises = containers.map(async (container) => {
            try {
                const containerName = container.Names[0].replace('/', '');
                const containerState = container.State;

                if (containerState !== 'running') {
                    previousContainerStates[container.Id] = containerState;
                    return {
                        name: containerName,
                        id: container.Id,
                        hostName: hostName,
                        state: containerState,
                        cpu_usage: 0,
                        mem_usage: 0,
                        mem_limit: 0,
                        net_rx: 0,
                        net_tx: 0,
                        current_net_rx: 0,
                        current_net_tx: 0,
                        networkMode: container.HostConfig.NetworkMode,
                        link: containerConfigs[containerName]?.link || '',
                        icon: containerConfigs[containerName]?.icon || '',
                        tags: getTagColor(containerConfigs[containerName]?.tags || ''),
                    };
                }

                // Fetch container stats for running containers
                const containerStats = await getContainerStats(docker, container.Id);

                const containerCpuUsage = containerStats.cpu_stats.cpu_usage.total_usage;
                const containerMemoryUsage = containerStats.memory_stats.usage;

                const networkMode = container.HostConfig.NetworkMode;
                let netRx = 0, netTx = 0, currentNetRx = 0, currentNetTx = 0;

                if (networkMode !== 'host' && containerStats.networks?.eth0) {
                    const previousStats = previousNetworkStats[container.Id] || { rx_bytes: 0, tx_bytes: 0 };
                    currentNetRx = containerStats.networks.eth0.rx_bytes - previousStats.rx_bytes;
                    currentNetTx = containerStats.networks.eth0.tx_bytes - previousStats.tx_bytes;

                    previousNetworkStats[container.Id] = {
                        rx_bytes: containerStats.networks.eth0.rx_bytes,
                        tx_bytes: containerStats.networks.eth0.tx_bytes,
                    };

                    netRx = containerStats.networks.eth0.rx_bytes;
                    netTx = containerStats.networks.eth0.tx_bytes;
                }

                previousContainerStates[container.Id] = containerState;

                const config = containerConfigs[containerName] || {};
                const tagArray = (config.tags || '')
                    .split(',')
                    .map(tag => {
                        const color = getTagColor(tag);
                        return color ? `${tag}:${color}` : tag;
                    })
                    .join(',');

                return {
                    name: containerName,
                    id: container.Id,
                    hostName: hostName,
                    state: containerState,
                    cpu_usage: containerCpuUsage,
                    mem_usage: containerMemoryUsage,
                    mem_limit: containerStats.memory_stats.limit,
                    net_rx: netRx,
                    net_tx: netTx,
                    current_net_rx: currentNetRx,
                    current_net_tx: currentNetTx,
                    networkMode: networkMode,
                    link: config.link || '',
                    icon: config.icon || '',
                    tags: tagArray,
                };
            } catch (err) {
                logger.error(`Failed to fetch stats for container ${container.Names[0]} (${container.Id}): ${err.message}`);
                return null;
            }
        });

        const hostStats = await Promise.all(statsPromises);
        const validStats = hostStats.filter(stat => stat !== null);

        const totalCpuUsage = validStats.reduce((acc, container) => acc + parseFloat(container.cpu_usage), 0);
        const totalMemoryUsage = validStats.reduce((acc, container) => acc + container.mem_usage, 0);
        const memoryUsagePercent = ((totalMemoryUsage / totalMemory) * 100).toFixed(2);

        generalStats[hostName] = {
            containerCount: validStats.length,
            totalCPUs: totalCPUs,
            totalMemory: totalMemory,
            cpuUsage: totalCpuUsage,
            memoryUsage: memoryUsagePercent,
        };

        latestStats[hostName] = validStats;

        logger.debug(`Fetched stats for ${validStats.length} containers from ${hostName}`);

        // Handle container state changes
        await handleContainerStateChanges(hostName, validStats);

    } catch (err) {
        logger.error(`Failed to fetch containers from ${hostName}: ${err.message}`);
    }
}


async function handleHostQueue(hostName, hostConfig) {
    while (true) {
        await queryHostStats(hostName, hostConfig);
        await new Promise(resolve => setTimeout(resolve, queryInterval));
    }
}

// Initialize the host queues
function initializeHostQueues() {
    for (const [hostName, hostConfig] of Object.entries(hosts)) {
        hostQueues[hostName] = handleHostQueue(hostName, hostConfig);
    }
}

// Dynamically reloads the yaml file
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

// Watch the YAML file for changes and reload the config
fs.watchFile('./config/hosts.yaml', (curr, prev) => {
    if (curr.mtime !== prev.mtime) {
        logger.info('Detected change in configuration file. Reloading...');
        reloadConfig();
    }
});

// Endpoint to get stats
app.get('/stats', authenticateHeader, (req, res) => {
    res.json(latestStats);
});

// Endpoint for general Host based statistics
app.get('/hosts', authenticateHeader, (req, res) => {
    res.json(generalStats);
});

// Read Only config endpoint
app.get('/config', authenticateHeader, (req, res) => {
    const filePath = path.join(__dirname, './config/hosts.yaml');
    res.set('Content-Type', 'text/plain'); // Keep as plain text
    fs.readFile(filePath, 'utf8', (err, data) => {
        logger.debug('Requested config file: ' + filePath);
        if (err) {
            logger.error(err);
            res.status(500).send('Error reading file');
        } else {
            res.send(data);
        }
    });
});

app.get('/', (req, res) => {
    logger.debug("Redirected client from '/' to '/stats'.");
    res.redirect(301, '/stats');
});

app.get('/status', (req, res) => {
    logger.info("Healthcheck requested");
    return res.status(200).send('UP');
});

// Start the server and log the startup message
app.listen(port, () => {
    logger.info('=============================== DockStat ===============================')
    logger.info(`DockStatAPI is running on http://localhost:${port}/stats`);
    logger.info(`Minimum timeout between stats queries is: ${queryInterval} milliseconds`);
    logger.info(`The max size for Log files is: ${maxlogsize}MB`)
    logger.info(`The amount of log files to keep is: ${LogAmount}`);
    logger.info(`JSON Logging (True/False): ${jsonLogging}`)
    logger.info(`Secret Key: ${key}`)
    logger.info("Press Ctrl+C to stop the server.");
    logger.info('========================================================================')
});

initializeHostQueues();
