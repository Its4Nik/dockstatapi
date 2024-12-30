import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import fs from "fs/promises";
import logger from "../../utils/logger";
const passwordFile: string = "./src/data/password.json";
const passwordBool: string = "./src/data/usePassword.txt";
const saltRounds: number = 10;
const router: Router = Router();

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

/**
 * @swagger
 * /auth/enable:
 *   post:
 *     summary: Enable authentication by setting a password
 *     tags: [Authentication]
 *     parameters:
 *       - name: password
 *         in: query
 *         required: true
 *     responses:
 *       200:
 *         description: Authentication enabled.
 *       400:
 *         description: Password is required.
 *       500:
 *         description: Error saving password.
 */
router.post("/enable", async (req: Request, res: Response): Promise<void> => {
  try {
    const password = req.query.password as string;

    if (await authEnabled()) {
      logger.error(
        "Password Authentication is already enabled, please deactivate it first",
      );
      res.status(401).json({
        message:
          "Password Authentication is already enabled, please deactivate it first",
      });
      return;
    }

    if (!password) {
      logger.error("Password is required");
      res.status(400).json({ message: "Password is required" });
      return;
    }

    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, salt);

    const passwordData = { hash, salt };
    writePasswordFile(JSON.stringify(passwordData));

    res
      .status(200)
      .json({ message: "Password Authentication enabled successfully" });
  } catch (error: unknown) {
    logger.error(`Error enabling password authentication: ${error as Error}`);
    res.status(500).json({ message: "An error occurred" });
  }
});

/**
 * @swagger
 * /auth/disable:
 *   post:
 *     summary: Disable authentication by providing the existing password
 *     tags: [Authentication]
 *     parameters:
 *       - name: password
 *         in: query
 *         required: true
 *     responses:
 *       200:
 *         description: Authentication disabled.
 *       400:
 *         description: Password is required.
 *       401:
 *         description: Invalid password.
 *       500:
 *         description: Error disabling authentication.
 */
router.post("/disable", async (req: Request, res: Response): Promise<void> => {
  try {
    const password = req.query.password as string;

    if (!password) {
      logger.error("Password is required!");
      res.status(400).json({ message: "Password is required" });
      return;
    }

    const storedData = JSON.parse(await readPasswordFile());

    const isPasswordValid = await bcrypt.compare(password, storedData.hash);
    if (!isPasswordValid) {
      logger.error("Invalid password");
      res.status(401).json({ message: "Invalid password" });
      return;
    }

    await setFalse(); // Assuming this is an async function
    res.status(200).json({ message: "Authentication disabled" });
  } catch (error: unknown) {
    logger.error(`Error disabling authentication: ${error as Error}`);
    res.status(500).json({ message: "An error occurred" });
  }
});

export default router;
