declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Node specific:
      NODE_ENV: "development" | "production";

      // High Availability
      IS_MASTER: string | undefined;
      HA_NODE: string | undefined;
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

export {};
