import fs from "fs";
import logger from "../utils/logger";

const LOG_FILE_PATH = "./logs/hostStats.json";

async function writeOfflineLog(message: string) {
  try {
    if (!fs.existsSync(LOG_FILE_PATH)) {
      await fs.promises.writeFile(LOG_FILE_PATH, message);
    }
  } catch (error: any) {
    logger.error("Error writing one time reference log: ", error);
  }
}

async function readOfflineLog() {
  try {
    const data = await fs.promises.readFile(LOG_FILE_PATH, "utf-8");
    logger.debug("Returning data:", data);
    return data;
  } catch (error: any) {
    logger.error("Error reading offline log:", error);
  }
}

export { writeOfflineLog, readOfflineLog };
