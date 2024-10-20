const db = require('../config/db');
const { fetchAllContainers } = require('../utils/containerService');
const logger = require('./../utils/logger');

const fetchData = async () => {
    try {
        const allContainerData = await fetchAllContainers();
        const data = allContainerData;

        // Insert data into the SQLite database
        db.run(`INSERT INTO data (info) VALUES (?)`, [JSON.stringify(data)], function (err) {
            if (err) {
                logger.info('Error inserting data:', err.message);
                return console.error('Error inserting data:', err.message);
            }
            logger.info(`Data inserted with ID: ${this.lastID}`);
        });
    } catch (error) {
        logger.error('Error fetching data:', error.message);
    }
};

module.exports = fetchData;