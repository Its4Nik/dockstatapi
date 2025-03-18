import { dbFunctions } from "~/core/database/repository";
import { logger } from "~/core/utils/logger";
import { config } from "~/typings/database";
import { set } from "~/typings/elysiajs";

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
  storedHash: string,
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
  apiKey: string,
): Promise<{ hash: string } | null> {
  const dbApiKey = (dbFunctions.getConfig() as config[])[0].api_key;
  logger.debug(`Querying database for API key: ${apiKey}`);
  return Promise.resolve({
    hash: dbApiKey,
  });
}

export async function validateApiKey(request: Request, set: set) {
  const apiKey = request.headers.get("x-api-key");
  logger.debug(`API key validation initiated`);

  if (process.env.NODE_ENV != "production") {
    return { apiKey };
  } else if (!apiKey) {
    logger.error(`API key missing from request ${request.url}`);
    set.status = 401;
    return { error: "API key required" };
  }

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

    logger.info(`Valid API key used: ${apiKey}`);
    return { apiKey };
  } catch (error) {
    logger.error("Error during API key validation", error);
    set.status = 500;
    return { error: "Internal server error" };
  }
}
