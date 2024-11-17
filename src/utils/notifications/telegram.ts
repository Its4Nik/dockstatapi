import fetch from "node-fetch";
import logger from "../logger";
import { renderTemplate } from "./data/template";

const telegram_bot_token: string | undefined = process.env.TELEGRAM_BOT_TOKEN;
const telegram_chat_id: string | undefined = process.env.TELEGRAM_CHAT_ID;

export async function telegramNotification(containerId: string) {
  const telegram_message: string = renderTemplate(containerId);
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
  } catch (error: any) {
    logger.error("Error sending message:", error);
  }
}
