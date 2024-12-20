import * as https from 'https';
import logger from "../logger";
import { renderTemplate } from "./_template";

const discord_webhook_url: string | undefined = process.env.DISCORD_WEBHOOK_URL;

export async function discordNotification(containerId: string): Promise<void> {
  const discord_message: string | null = renderTemplate(containerId);
  if (!discord_message) {
    logger.error("Failed to create notification message.");
    return;
  }

  if (!discord_webhook_url) {
    logger.error("Discord webhook URL is not set.");
    return;
  }

  const postData = JSON.stringify({
    content: discord_message,
  });

  const url = new URL(discord_webhook_url);

  const options = {
    hostname: url.hostname,
    path: url.pathname,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData),
    },
  };

  const req = https.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      if (res.statusCode !== 200) {
        logger.error(`Discord API error: ${data}`);
      }
    });
  });

  req.on('error', (error) => {
    logger.error("Error sending Discord message:", error);
  });

  req.write(postData);
  req.end();
}
