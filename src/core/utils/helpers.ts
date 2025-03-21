import { logger } from "./logger";

export function findObjectByKey<T>(
  array: T[],
  key: keyof T,
  value: T[keyof T]
): T | undefined {
  const data = array.find((item) => item[key] === value);
  logger.debug(
    `Searching ${String(key)} = ${String(value)} in ${String(
      JSON.stringify(array)
    )} Found Item ${JSON.stringify(data)}`
  );
  return data;
}
