const yaml = require('yamljs');
const logger = require('./logger');

try {
    tags = yaml.load('./config/hosts.yaml').tags;
} catch (err) {
    logger.error(`Failed to load tags.yaml: ${err.message}`);
}

logger.debug(tags)