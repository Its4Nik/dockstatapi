import * as https from 'https';
import logger from "../logger";
import { renderTemplate } from "./_template";

const telegram_bot_token: string | undefined = process.env.TELEGRAM_BOT_TOKEN;
const telegram_chat_id: string | undefined = process.env.TELEGRAM_CHAT_ID;

export async function telegramNotification(containerId: string): Promise<void> {
  const telegram_message: string | null = renderTemplate(containerId);
  if (!telegram_message) {
    logger.error("Failed to create notification message.");
    return;
  }

  if (!telegram_bot_token || !telegram_chat_id) {
    logger.error("Telegram bot token or chat ID is not set.");
    return;
  }

  const postData = JSON.stringify({
    chat_id: telegram_chat_id,
    text: telegram_message,
  });

  const options = {
    hostname: 'api.telegram.org',
    path: `/bot${telegram_bot_token}/sendMessage`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      if (res.statusCode !== 200) {
        logger.error(`Telegram API error: ${data}`);
      }
    });
  });

  req.on('error', (error) => {
    logger.error("Error sending message:", error);
  });

  req.write(postData);
  req.end();
}
