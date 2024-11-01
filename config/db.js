const sqlite3 = require("sqlite3").verbose();
const logger = require("./../utils/logger");
const path = require("path");
const dbPath = path.join(__dirname, "../data/database.db");

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    logger.error("Error opening database:", err.message);
  } else {
    db.run(`CREATE TABLE IF NOT EXISTS data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            info TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);
    logger.info("Database created / opened succesfully");
  }
});

module.exports = db;
