import { logger } from "~/core/utils/logger";

export async function CheckHealth() {
  logger.info("Checking health");
  return "healthy";
}
