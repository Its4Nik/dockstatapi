const fs = require("fs");
const path = require("path");
const logger = require("../utils/logger");

const LOG_FILE_PATH = path.join(__dirname, "../logs/hostStats.json");

function writeOfflineLog(message) {
  try {
    if (!fs.existsSync(LOG_FILE_PATH)) {
      fs.writeFileSync(LOG_FILE_PATH, message);
    }
  } catch (error) {
    logger.error("Error writing one time reference log: ", error);
  }
}

function readOfflineLog() {
  fs.readFile(LOG_FILE_PATH, "utf-8", (err, data) => {
    if (err) {
      logger.error("Error reading offline log:", err);
    }

    logger.debug("Returning data:", data);
    return data;
  });
}

module.exports = {
  writeOfflineLog,
  readOfflineLog,
};
