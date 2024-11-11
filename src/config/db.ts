import sqlite3 from "sqlite3";
import logger from "../utils/logger";

const dbPath: string = "./src/data/database.db";

const db: sqlite3.Database = new sqlite3.Database(
  dbPath,
  (err: Error | null) => {
    if (err) {
      logger.error("Error opening database:", err.message);
    } else {
      db.run(`CREATE TABLE IF NOT EXISTS data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            info TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
      logger.info("Database created / opened successfully");
    }
  },
);

export default db;
