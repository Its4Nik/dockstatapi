import logger from "../utils/logger";
import fs from "fs";
import path from "path";

interface HighAvailabilityConfig {
  master: boolean;
  nodes: string[];
}

const dataPath: string = "./src/data/highAvailibility.json";

const master: string | undefined = process.env.IS_MASTER;
const haHost: string | undefined = process.env.HA_NODE;

async function writeConfig(data: HighAvailabilityConfig): Promise<void> {
  try {
    const dirPath = path.dirname(dataPath);
    await fs.promises.mkdir(dirPath, { recursive: true });

    const jsonData = JSON.stringify(data, null, 2);
    await fs.promises.writeFile(dataPath, jsonData);

    logger.debug("HA-Config has been written.");
  } catch (error) {
    logger.error(`Error writing config: ${(error as Error).message}`);
  }
}

async function readConfig(): Promise<HighAvailabilityConfig | null> {
  try {
    logger.debug("Reading HA-Config");
    const data: HighAvailabilityConfig = JSON.parse(
      fs.readFileSync(dataPath, "utf-8"),
    );
    return data;
  } catch (error: any) {
    logger.error(`Error reading HA-Config: ${(error as Error).message}`);
    return null;
  }
}

async function configureHighAvailability(): Promise<void> {
  const configData: HighAvailabilityConfig = {
    master: master === "true",
    nodes: haHost ? haHost.split(",").map((host: string) => host.trim()) : [],
  };

  if (!master || !haHost) {
    logger.warn(
      `IS_MASTER and/or HA_NODE is unset, not using high availability. Please see the documentation on how to setup high availability nodes`,
    );
  } else {
    await writeConfig(configData);
  }
}

export { readConfig, configureHighAvailability };
