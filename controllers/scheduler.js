// path: controllers/scheduler.js

const fetchData = require("./fetchData");
const logger = require("../utils/logger");
const db = require("../config/db");

let fetchInterval = 5 * 60 * 1000; // Fetch data every 5 minutes by default
let intervalId;
let cleanupIntervalId;

const scheduleFetch = () => {
  fetchData().then(() => {
    cleanupOldEntries();
  });

  intervalId = setInterval(() => {
    logger.info(
      `Fetching data at interval of ${fetchInterval / 1000} seconds.`,
    );
    fetchData();
  }, fetchInterval);

  // Schedule cleanup every 24 hours (86400000 ms)
  cleanupIntervalId = setInterval(
    () => {
      cleanupOldEntries();
    },
    24 * 60 * 60 * 1000,
  );

  logger.info(`Data fetching scheduled every ${fetchInterval / 1000} seconds.`);
  logger.info("Old entries cleanup scheduled every 24 hours.");
};

const setFetchInterval = (newInterval) => {
  if (intervalId) {
    clearInterval(intervalId);
    logger.info("Cleared existing fetch interval.");
  }
  fetchInterval = newInterval;
  scheduleFetch();
  logger.info(`Fetch interval updated to ${fetchInterval / 1000} seconds.`);
};

const parseInterval = (interval) => {
  const timeUnits = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
  };

  let totalMilliseconds = 0;
  const regex = /(\d+)([smh])/g;
  let match;

  while ((match = regex.exec(interval))) {
    const value = parseInt(match[1], 10);
    const unit = match[2];
    totalMilliseconds += value * timeUnits[unit];
  }

  return totalMilliseconds;
};

const getCurrentSchedule = () => {
  return {
    interval: fetchInterval / 1000,
  };
};

const cleanupOldEntries = async () => {
  const twentyFourHoursAgo = new Date(
    Date.now() - 24 * 60 * 60 * 1000,
  ).toISOString();
  try {
    await db.run("DELETE FROM data WHERE timestamp < ?", twentyFourHoursAgo);
    logger.info("Old entries cleared from the database.");
  } catch (error) {
    logger.error(`Error clearing old entries: ${error.message}`);
  }
};

module.exports = {
  scheduleFetch,
  setFetchInterval,
  parseInterval,
  getCurrentSchedule,
};
