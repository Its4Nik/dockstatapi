import { dbFunctions } from "~/core/database";
import {
	deployStack,
	getAllStacksStatus,
	getStackStatus,
	pullStackImages,
	removeStack,
	restartStack,
	startStack,
	stopStack,
} from "~/core/stacks/controller";
import { logger } from "~/core/utils/logger";
import type { stacks_config } from "~/typings/database";

class stackHandler {
	async deploy(config: stacks_config) {
		try {
			await deployStack(config);
			logger.info(`Deployed Stack (${config.name})`);
			return `Stack ${config.name} deployed successfully`;
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error);

			return `${errorMsg}, Error deploying stack, please check the server logs for more information`;
		}
	}

	async start(stackId: number) {
		try {
			if (!stackId) {
				throw new Error("Stack ID needed");
			}
			await startStack(stackId);
			logger.info(`Started Stack (${stackId})`);
			return `Stack ${stackId} started successfully`;
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error);

			return `${errorMsg}, Error starting stack`;
		}
	}

	async stop(stackId: number) {
		try {
			if (!stackId) {
				throw new Error("Stack needed");
			}
			await stopStack(stackId);
			logger.info(`Stopped Stack (${stackId})`);
			return `Stack ${stackId} stopped successfully`;
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error);

			return `${errorMsg}, Error stopping stack`;
		}
	}

	async restart(stackId: number) {
		try {
			if (!stackId) {
				throw new Error("StackID needed");
			}
			await restartStack(stackId);
			logger.info(`Restarted Stack (${stackId})`);
			return `Stack ${stackId} restarted successfully`;
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error);

			return `${errorMsg}, Error restarting stack`;
		}
	}

	async pullImages(stackId: number) {
		try {
			if (!stackId) {
				throw new Error("StackID needed");
			}
			await pullStackImages(stackId);
			logger.info(`Pulled Stack images (${stackId})`);
			return `Images for stack ${stackId} pulled successfully`;
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error);

			return `${errorMsg}, Error pulling images`;
		}
	}

	async getStatus(stackId?: number) {
		if (stackId) {
			const status = await getStackStatus(stackId);
			logger.debug(
				`Retrieved status for stackId=${stackId}: ${JSON.stringify(status)}`,
			);
			return status;
		}

		logger.debug("Fetching status for all stacks");
		const status = await getAllStacksStatus();
		logger.debug(`Retrieved status for all stacks: ${JSON.stringify(status)}`);

		return status;
	}

	listStacks(): stacks_config[] {
		try {
			const stacks = dbFunctions.getStacks();
			logger.info("Fetched Stacks");
			return stacks;
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error);
			throw new Error(`${errorMsg}, Error getting stacks`);
		}
	}

	async deleteStack(stackId: number) {
		try {
			await removeStack(stackId);
			logger.info(`Deleted Stack ${stackId}`);
			return `Stack ${stackId} deleted successfully`;
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error);
			return `${errorMsg}, Error deleting stack`;
		}
	}
}

export const StackHandler = new stackHandler();
