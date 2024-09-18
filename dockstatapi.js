const express = require('express');
const path = require('path');
const yaml = require('yamljs');
const Docker = require('dockerode');
const cors = require('cors');
const fs = require('fs');
const logger = require('./logger');
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

async function getContainerStats(docker, containerId) {
    const container = docker.getContainer(containerId);
    return new Promise((resolve, reject) => {
        container.stats({ stream: false }, (err, stats) => {
            if (err) return reject(err);
            resolve(stats);
        });
    });
}

function getTagColor(tag) {
    const tagsConfig = config.tags || {};
    return tagsConfig[tag] || '';
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
                const networkMode = container.HostConfig.NetworkMode;

                if (networkMode !== "host") {
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

                const containerName = container.Names[0].replace('/', '');
                const config = containerConfigs[containerName] || {};

                const tagArray = (config.tags || '')
                    .split(',')
                    .map(tag => {
                        const color = getTagColor(tag);
                        return color ? `${tag}:${color}` : tag;
                    })
                    .join(',');

                const usage = {
                    name: containerName,
                    id: container.Id,
                    hostName: hostName,
                    state: container.State,
                    cpu_usage: containerStats.cpu_stats.cpu_usage.total_usage,
                    mem_usage: containerStats.memory_stats.usage,
                    mem_limit: containerStats.memory_stats.limit,
                    net_rx: netRx || '0',
                    net_tx: netTx || '0',
                    current_net_rx: currentNetRx || '0',
                    current_net_tx: currentNetTx || '0',
                    networkMode: networkMode,
                    link: config.link || '',
                    icon: config.icon || '',
                    tags: tagArray,
                };

                hostStats.push(usage);
            } catch (err) {
                logger.error(`Failed to fetch stats for container ${container.Names[0]} (${container.Id}): ${err.message}`);
            }
        }

        latestStats[hostName] = hostStats;
        logger.info(`Fetched stats for ${containers.length} containers from ${hostName}`);
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
