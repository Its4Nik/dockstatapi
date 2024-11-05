const logger = require("../../utils/logger");

const { telegramNotification } = require("./telegram");

async function testNotification(type, containerId) {
  if (!containerId) {
    console.error("Container ID is required.");
    return;
  }

  switch (type) {
    case "telegram":
      logger.debug("Testing Telegram notification...");
      await telegramNotification(containerId);
      break;
    default:
      logger.error("Unknown notification type. Use 'email' or 'telegram'.");
  }
}

if (require.main === module) {
  const [type, containerId] = process.argv.slice(2);
  testNotification(type, containerId);
  console.log(`Testing ${type}, with: ${containerId}`);
}

module.exports = testNotification;
