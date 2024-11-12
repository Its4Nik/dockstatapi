import fetch from "node-fetch";
import logger from "../logger";
import { renderTemplate } from "./data/template";

const slack_webhook_url = process.env.SLACK_WEBHOOK_URL;

export async function slackNotification(containerId) {
  const slack_message = renderTemplate(containerId);
  if (!slack_message) {
    logger.error("Failed to create notification message.");
    return;
  }

  try {
    await fetch(slack_webhook_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: slack_message,
      }),
    });
  } catch (error: any) {
    logger.error("Error sending Slack message:", error);
  }
}
