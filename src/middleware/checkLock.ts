import fs from "fs";
import { Request, Response, NextFunction } from "express";

const lockFilePath = "./src/data/ha.lock";

export function blockWhileLocked(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  if (fs.existsSync(lockFilePath)) {
    res.status(503).json({
      error:
        "Service unavailable. The high-availability lock is currently active. Please try again later.",
    });
  } else {
    next();
  }
}
