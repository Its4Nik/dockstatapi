import * as https from "https";
import logger from "../logger";
import { renderTemplate } from "./_template";
import { SLACK_WEBHOOK_URL } from "../../config/variables";

const slack_webhook_url: string = SLACK_WEBHOOK_URL;

export async function slackNotification(containerId: string): Promise<void> {
  const slack_message: string | null = renderTemplate(containerId);
  if (!slack_message) {
    logger.error("Failed to create notification message.");
    return;
  }

  if (!slack_webhook_url) {
    logger.error("Slack webhook URL is not set.");
    return;
  }

  const postData = JSON.stringify({
    text: slack_message,
  });

  const url = new URL(slack_webhook_url);

  const options = {
    hostname: url.hostname,
    path: url.pathname,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(postData),
    },
  };

  const req = https.request(options, (res) => {
    let data = "";

    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      if (res.statusCode !== 200) {
        logger.error(`Slack API error: ${data}`);
      }
    });
  });

  req.on("error", (error) => {
    logger.error("Error sending Slack message:", error);
  });

  req.write(postData);
  req.end();
}
