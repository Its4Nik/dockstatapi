import bcrypt from "bcrypt";
import fs from "fs";
import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";
import { rateLimitedReadFile } from "../utils/rateLimitReadFile";

const passwordFile = "./src/data/password.json";
const passwordBool = "./src/data/usePassword.txt";

async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authStatusData = await fs.promises.readFile(passwordBool, "utf8");
    const isAuthEnabled = authStatusData.trim() === "true";

    if (!isAuthEnabled) {
      logger.warn("You are not using authentication, please enable it.");
      logger.debug("Authentication disabled, skipping login process...");
      return next();
    }

    const providedPassword = req.headers["x-password"];
    if (!providedPassword) {
      logger.error("Password required - Denied");
      res.status(401).json({ message: "Password required" });
      return;
    }

    const passwordData = await rateLimitedReadFile(passwordFile);
    const storedData = JSON.parse(passwordData);

    const passwordMatch = await bcrypt.compare(
      providedPassword as string,
      storedData.hash,
    );
    if (!passwordMatch) {
      logger.error("Invalid Password - Denied access");
      res.status(401).json({ message: "Invalid password" });
      return;
    }

    logger.debug("Authentication succesfull");
    next();
  } catch (error: any) {
    logger.error("Error in authMiddleware:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export default authMiddleware;
