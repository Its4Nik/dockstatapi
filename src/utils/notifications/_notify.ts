import logger from "../../utils/logger";
import { telegramNotification } from "./telegram";
import { slackNotification } from "./slack";
import { discordNotification } from "./discord";
import { emailNotification } from "./email";
import { whatsappNotification } from "./whatsapp";
import { pushbulletNotification } from "./pushbullet";
import { pushoverNotification } from "./pushover";

async function notify(type: string, containerId: string) {
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

export default notify;