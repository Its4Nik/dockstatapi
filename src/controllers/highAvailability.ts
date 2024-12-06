import logger from "../utils/logger";
import fs from "fs";
import chokidar from "chokidar";
import path from "path";
import { Request, Response } from "express";

interface HighAvailabilityConfig {
  active: boolean;
  master: boolean;
  nodes: string[];
}

const dataPath: string = "./src/data/highAvailibility.json";
const useUnsafeConnection = process.env.HA_UNSAFE || "false";

// List of configuration files to monitor and synchronize
const configFiles: string[] = [
  "./src/data/highAvailibility.json",
  "./src/config/someOtherConfig.json",
];

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

async function prepareFilesForSync(): Promise<Record<string, string>> {
  const fileData: Record<string, string> = {};
  try {
    for (const filePath of configFiles) {
      const content = await fs.promises.readFile(filePath, "utf-8");
      fileData[filePath] = content;
    }
  } catch (error) {
    logger.error(`Error preparing files for sync: ${(error as Error).message}`);
  }
  return fileData;
}

async function synchronizeFilesWithNodes(): Promise<void> {
  try {
    const haConfig = await readConfig();
    if (!haConfig || !haConfig.master || haConfig.nodes.length === 0) {
      logger.warn("No slave nodes to synchronize with.");
      return;
    }

    const files = await prepareFilesForSync();

    for (const node of haConfig.nodes) {
      let nodeUrl = "";
      if (useUnsafeConnection == "true") {
        nodeUrl = `http://${node}/ha/sync`;
      } else {
        nodeUrl = `https://${node}/ha/sync`;
      }
      logger.info(`Synchronizing files with node: ${node}`);

      const response = await fetch(nodeUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files }),
      });

      if (response.ok) {
        logger.info(`Files synchronized successfully with node: ${node}`);
      } else {
        logger.error(
          `Failed to synchronize files with node ${node}. Status: ${response.status}`,
        );
      }
    }
  } catch (error) {
    logger.error(
      `Error during file synchronization: ${(error as Error).message}`,
    );
  }
}

function monitorConfigFiles(): void {
  const watcher = chokidar.watch(configFiles, { persistent: true });

  watcher
    .on("change", async (filePath) => {
      logger.info(`File changed: ${filePath}. Initiating synchronization.`);
      await synchronizeFilesWithNodes();
    })
    .on("error", (error) => {
      logger.error(`Error watching files: ${(error as Error).message}`);
    });

  logger.info("Started monitoring configuration files for changes.");
}

export {
  HighAvailabilityConfig,
  writeConfig,
  readConfig,
  prepareFilesForSync,
  synchronizeFilesWithNodes,
  monitorConfigFiles,
};
