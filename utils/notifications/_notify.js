import logger from "../../utils/logger.js";
import { telegramNotification } from "./telegram.js";
import { slackNotification } from "./slack.js";
import { discordNotification } from "./discord.js";
import { emailNotification } from "./email.js";
import { whatsappNotification } from "./whatsapp.js";
import { pushbulletNotification } from "./pushbullet.js";
import { pushoverNotification } from "./pushover.js";

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

if (import.meta.url === process.argv[1]) {
  const [type, containerId] = process.argv.slice(2);
  notify(type, containerId);
  console.log(`Testing ${type}, with: ${containerId}`);
}

export default notify;
