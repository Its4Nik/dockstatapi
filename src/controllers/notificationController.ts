import notify from "../utils/notifications/_notify";
import logger from "../utils/logger";
import {
  DISCORD_WEBHOOK_URL,
  EMAIL_SENDER,
  EMAIL_RECIPIENT,
  EMAIL_PASSWORD,
  EMAIL_SERVICE,
  PUSHBULLET_ACCESS_TOKEN,
  PUSHOVER_USER_KEY,
  PUSHOVER_API_TOKEN,
  SLACK_WEBHOOK_URL,
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID,
  WHATSAPP_API_URL,
  WHATSAPP_RECIPIENT,
} from "../config/variables";

const notificationTypes = {
  discord: !!DISCORD_WEBHOOK_URL,
  email: !!(EMAIL_SENDER && EMAIL_RECIPIENT && EMAIL_PASSWORD && EMAIL_SERVICE),
  pushbullet: !!PUSHBULLET_ACCESS_TOKEN,
  pushover: !!(PUSHOVER_API_TOKEN && PUSHOVER_USER_KEY),
  slack: !!SLACK_WEBHOOK_URL,
  telegram: !!(TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID),
  whatsapp: !!(WHATSAPP_API_URL && WHATSAPP_RECIPIENT),
};

async function sendNotification(containerId: string) {
  if (notificationTypes.discord) {
    logger.debug(`Sending notification via discord (${containerId})`);
    notify("discord", containerId);
  }
  if (notificationTypes.email) {
    logger.debug(`Sending notification via E-Mail (${containerId})`);
    notify("email", containerId);
  }
  if (notificationTypes.pushbullet) {
    logger.debug(`Sending notification via Pushbullet (${containerId})`);
    notify("pushbullet", containerId);
  }
  if (notificationTypes.pushover) {
    logger.debug(`Sending notification via Pushover (${containerId})`);
    notify("pushover", containerId);
  }
  if (notificationTypes.slack) {
    logger.debug(`Sending notification via Slack (${containerId})`);
    notify("slack", containerId);
  }
  if (notificationTypes.telegram) {
    logger.debug(`Sending notification via Telegram (${containerId})`);
    notify("slack", containerId);
  }
  if (notificationTypes.whatsapp) {
    logger.debug(`Sending notification via Pushbullet (${containerId})`);
    notify("whatsapp", containerId);
  }
}

export default sendNotification;
