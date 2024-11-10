import fetch from "node-fetch";
import logger from "../logger.js";
import { renderTemplate } from "./data/template.js";

const discord_webhook_url = process.env.DISCORD_WEBHOOK_URL;

export async function discordNotification(containerId) {
  const discord_message = renderTemplate(containerId);
  if (!discord_message) {
    logger.error("Failed to create notification message.");
    return;
  }

  try {
    await fetch(discord_webhook_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: discord_message,
      }),
    });
  } catch (error) {
    logger.error("Error sending Discord message:", error);
  }
}
