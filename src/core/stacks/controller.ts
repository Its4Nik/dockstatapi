import { rm } from "node:fs/promises";
import DockerCompose from "docker-compose";
import YAML from "yaml";
import { dbFunctions } from "~/core/database";
import { logger } from "~/core/utils/logger";
import { postToClient } from "~/routes/live-stacks";
import type { stacks_config } from "~/typings/database";
import type { ComposeSpec, Stack } from "~/typings/docker-compose";
import { findObjectByKey } from "../utils/helpers";
import { checkStacks } from "./checker";

const wrapProgressCallback = (progressCallback?: (log: string) => void) => {
	return progressCallback
		? (chunk: Buffer) => {
				const log = chunk.toString();
				progressCallback(log);
			}
		: undefined;
};

async function getStackName(stack_id: number): Promise<string> {
	logger.debug(`Fetching stack name for id ${stack_id}`);
	const stacks = dbFunctions.getStacks();
	const stack = findObjectByKey(stacks, "id", stack_id);
	if (!stack) {
		throw new Error(`Stack with id ${stack_id} not found`);
	}
	return stack.name;
}

async function runStackCommand<T>(
	stack_id: number,
	command: (
		cwd: string,
		progressCallback?: (log: string) => void,
	) => Promise<T>,
	action: string,
): Promise<T> {
	try {
		logger.debug(
			`Starting runStackCommand for stack_id=${stack_id}, action="${action}"`,
		);

		const stackName = await getStackName(stack_id);
		logger.debug(
			`Retrieved stack name "${stackName}" for stack_id=${stack_id}`,
		);

		const stackPath = await getStackPath({
			id: stack_id,
			name: stackName,
		} as Stack);
		logger.debug(`Resolved stack path "${stackPath}" for stack_id=${stack_id}`);

		const progressCallback = (log: string) => {
			const message = log.trim();
			logger.debug(
				`Progress for stack_id=${stack_id}, action="${action}": ${message}`,
			);

			// ERROR HANDLING FOR COMPOSE ACTIONS
			if (message.includes("Error response from daemon")) {
				logger.error(
					`Error response from daemon: ${
						message.split("Error response from daemon:")[1]
					}`,
				);
			}

			postToClient({
				type: "stack-progress",
				data: {
					stack_id,
					action,
					message,
					timestamp: new Date().toISOString(),
				},
			});
		};

		logger.debug(
			`Executing command for stack_id=${stack_id}, action="${action}"`,
		);
		const result = await command(stackPath, progressCallback);
		logger.debug(
			`Successfully completed command for stack_id=${stack_id}, action="${action}"`,
		);

		return result;
	} catch (error) {
		logger.debug(
			`Error occurred for stack_id=${stack_id}, action="${action}": ${String(
				error,
			)}`,
		);
		postToClient({
			type: "stack-error",
			data: {
				stack_id,
				action,
				message: String(error),
				timestamp: new Date().toISOString(),
			},
		});
		throw new Error(
			`Error while ${action} stack "${stack_id}": ${String(error)}`,
		);
	}
}

async function getStackPath(stack: Stack): Promise<string> {
	const stackName = stack.name.trim().replace(/\s+/g, "_");
	const stackId = stack.id;

	if (!stackId) {
		logger.error("Stack could not be parsed");
		throw new Error("Stack could not be parsed");
	}

	return `stacks/${stackId}-${stackName}`;
}

async function createStackYAML(compose_spec: Stack): Promise<void> {
	const yaml = YAML.stringify(compose_spec.compose_spec);
	const stackPath = await getStackPath(compose_spec);
	await Bun.write(`${stackPath}/docker-compose.yaml`, yaml, {
		createPath: true,
	});
}

export async function deployStack(stack_config: stacks_config): Promise<void> {
	try {
		logger.debug(`Deploying Stack: ${JSON.stringify(stack_config)}`);

		if (!stack_config.name) {
			throw new Error("Stack name needed");
		}

		const jsonStringStack = {
			...stack_config,
			compose_spec: JSON.stringify(stack_config.compose_spec),
		};

		const stackId = dbFunctions.addStack(jsonStringStack);

		if (!stackId) {
			throw new Error("Failed to add stack to database");
		}

		postToClient({
			type: "stack-status",
			data: {
				stack_id: stackId,
				status: "pending",
				message: "Creating stack configuration",
			},
		});

		const stackYaml: Stack = {
			id: stackId,
			name: stack_config.name,
			source: stack_config.source,
			version: stack_config.version,
			compose_spec: stack_config.compose_spec as unknown as ComposeSpec, // Weird stuff i am doing here... smh
		};

		await createStackYAML(stackYaml);

		await runStackCommand(
			stackId,
			(cwd, progressCallback) =>
				DockerCompose.upAll({
					cwd,
					log: true,
					callback: wrapProgressCallback(progressCallback),
				}),
			"deploying",
		);

		postToClient({
			type: "stack-status",
			data: {
				stack_id: stackId,
				status: "deployed",
				message: "Stack deployed successfully",
			},
		});
	} catch (error: unknown) {
		const errorMsg = error instanceof Error ? error.message : String(error);
		logger.error(errorMsg);
		postToClient({
			type: "stack-error",
			data: {
				stack_id: 0,
				action: "deploying",
				message: errorMsg,
				timestamp: new Date().toISOString(),
			},
		});
		throw new Error(errorMsg);
	} finally {
		await checkStacks();
	}
}

export async function stopStack(stack_id: number): Promise<void> {
	// Note the await to discard the result (convert to void)
	await runStackCommand(
		stack_id,
		(cwd, progressCallback) =>
			DockerCompose.downAll({
				cwd,
				log: true,
				callback: wrapProgressCallback(progressCallback),
			}),
		"stopping",
	);
}

export async function startStack(stack_id: number): Promise<void> {
	await runStackCommand(
		stack_id,
		(cwd, progressCallback) =>
			DockerCompose.upAll({
				cwd,
				log: true,
				callback: wrapProgressCallback(progressCallback),
			}),
		"starting",
	);
}

export async function pullStackImages(stack_id: number): Promise<void> {
	await runStackCommand(
		stack_id,
		(cwd, progressCallback) =>
			DockerCompose.pullAll({
				cwd,
				log: true,
				callback: wrapProgressCallback(progressCallback),
			}),
		"pulling-images",
	);
}

export async function restartStack(stack_id: number): Promise<void> {
	await runStackCommand(
		stack_id,
		(cwd, progressCallback) =>
			DockerCompose.restartAll({
				cwd,
				log: true,
				callback: wrapProgressCallback(progressCallback),
			}),
		"restarting",
	);
}

export async function getStackStatus(
	stack_id: number,
	//biome-ignore lint/suspicious/noExplicitAny:
): Promise<Record<string, any>> {
	const status = await runStackCommand(
		stack_id,
		async (cwd) => {
			const rawStatus = await DockerCompose.ps({ cwd });
			//biome-ignore lint/suspicious/noExplicitAny:
			return rawStatus.data.services.reduce((acc: any, service: any) => {
				acc[service.name] = service.state;
				return acc;
			}, {});
		},
		"status-check",
	);
	return status;
}

export async function removeStack(stack_id: number): Promise<void> {
	try {
		const _ = dbFunctions.deleteStack(stack_id);

		await runStackCommand(
			stack_id,
			async (cwd, progressCallback) => {
				await DockerCompose.down({
					cwd,
					log: true,
					callback: wrapProgressCallback(progressCallback),
				});
			},
			"removing",
		);

		const stackName = await getStackName(stack_id);
		const stackPath = await getStackPath({
			id: stack_id,
			name: stackName,
		} as Stack);

		try {
			await rm(stackPath, { recursive: true });
		} catch (error) {
			const errorMsg = error instanceof Error ? error.message : String(error);
			logger.error(errorMsg);
			postToClient({
				type: "stack-error",
				data: {
					stack_id,
					action: "removing",
					message: errorMsg,
					timestamp: new Date().toISOString(),
				},
			});
			throw new Error(errorMsg);
		}

		postToClient({
			type: "stack-removed",
			data: {
				stack_id,
				message: "Stack removed successfully",
			},
		});
	} catch (error: unknown) {
		const errorMsg = error instanceof Error ? error.message : String(error);
		logger.error(errorMsg);
		postToClient({
			type: "stack-error",
			data: {
				stack_id,
				action: "removing",
				message: errorMsg,
				timestamp: new Date().toISOString(),
			},
		});
		throw new Error(errorMsg);
	}
}

interface DockerServiceStatus {
	status: string;
	ports: string[];
}

interface StackStatus {
	services: Record<string, DockerServiceStatus>;
	healthy: number;
	unhealthy: number;
	total: number;
}

type StacksStatus = Record<string, StackStatus>;

export async function getAllStacksStatus(): Promise<StacksStatus> {
	try {
		const stacks = dbFunctions.getStacks();

		const statusResults = await Promise.all(
			stacks.map(async (stack) => {
				const status = await runStackCommand(
					stack.id as number,
					async (cwd) => {
						const rawStatus = await DockerCompose.ps({ cwd });
						const services = rawStatus.data.services.reduce(
							(acc: Record<string, DockerServiceStatus>, service) => {
								acc[service.name] = {
									status: service.state,
									ports: service.ports.map(
										(port) => `${port.mapped?.address}:${port.mapped?.port}`,
									),
								};
								return acc;
							},
							{},
						);

						const statusValues = Object.values(services);
						return {
							services,
							healthy: statusValues.filter(
								(s) => s.status === "running" || s.status.includes("Up"),
							).length,
							unhealthy: statusValues.filter(
								(s) => s.status !== "running" && !s.status.includes("Up"),
							).length,
							total: statusValues.length,
						};
					},
					"status-check",
				);
				return { stackId: stack.id, status };
			}),
		);

		return statusResults.reduce((acc, { stackId, status }) => {
			acc[String(stackId)] = status;
			return acc;
		}, {} as StacksStatus);
	} catch (error: unknown) {
		const errorMsg = error instanceof Error ? error.message : String(error);
		logger.error(errorMsg);
		throw new Error(errorMsg);
	}
}
