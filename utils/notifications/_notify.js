const logger = require("../../utils/logger");

const { telegramNotification } = require("./telegram");
const { slackNotification } = require("./slack");
const { discordNotification } = require("./discord");
const { emailNotification } = require("./email");
const { whatsappNotification } = require("./whatsapp");
const { pushbulletNotification } = require("./pushbullet");
const { pushoverNotification } = require("./pushover");

async function notify(type, containerId) {
  if (!containerId) {
    logger.error("Container ID is required.");
    throw new Error("Container ID is required.");
  }

  switch (type) {
    case "telegram":
      logger.debug("Testing Telegram notification...");
      await telegramNotification(containerId);
      break;
    case "slack":
      logger.debug("Testing Slack notification...");
      await slackNotification(containerId);
      break;
    case "discord":
      logger.debug("Testing Discord notification...");
      await discordNotification(containerId);
      break;
    case "email":
      logger.debug("Testing Email notification...");
      await emailNotification(containerId);
      break;
    case "whatsapp":
      logger.debug("Testing WhatsApp notification...");
      await whatsappNotification(containerId);
      break;
    case "pushbullet":
      logger.debug("Testing Pushbullet notification...");
      await pushbulletNotification(containerId);
      break;
    case "pushover":
      logger.debug("Testing Pushover notification...");
      await pushoverNotification(containerId);
      break;
    default:
      const errorMsg = "Unknown notification type.";
      logger.error(errorMsg);
      throw new Error(errorMsg);
  }
}

if (require.main === module) {
  const [type, containerId] = process.argv.slice(2);
  notify(type, containerId);
  console.log(`Testing ${type}, with: ${containerId}`);
}

module.exports = notify;
