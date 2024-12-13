import notify from "../utils/notifications/_notify";
import logger from "../utils/logger";

const notificationTypes = {
  discord: process.env.DISCORD_WEBHOOK_URL ? true : false,
  email:
    process.env.EMAIL_SENDER &&
    process.env.EMAIL_RECIPIENT &&
    process.env.EMAIL_PASSWORD
      ? true
      : false,
  pushbullet: process.env.PUSHBULLET_ACCESS_TOKEN ? true : false,
  pushover:
    process.env.PUSHOVER_API_TOKEN && process.env.PUSHOVER_USER_KEY
      ? true
      : false,
  slack: process.env.SLACK_WEBHOOK_URL ? true : false,
  telegram:
    process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID
      ? true
      : false,
  whatsapp:
    process.env.WHATSAPP_API_URL && process.env.WHATSAPP_RECIPIENT
      ? true
      : false,
  custom: process.env.CUSTOM_NOTIFICATION ? true : false,
  customList: process.env.CUSTOM_NOTIFICATION,
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
  if (notificationTypes.custom) {
    const elements: undefined | string[] = notificationTypes.customList
      ? notificationTypes.customList.split(",")
      : undefined;
    if (elements) {
      elements.forEach((element) => {
        logger.debug(`Sending custom notification ${element} (${containerId})`);
        notify(`custom/${element}`, containerId);
      });
    } else {
      logger.error("Error getting custom notifications");
    }
  }
}
