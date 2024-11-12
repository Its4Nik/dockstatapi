import nodemailer from "nodemailer";
import logger from "../logger";
import { renderTemplate } from "./data/template";

const email_sender = process.env.EMAIL_SENDER;
const email_recipient = process.env.EMAIL_RECIPIENT;
const email_password = process.env.EMAIL_PASSWORD;

export async function emailNotification(containerId) {
  const email_message = renderTemplate(containerId);
  if (!email_message) {
    logger.error("Failed to create notification message.");
    return;
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: email_sender,
      pass: email_password,
    },
  });

  const mailOptions = {
    from: email_sender,
    to: email_recipient,
    subject: "Container Notification",
    text: email_message,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error: any) {
    logger.error("Error sending email:", error);
  }
}
