import { Request, Response, NextFunction } from "express";
import { rateLimitedExistsSync } from "../utils/rateLimitFS";

const lockFilePath = "./src/data/ha.lock";

export async function blockWhileLocked(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (await rateLimitedExistsSync(lockFilePath)) {
    res.status(503).json({
      error:
        "Service unavailable. The high-availability lock is currently active. Please try again later.",
    });
  } else {
    next();
  }
}
