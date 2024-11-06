const db = require("../config/db");
const { fetchAllContainers } = require("../utils/containerService");
const logger = require("./../utils/logger");
const path = require("path");
const fs = require("fs");
const { exec } = require("child_process");

const fetchData = async () => {
  try {
    const allContainerData = await fetchAllContainers();
    const data = allContainerData;

    if (process.env.OFFLINE === "true") {
      logger.info("No new data inserted --- OFFLINE MODE");
    } else {
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

    const containerStatus = {};
    Object.keys(allContainerData).forEach((host) => {
      containerStatus[host] = allContainerData[host].map((container) => ({
        name: container.name,
        id: container.id,
        state: container.state,
        host: container.hostName,
      }));
    });

    const filePath = path.resolve(__dirname, "../data/states.json");
    let previousState = {};

    if (fs.existsSync(filePath)) {
      previousState = JSON.parse(fs.readFileSync(filePath, "utf8"));
    }

    if (JSON.stringify(previousState) !== JSON.stringify(containerStatus)) {
      fs.writeFileSync(filePath, JSON.stringify(containerStatus, null, 2));
      logger.info(`Container states saved to ${filePath}`);
      //TODO: logic + notification levels per service
    } else {
      logger.info("No state change detected, notifications not triggered.");
    }
  } catch (error) {
    logger.error("Error fetching data:", error.message);
  }
};

module.exports = fetchData;
