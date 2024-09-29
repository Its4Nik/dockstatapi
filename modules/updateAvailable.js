const logger = require('../logger');

async function getData(target, url) {
    if (target.startsWith("docker.io/library/")) {
        logger.debug("Replacing docker.io/library")
        target = target.replace("docker.io/library/", "")
    }

    if (url === 'null') {
        return false;
    } else {
        logger.debug('Looking for ' + target + ' as a match')
        try {
            const response = await fetch(`${url}/json`, {
                method: "GET"
            });

            if (!response.ok) {
                throw new Error(`Response status: ${response.status}`);
            }

            const json = await response.json();

            const images = json.images;

            for (const image in images) {
                if (target === image) {
                    logger.debug('Found: ' + image)
                    return images.hasOwnProperty(target);
                }
            }
        } catch (error) {
            logger.error(error.message);
        }
    }
}

module.exports = getData;
