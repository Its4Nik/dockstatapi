import { Request, Response, NextFunction } from "express";
import { rateLimitedExistsSync } from "../utils/rateLimitFS";
import { createResponseHandler } from "../handlers/response";

const lockFilePath = "./src/data/ha.lock";

export async function blockWhileLocked(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const ResponseHandler = createResponseHandler(res);
  if (await rateLimitedExistsSync(lockFilePath)) {
    ResponseHandler.error(
      "Service unavailable. The high-availability lock is currently active. Please try again later.",
      503,
    );
  } else {
    next();
  }
}
