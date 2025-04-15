import { Elysia } from "elysia";

import { logger } from "~/core/utils/logger";
import { dbFunctions } from "~/core/database";

export const backendLogs = new Elysia({ prefix: "/logs" })
  .get(
    "/",
    async ({ set }) => {
      try {
        const logs = dbFunctions.getAllLogs();
        set.headers["Content-Type"] = "application/json";
        logger.debug(`Retrieved all logs`);
        return logs;
      } catch (error) {
        set.status = 500;
        logger.error("Failed to retrieve logs,", error);
        return { error: "Failed to retrieve logs" };
      }
    },
    {
      detail: {
        tags: ["Management"],
        description:
          "Retrieves complete application log history from persistent storage",
      },
    }
  )

  .get(
    "/:level",
    async ({ params: { level }, set }) => {
      try {
        const logs = dbFunctions.getLogsByLevel(level);
        set.headers["Content-Type"] = "application/json";
        logger.debug(`Retrieved logs (level: ${level})`);
        return logs;
      } catch (error) {
        set.status = 500;
        logger.error("Failed to retrieve logs");
        return { error: "Failed to retrieve logs" };
      }
    },
    {
      detail: {
        tags: ["Management"],
        description:
          "Filters logs by severity level (debug, info, warn, error, fatal)",
      },
    }
  )

  .delete(
    "/",
    async ({ set }) => {
      try {
        set.status = 200;
        set.headers["Content-Type"] = "application/json";
        dbFunctions.clearAllLogs();
        return { success: true };
      } catch (error) {
        set.status = 500;
        logger.error("Could not delete all logs,", error);
        return { error: "Could not delete all logs" };
      }
    },
    {
      detail: {
        tags: ["Management"],
        description: "Purges all historical log records from the database",
      },
    }
  )

  .delete(
    "/:level",
    async ({ params: { level }, set }) => {
      try {
        dbFunctions.clearLogsByLevel(level);
        set.headers["Content-Type"] = "application/json";
        logger.debug(`Cleared all logs with level: ${level}`);
        return { success: true };
      } catch (error) {
        set.status = 500;
        logger.error("Could not clear logs with level", level, ",", error);
        return { error: "Failed to retrieve logs" };
      }
    },
    {
      detail: {
        tags: ["Management"],
        description: "Clears log entries matching specified severity level",
      },
    }
  );
