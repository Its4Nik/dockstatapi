import fetch from "node-fetch";
import logger from "../logger.js";
import { renderTemplate } from "./data/template.js";

const pushbullet_access_token = process.env.PUSHBULLET_ACCESS_TOKEN;

export async function pushbulletNotification(containerId) {
  const pushbullet_message = renderTemplate(containerId);
  if (!pushbullet_message) {
    logger.error("Failed to create notification message.");
    return;
  }

  try {
    await fetch("https://api.pushbullet.com/v2/pushes", {
      method: "POST",
      headers: {
        "Access-Token": pushbullet_access_token,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "note",
        title: "Container Notification",
        body: pushbullet_message,
      }),
    });
  } catch (error) {
    logger.error("Error sending Pushbullet message:", error);
  }
}
