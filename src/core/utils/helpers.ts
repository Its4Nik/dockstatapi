import { logger } from "./logger";

export function findObjectByKey<T>(
	array: T[],
	key: keyof T,
	value: T[keyof T],
): T | undefined {
	logger.debug(
		`Searching for key: ${String(key)} with value: ${String(value)}`,
	);
	const data = array.find((item) => item[key] === value);
	return data;
}
