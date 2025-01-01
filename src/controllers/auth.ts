import fs from "fs/promises";
import logger from "../utils/logger";
const passwordFile: string = "./src/data/password.json";
const passwordBool: string = "./src/data/usePassword.txt";

async function authEnabled(): Promise<boolean> {
  let isAuthEnabled: boolean = false;
  let data: string = "";
  try {
    data = await fs.readFile(passwordBool, "utf8");
    isAuthEnabled = data.trim() === "true";
    return isAuthEnabled;
  } catch (error: unknown) {
    logger.error("Error reading file: ", error as Error);
    return isAuthEnabled;
  }
}

async function readPasswordFile() {
  let data: string = "";
  try {
    data = await fs.readFile(passwordFile, "utf8");
    return data;
  } catch (error: unknown) {
    logger.error("Could not read saved password: ", error as Error);
    return data;
  }
}

async function writePasswordFile(passwordData: string) {
  try {
    await fs.writeFile(passwordFile, passwordData);
    setTrue();
    logger.debug("Authentication enabled");
    return "Authentication enabled";
  } catch (error: unknown) {
    logger.error("Error writing password file:", error as Error);
    return error;
  }
}

async function setTrue() {
  try {
    await fs.writeFile(passwordBool, "true", "utf8");
    logger.info(`Enabled authentication`);
    return;
  } catch (error: unknown) {
    logger.error("Error writing to the file:", error as Error);
    return;
  }
}

async function setFalse() {
  try {
    await fs.writeFile(passwordBool, "false", "utf8");
    logger.info(`Disabled authentication`);
    return;
  } catch (error: unknown) {
    logger.error("Error writing to the file:", error as Error);
    return;
  }
}

export { authEnabled, readPasswordFile, writePasswordFile, setFalse };
