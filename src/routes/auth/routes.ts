import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import fs from "fs/promises";
import logger from "../../utils/logger";
const passwordFile: string = "./src/middleware/password.json";
const passwordBool: string = "./src/middleware/usePassword.txt";
const saltRounds: number = 10;
const router: Router = Router();

let passwordData: {
  hash: string;
  salt: string;
};

async function authEnabled(): Promise<boolean> {
  let isAuthEnabled: boolean = false;
  let data: string = "";
  try {
    data = await fs.readFile(passwordBool, "utf8");
    isAuthEnabled = data.trim() === "true";
    return isAuthEnabled;
  } catch (error: any) {
    logger.error("Error reading file: ", error);
    return isAuthEnabled;
  }
}

async function readPasswordFile() {
  let data: string = "";
  try {
    data = await fs.readFile(passwordFile, "utf8");
    return data;
  } catch (error: any) {
    logger.error("Could not read saved password: ", error);
    return data;
  }
}

async function writePasswordFile(passwordData: string) {
  try {
    await fs.writeFile(passwordFile, passwordData);
    setTrue();
    logger.debug("Authentication enabled");
    return "Authentication enabled";
  } catch (error: any) {
    logger.error("Error writing password file:", error);
    return error;
  }
}

async function setTrue() {
  try {
    await fs.writeFile(passwordBool, "true", "utf8");
    logger.info(`Enabled authentication`);
    return;
  } catch (error: any) {
    logger.error("Error writing to the file:", error);
    return;
  }
}

async function setFalse() {
  try {
    await fs.writeFile(passwordBool, "false", "utf8");
    logger.info(`Disabled authentication`);
    return;
  } catch (error: any) {
    logger.error("Error writing to the file:", error);
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
router.post("/enable", async (req: Request, res: Response) => {
  const password = req.query.password as string;
  if (await authEnabled()) {
    logger.error(
      "Password Authentication is already enabled, please deactivate it first",
    );
    return res.status(401).json({
      message:
        "Password Authentication is already enabled, please deactivate it first",
    });
  }

  if (!password) {
    logger.error("Password is required");
    return res.status(400).json({ message: "Password is required" });
  }

  bcrypt.genSalt(saltRounds, (err, salt) => {
    if (err) {
      logger.error("Error generating salt");
      return res.status(500).json({ message: "Error generating salt" });
    }

    bcrypt.hash(password, salt, (err, hash) => {
      if (err) {
        logger.error("Error hashing password");
        return res.status(500).json({ message: "Error hashing password" });
      }

      passwordData = { hash, salt };
      writePasswordFile(JSON.stringify(passwordData));
    });
  });
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
router.post("/disable", async (req: Request, res: Response) => {
  const password = req.query.password as string;
  if (!password) {
    logger.error("Password is required!");
    return res.status(400).json({ message: "Password is required" });
  }

  await new Promise(async (resolve, reject) => {
    try {
      const storedData = JSON.parse(await readPasswordFile());
      bcrypt.compare(
        password,
        storedData.hash,
        (compareErr: any, result: boolean) => {
          if (compareErr) {
            logger.error("Error validating password");
            return res
              .status(500)
              .json({ message: "Error validating password" });
          }
          if (!result) {
            logger.error("Invalid password");
            return res.status(401).json({ message: "Invalid password" });
          }

          setFalse();
          res.json({ message: "Authentication disabled" });
          resolve(storedData);
          return res.status(200).json({ message: "Authentication enabled" });
        },
      );
    } catch (error: any) {
      reject(error);
    }
  });
});

export default router;
