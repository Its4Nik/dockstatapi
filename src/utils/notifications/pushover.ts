import fetch from "node-fetch";
import logger from "../logger";
import { renderTemplate } from "./data/template";

const pushover_user_key: string | undefined = process.env.PUSHOVER_USER_KEY;
const pushover_api_token: string | undefined = process.env.PUSHOVER_API_TOKEN;

export async function pushoverNotification(containerId: string) {
  const pushover_message = renderTemplate(containerId);
  if (!pushover_message) {
    logger.error("Failed to create notification message.");
    return;
  }

  try {
    await fetch("https://api.pushover.net/1/messages.json", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        token: pushover_api_token as string,
        user: pushover_user_key as string,
        message: pushover_message as string,
      }),
    });
  } catch (error: any) {
    logger.error("Error sending Pushover message:", error);
  }
}
