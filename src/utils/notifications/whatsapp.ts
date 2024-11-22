import fetch from "node-fetch";
import logger from "../logger";
import { renderTemplate } from "./data/template";

const whatsapp_api_url: string | undefined = process.env.WHATSAPP_API_URL;
const whatsapp_recipient: string | undefined = process.env.WHATSAPP_RECIPIENT;

export async function whatsappNotification(containerId: string) {
  const whatsapp_message: string = renderTemplate(containerId);
  if (!whatsapp_message) {
    logger.error("Failed to create notification message.");
    return;
  }

  try {
    await fetch(whatsapp_api_url as string, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: whatsapp_recipient,
        body: whatsapp_message,
      }),
    });
  } catch (error: any) {
    logger.error("Error sending WhatsApp message:", error);
  }
}