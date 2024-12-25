import * as https from "https";
import logger from "../logger";
import { renderTemplate } from "./_template";
import { PUSHOVER_USER_KEY, PUSHOVER_API_TOKEN } from "../../config/variables";

const pushover_user_key: string = PUSHOVER_USER_KEY;
const pushover_api_token: string = PUSHOVER_API_TOKEN;

export async function pushoverNotification(containerId: string): Promise<void> {
  const pushover_message: string | null = renderTemplate(containerId);
  if (!pushover_message) {
    logger.error("Failed to create notification message.");
    return;
  }

  if (!pushover_api_token || !pushover_user_key) {
    logger.error("Pushover API token or user key is not set.");
    return;
  }

  const postData = new URLSearchParams({
    token: pushover_api_token,
    user: pushover_user_key,
    message: pushover_message,
  }).toString();

  const options = {
    hostname: "api.pushover.net",
    path: "/1/messages.json",
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
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
        logger.error(`Pushover API error: ${data}`);
      }
    });
  });

  req.on("error", (error) => {
    logger.error("Error sending Pushover message:", error);
  });

  req.write(postData);
  req.end();
}
