import { Request, Response } from "express";
import logger from "../utils/logger";
import {
  readConfig,
  prepareFilesForSync,
  ensureFileExists,
} from "../controllers/highAvailability";
import { createResponseHandler } from "./response";

class HaHandler {
  private req: Request;
  private res: Response;

  constructor(req: Request, res: Response) {
    this.req = req;
    this.res = res;
  }

  async config() {
    const ResponseHandler = createResponseHandler(this.res);
    try {
      const data = await readConfig();
      return ResponseHandler.rawData(data, "Fetched HA-Config");
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return ResponseHandler.critical(errorMsg);
    }
  }

  async sync(req: Request) {
    const ResponseHandler = createResponseHandler(this.res);
    try {
      const { files } = req.body;
      logger.info("Received synchronization request from master node.");
      if (!files || typeof files !== "object") {
        return ResponseHandler.error(
          "Invalid request: 'files' object is missing or invalid.",
          400,
        );
      }

      for (const [filePath, content] of Object.entries(files)) {
        await ensureFileExists(filePath, content as string);
      }

      return ResponseHandler.ok("Synchronization completed successfully.");
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return ResponseHandler.critical(errorMsg);
    }
  }

  async prepare() {
    const ResponseHandler = createResponseHandler(this.res);
    try {
      logger.info("Preparing files for synchronization.");
      const fileData = await prepareFilesForSync();
      return ResponseHandler.rawData(
        fileData,
        "Done preparing files for synchronization",
      );
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      return ResponseHandler.critical(errorMsg);
    }
  }
}

export const createHaHandler = (req: Request, res: Response) =>
  new HaHandler(req, res);
