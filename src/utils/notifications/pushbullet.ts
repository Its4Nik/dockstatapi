import * as https from "https";
import logger from "../logger";
import { renderTemplate } from "./_template";

const pushbullet_access_token: string | undefined =
  process.env.PUSHBULLET_ACCESS_TOKEN;

export async function pushbulletNotification(
  containerId: string,
): Promise<void> {
  const pushbullet_message: string | null = renderTemplate(containerId);
  if (!pushbullet_message) {
    logger.error("Failed to create notification message.");
    return;
  }

  if (!pushbullet_access_token) {
    logger.error("Pushbullet access token is not set.");
    return;
  }

  const postData = JSON.stringify({
    type: "note",
    title: "Container Notification",
    body: pushbullet_message,
  });

  const options = {
    hostname: "api.pushbullet.com",
    path: "/v2/pushes",
    method: "POST",
    headers: {
      "Access-Token": pushbullet_access_token,
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
        logger.error(`Pushbullet API error: ${data}`);
      }
    });
  });

  req.on("error", (error) => {
    logger.error("Error sending Pushbullet message:", error);
  });

  req.write(postData);
  req.end();
}
