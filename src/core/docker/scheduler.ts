import { dbFunctions } from "~/core/database";
import storeContainerData from "~/core/docker/store-container-stats";
import storeHostData from "~/core/docker/store-host-stats";
import { logger } from "~/core/utils/logger";
import type { config } from "~/typings/database";

function convertFromMinToMs(minutes: number): number {
	return minutes * 60 * 1000;
}

async function initialRun(
	scheduleName: string,
	scheduleFunction: Promise<void> | void,
	isAsync: boolean,
) {
	try {
		if (isAsync) {
			await scheduleFunction;
		} else {
			scheduleFunction;
		}
		logger.info(`Startup run success for: ${scheduleName}`);
	} catch (error) {
		logger.error(`Startup run failed for ${scheduleName}, ${error as string}`);
	}
}

async function scheduledJob(
	name: string,
	jobFn: () => Promise<void>,
	intervalMs: number,
) {
	while (true) {
		const start = Date.now();
		logger.info(`Task Start: ${name}`);
		try {
			await jobFn();
			logger.info(`Task End: ${name} succeeded.`);
		} catch (e) {
			logger.error(`Task End: ${name} failed:`, e);
		}
		const elapsed = Date.now() - start;
		const delay = Math.max(0, intervalMs - elapsed);
		await new Promise((r) => setTimeout(r, delay));
	}
}

async function setSchedules() {
	try {
		const rawConfigData: unknown[] = dbFunctions.getConfig();
		const configData = rawConfigData[0];

		if (
			!configData ||
			typeof (configData as config).keep_data_for !== "number" ||
			typeof (configData as config).fetching_interval !== "number"
		) {
			logger.error("Invalid configuration data:", configData);
			throw new Error("Invalid configuration data");
		}

		const { keep_data_for, fetching_interval } = configData as config;

		if (keep_data_for === undefined) {
			const errMsg = "keep_data_for is undefined";
			logger.error(errMsg);
			throw new Error(errMsg);
		}

		if (fetching_interval === undefined) {
			const errMsg = "fetching_interval is undefined";
			logger.error(errMsg);
			throw new Error(errMsg);
		}

		logger.info(
			`Scheduling: Fetching container statistics every ${fetching_interval} minutes`,
		);

		logger.info(
			`Scheduling: Updating host statistics every ${fetching_interval} minutes`,
		);

		logger.info(
			`Scheduling: Cleaning up Database every hour and deleting data older then ${keep_data_for} days`,
		);

		// Schedule container data fetching
		await initialRun("storeContainerData", storeContainerData(), true);
		scheduledJob(
			"storeContainerData",
			storeContainerData,
			convertFromMinToMs(fetching_interval),
		);

		// Schedule Host statistics updates
		await initialRun("storeHostData", storeHostData(), true);
		scheduledJob(
			"storeHostData",
			storeHostData,
			convertFromMinToMs(fetching_interval),
		);

		// Schedule database cleanup
		await initialRun(
			"dbFunctions.deleteOldData",
			dbFunctions.deleteOldData(keep_data_for),
			false,
		);
		scheduledJob(
			"cleanupOldData",
			() => Promise.resolve(dbFunctions.deleteOldData(keep_data_for)),
			convertFromMinToMs(60),
		);

		logger.info("Schedules have been set successfully.");
	} catch (error) {
		logger.error("Error setting schedules:", error);
		throw error;
	}
}

export { setSchedules };
