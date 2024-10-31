// controllers/fetchData.js
const db = require("../config/db");
const { fetchAllContainers } = require("../utils/containerService");
const logger = require("./../utils/logger");
const path = require("path");
const fs = require("fs");

const fetchData = async () => {
  try {
    const allContainerData = await fetchAllContainers();
    const data = allContainerData;

    if (process.env.OFFLINE === "true") {
      logger.info("No new data inserted --- OFFLINE MODE");
    } else {
      // Insert data into the SQLite database
      db.run(
        `INSERT INTO data (info) VALUES (?)`,
        [JSON.stringify(data)],
        function (error) {
          if (error) {
            logger.info("Error inserting data:", error.message);
            console.error("Error inserting data:", error.message);
            return;
          }
          logger.info(`Data inserted with ID: ${this.lastID}`);
        },
      );
    }
  } catch (error) {
    logger.error("Error fetching data:", error.message);
  }
};

module.exports = fetchData;
