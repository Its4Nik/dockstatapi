import fs from "fs";
import logger from "../utils/logger";
import os from "os";

const userConf = "./src/data/user.conf";
const inDocker: boolean = process.env.RUNNING_IN_DOCKER ? true : false;
const version: string = process.env.VERSION ? process.env.VERSION : "unknown";

function writeUserConf() {
  let previousConfig = null;
  let shouldRewriteConfig = false;

  const installationDetails = {
    installedAt: new Date().toISOString(),
    backendVersion: version,
    inDocker: inDocker,
    installedBy: os.userInfo().username,
    platform: os.platform(),
    arch: os.arch(),
  };

  if (fs.existsSync(userConf)) {
    try {
      previousConfig = JSON.parse(fs.readFileSync(userConf, "utf-8"));
      if (previousConfig.backendVersion !== version) {
        shouldRewriteConfig = true;
        logger.debug(
          "Version change detected. Rewriting configuration file...",
        );
      } else {
        logger.debug("No version change detected. Skipping re-initialization.");
      }
    } catch (error) {
      logger.error(
        "Error reading the configuration file. Rewriting it...",
        error,
      );
      shouldRewriteConfig = true;
    }
  } else {
    logger.debug("Configuration file not found. Creating a new one...");
    shouldRewriteConfig = true;
  }

  if (shouldRewriteConfig) {
    fs.writeFileSync(userConf, JSON.stringify(installationDetails, null, 2));
    logger.debug("Configuration file created/updated:", userConf);
  }

  const startDetails = {
    startedAt: new Date().toISOString(),
    backendVersion: version,
  };

  logger.info(
    `Starting...
At: ${startDetails.startedAt}
Version: ${startDetails.backendVersion}
Docker: ${installationDetails.inDocker}
Installed as: ${installationDetails.installedBy}
Platform: ${installationDetails.platform}
Arch: ${installationDetails.arch}`,
  );
}

export default writeUserConf;
