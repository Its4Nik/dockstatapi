import fetch from "node-fetch";
import logger from "../logger";
import { renderTemplate } from "./_template";

const discord_webhook_url: string | undefined = process.env.DISCORD_WEBHOOK_URL;

export async function discordNotification(containerId: string) {
  const discord_message: string | null = renderTemplate(containerId);
  if (!discord_message) {
    logger.error("Failed to create notification message.");
    return;
  }

  try {
    await fetch(discord_webhook_url as string, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content: discord_message,
      }),
    });
  } catch (error: any) {
    logger.error("Error sending Discord message:", error);
  }
}
