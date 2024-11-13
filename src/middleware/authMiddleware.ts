import bcrypt from "bcrypt";
import fs from "fs";
import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";

const passwordFile = "./src/middleware/password.json";
const passwordBool = "./src/middleware/usePassword.txt";

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
      return res.status(401).json({ message: "Password required" });
    }

    const passwordData = await fs.promises.readFile(passwordFile, "utf8");
    const storedData = JSON.parse(passwordData);

    const passwordMatch = await bcrypt.compare(
      providedPassword as string,
      storedData.hash,
    );
    if (!passwordMatch) {
      logger.error("Invalid Password - Denied access");
      return res.status(401).json({ message: "Invalid password" });
    }

    logger.debug("Authentication succesfull");
    next();
  } catch (error: any) {
    logger.error("Error in authMiddleware:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}

export default authMiddleware;
