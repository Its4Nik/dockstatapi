import db from "../config/db";
import logger from "../utils/logger";

function clearOldEntries(): void {
  const twentyFourHoursAgo: number = Date.now() - 24 * 60 * 60 * 1000;

  db.run(
    `DELETE FROM data WHERE createdAt < ?`,
    [twentyFourHoursAgo],
    (err: Error | null) => {
      if (err) {
        logger.error("Error deleting old entries:", err.message);
        throw new Error("Database cleanup failed");
      }
      logger.info("Old entries cleared successfully");
    },
  );
}

export default clearOldEntries;
