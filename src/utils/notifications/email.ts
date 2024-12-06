import { SendMailOptions, createTransport } from "nodemailer";
import logger from "../logger";
import { renderTemplate } from "./_template";

const email_sender: string | undefined = process.env.EMAIL_SENDER;
const email_recipient: string | undefined = process.env.EMAIL_RECIPIENT;
const email_password: string | undefined = process.env.EMAIL_PASSWORD;
const email_service: string | undefined = process.env.EMAIL_SERVICE;

export async function emailNotification(containerId: string) {
  const email_message: string = renderTemplate(containerId);
  if (!email_message) {
    logger.error("Failed to create notification message.");
    return;
  }

  const transporter = createTransport({
    service: email_service,
    auth: {
      user: email_sender,
      pass: email_password,
    },
  });

  const mailOptions: SendMailOptions = {
    from: email_sender,
    to: email_recipient,
    subject: "DockStat",
    text: email_message,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error: any) {
    logger.error("Error sending email:", error);
  }
}
