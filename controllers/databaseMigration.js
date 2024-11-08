import db from "../config/db.js";
import logger from "../utils/logger.js";

function clearOldEntries() {
  const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

  db.run(
    `DELETE FROM data WHERE createdAt < ?`,
    [twentyFourHoursAgo],
    (err) => {
      if (err) {
        logger.error("Error deleting old entries:", err.message);
        throw new Error("Database cleanup failed");
      }
      logger.info("Old entries cleared successfully");
    },
  );
}

export default clearOldEntries;
