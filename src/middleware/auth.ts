import { logger } from "~/core/utils/logger";
import { dbFunctions } from "~/core/database";

import { set } from "~/typings/elysiajs";
import { config } from "~/typings/database";

export async function hashApiKey(apiKey: string): Promise<string> {
  logger.debug("Hashing API key");
  try {
    logger.debug("API key hashed successfully");
    return await Bun.password.hash(apiKey);
  } catch (error) {
    logger.error("Error hashing API key", error);
    throw new Error("Failed to hash API key");
  }
}

async function validateApiKeyHash(
  providedKey: string,
  storedHash: string
): Promise<boolean> {
  logger.debug("Validating API key hash");
  try {
    const isValid = await Bun.password.verify(providedKey, storedHash);
    logger.debug(`API key validation result: ${isValid}`);
    return isValid;
  } catch (error) {
    logger.error("Error validating API key hash", error);
    return false;
  }
}

async function getApiKeyFromDb(
  apiKey: string
): Promise<{ hash: string } | null> {
  const dbApiKey = (dbFunctions.getConfig() as config[])[0].api_key;
  logger.debug(`Querying database for API key: ${apiKey}`);
  return Promise.resolve({
    hash: dbApiKey,
  });
}

export async function validateApiKey(request: Request, set: set) {
  const apiKey = request.headers.get("x-api-key");

  if (process.env.NODE_ENV != "production") {
    logger.warn(
      "API Key validation deactivated, since running in development mode"
    );
    return { apiKey };
  } else if (!apiKey) {
    logger.error(`API key missing from request ${request.url}`);
    set.status = 401;
    return { error: "API key required" };
  }

  logger.debug(`API key validation initiated`);

  try {
    const dbRecord = await getApiKeyFromDb(apiKey);

    if (!dbRecord) {
      logger.error("API key not found in database");
      set.status = 401;
      return { error: "Invalid API key" };
    }

    const isValid = await validateApiKeyHash(apiKey, dbRecord.hash);

    if (!isValid) {
      logger.error("Invalid API key provided");
      set.status = 401;
      return { error: "Invalid API key" };
    }

    return logger.info(`Valid API key used`);
  } catch (error) {
    logger.error("Error during API key validation", error);
    set.status = 500;
    return { error: "Internal server error" };
  }
}
