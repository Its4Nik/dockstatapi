import db from "../config/db";
import fetchAllContainers from "../utils/containerService";
import logger from "../utils/logger";
import fs from "fs";
const filePath = "./src/data/states.json";

let previousState: { [key: string]: any } = {};

interface Container {
  name: string;
  id: string;
  state: string;
  hostName: string;
}

interface AllContainerData {
  [host: object]: Container[];
}

const fetchData = async (): Promise<void> => {
  try {
    const allContainerData: AllContainerData =
      (await fetchAllContainers()) || {};

    if (process.env.OFFLINE === "true") {
      logger.info("No new data inserted --- OFFLINE MODE");
    } else {
      db.run(
        `INSERT INTO data (info) VALUES (?)`,
        [JSON.stringify(allContainerData)],
        function (error) {
          if (error) {
            logger.error("Error inserting data:", error.message);
            return;
          }
          logger.info(`Data inserted with ID: ${this.lastID}`);
        },
      );
    }

    const containerStatus: AllContainerData = {};

    Object.keys(allContainerData).forEach((host) => {
      containerStatus[host] = (allContainerData[host] || []).map(
        (container: Container) => ({
          name: container.name,
          id: container.id,
          state: container.state,
          host: container.hostName,
        }),
      );
    });

    if (fs.existsSync(filePath)) {
      const fileData = fs.readFileSync(filePath, "utf8");
      previousState = fileData ? JSON.parse(fileData) : {};
    }

    if (JSON.stringify(previousState) !== JSON.stringify(containerStatus)) {
      fs.writeFileSync(filePath, JSON.stringify(containerStatus, null, 2));
      logger.info(`Container states saved to ${filePath}`);
      // TODO: Add logic + notification levels per service
    } else {
      logger.info("No state change detected, notifications not triggered.");
    }
  } catch (error: any) {
    logger.error(
      `Error fetching data: ${JSON.stringify(error)} \nStack trace: ${error.stack}`,
    );
  }
};

export default fetchData;
