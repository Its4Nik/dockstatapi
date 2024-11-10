import fetch from "node-fetch";
import logger from "../logger.js";
import { renderTemplate } from "./data/template.js";

const telegram_bot_token = process.env.TELEGRAM_BOT_TOKEN;
const telegram_chat_id = process.env.TELEGRAM_CHAT_ID;

export async function telegramNotification(containerId) {
  const telegram_message = renderTemplate(containerId);
  if (!telegram_message) {
    logger.error("Failed to create notification message.");
    return;
  }

  try {
    await fetch(
      `https://api.telegram.org/bot${telegram_bot_token}/sendMessage`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: telegram_chat_id,
          text: telegram_message,
        }),
      },
    );
  } catch (error) {
    logger.error("Error sending message:", error);
  }
}
