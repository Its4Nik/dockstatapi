import { Unzip } from "zlib";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Node specific:
      NODE_ENV: "development" | "production";

      // High Availability
      HA_MASTER: string | undefined; //bool
      HA_MASTER_IP: string | undefined;
      HA_NODE: string | undefined; //ip list with port seperated by "," like: "10.0.0.4:5012,10.0.0.5:9876"
      HA_UNSAFE: string | undefined;

      // Notification services:
      DISCORD_WEBHOOK_URL: string | undefined;

      EMAIL_SENDER: string | undefined;
      EMAIL_RECIPIENT: string | undefined;
      EMAIL_PASSWORD: string | undefined;

      PUSHBULLET_ACCESS_TOKEN: string | undefined;

      PUSHOVER_USER_KEY: string | undefined;
      PUSHOVER_API_TOKEN: string | undefined;

      SLACK_WEBHOOK_URL: string | undefined;

      TELEGRAM_BOT_TOKEN: string | undefined;
      TELEGRAM_CHAT_ID: string | undefined;

      WHATSAPP_API_URL: string | undefined;
      WHATSAPP_RECIPIENT: string | undefined;
    }
  }
}

export { };
