import * as https from 'https';
import logger from "../logger";
import { renderTemplate } from "./_template";

const whatsapp_api_url: string | undefined = process.env.WHATSAPP_API_URL;
const whatsapp_recipient: string | undefined = process.env.WHATSAPP_RECIPIENT;

export async function whatsappNotification(containerId: string): Promise<void> {
  const whatsapp_message: string | null = renderTemplate(containerId);
  if (!whatsapp_message) {
    logger.error("Failed to create notification message.");
    return;
  }

  if (!whatsapp_api_url || !whatsapp_recipient) {
    logger.error("WhatsApp API URL or recipient is not set.");
    return;
  }

  const postData = JSON.stringify({
    to: whatsapp_recipient,
    body: whatsapp_message,
  });

  const url = new URL(whatsapp_api_url);

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
        logger.error(`WhatsApp API error: ${data}`);
      }
    });
  });

  req.on('error', (error) => {
    logger.error("Error sending WhatsApp message:", error);
  });

  req.write(postData);
  req.end();
}
