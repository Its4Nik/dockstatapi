import logger from "../../utils/logger";
import { telegramNotification } from "./telegram";
import { slackNotification } from "./slack";
import { discordNotification } from "./discord";
import { emailNotification } from "./email";
import { whatsappNotification } from "./whatsapp";
import { pushbulletNotification } from "./pushbullet";
import { pushoverNotification } from "./pushover";
import path from "path";

async function loadCustomNotification(scriptPath: string, containerId: string) {
  try {
    const absolutePath = path.resolve(__dirname, "./custom", scriptPath);
    const customModule = await import(absolutePath);

    if (typeof customModule.default !== "function") {
      const errorMsg = `The custom notification script at ${scriptPath} does not export a default function.`;
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }

    logger.debug(`Executing custom notification script: ${scriptPath}`);
    await customModule.default(containerId);
  } catch (error: any) {
    logger.error(
      `Failed to execute custom notification script (${scriptPath}): ${error.message}`,
    );
    throw error;
  }
}

async function notify(type: string, containerId: string) {
  if (!containerId) {
    logger.error("Container ID is required.");
    throw new Error("Container ID is required.");
  }

  if (type.startsWith("custom/")) {
    const scriptName = type.split("/")[1];
    if (!scriptName) {
      const errorMsg = "Custom notification script name is invalid.";
      logger.error(errorMsg);
      throw new Error(errorMsg);
    }
    await loadCustomNotification(`${scriptName}.js`, containerId);
    return;
  }

  switch (type) {
    case "telegram":
      logger.debug("Sending Telegram notification...");
      await telegramNotification(containerId);
      break;
    case "slack":
      logger.debug("Sending Slack notification...");
      await slackNotification(containerId);
      break;
    case "discord":
      logger.debug("Sending Discord notification...");
      await discordNotification(containerId);
      break;
    case "email":
      logger.debug("Sending Email notification...");
      await emailNotification(containerId);
      break;
    case "whatsapp":
      logger.debug("Sending WhatsApp notification...");
      await whatsappNotification(containerId);
      break;
    case "pushbullet":
      logger.debug("Sending Pushbullet notification...");
      await pushbulletNotification(containerId);
      break;
    case "pushover":
      logger.debug("Sending Pushover notification...");
      await pushoverNotification(containerId);
      break;
    default:
      const errorMsg = "Unknown notification type.";
      logger.error(errorMsg);
      throw new Error(errorMsg);
  }
}

export default notify;
