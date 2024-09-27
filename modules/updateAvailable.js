const logger = require('../logger');

async function getData(target, url) {

    if (url === 'null') {
        return false;
    }
    else {
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
                    return images.hasOwnProperty(target);
                }
            }
        } catch (error) {
            logger.error(error.message);
        }
    }
}

module.exports = getData;
