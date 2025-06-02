import { Elysia, t } from "elysia";
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
import { responseHandler } from "~/core/utils/response-handler";
import type { stacks_config } from "~/typings/database";

export const stackRoutes = new Elysia({ prefix: "/stacks" })
	.post(
		"/deploy",
		async ({ set, body }) => {
			try {
				await deployStack(body as stacks_config);
				logger.info(`Deployed Stack (${body.name})`);
				return responseHandler.ok(
					set,
					`Stack ${body.name} deployed successfully`,
				);
			} catch (error) {
				const errorMsg = error instanceof Error ? error.message : String(error);

				return responseHandler.error(
					set,
					errorMsg,
					"Error deploying stack, please check the server logs for more information",
				);
			}
		},
		{
			detail: {
				tags: ["Stacks"],
				description:
					"Deploys a new Docker stack using a provided compose specification, allowing custom configurations and image updates",
				responses: {
					"200": {
						description: "Successfully deployed stack",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										message: {
											type: "string",
											example: "Stack example-stack deployed successfully",
										},
									},
								},
							},
						},
					},
					"400": {
						description: "Error deploying stack",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										error: {
											type: "string",
											example: "Error deploying stack",
										},
									},
								},
							},
						},
					},
				},
			},
			body: t.Object({
				name: t.String(),
				version: t.Number(),
				custom: t.Boolean(),
				source: t.String(),
				compose_spec: t.Any(),
			}),
		},
	)
	.post(
		"/start",
		async ({ set, body }) => {
			try {
				if (!body.stackId) {
					throw new Error("Stack ID needed");
				}
				await startStack(body.stackId);
				logger.info(`Started Stack (${body.stackId})`);
				return responseHandler.ok(
					set,
					`Stack ${body.stackId} started successfully`,
				);
			} catch (error) {
				const errorMsg = error instanceof Error ? error.message : String(error);

				return responseHandler.error(set, errorMsg, "Error starting stack");
			}
		},
		{
			detail: {
				tags: ["Stacks"],
				description:
					"Initiates a Docker stack, starting all associated containers",
				responses: {
					"200": {
						description: "Successfully started stack",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										message: {
											type: "string",
											example: "Stack 1 started successfully",
										},
									},
								},
							},
						},
					},
					"400": {
						description: "Error starting stack",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										error: {
											type: "string",
											example: "Error starting stack",
										},
									},
								},
							},
						},
					},
				},
			},
			body: t.Object({
				stackId: t.Number(),
			}),
		},
	)
	.post(
		"/stop",
		async ({ set, body }) => {
			try {
				if (!body.stackId) {
					throw new Error("Stack needed");
				}
				await stopStack(body.stackId);
				logger.info(`Stopped Stack (${body.stackId})`);
				return responseHandler.ok(
					set,
					`Stack ${body.stackId} stopped successfully`,
				);
			} catch (error) {
				const errorMsg = error instanceof Error ? error.message : String(error);

				return responseHandler.error(set, errorMsg, "Error stopping stack");
			}
		},
		{
			detail: {
				tags: ["Stacks"],
				description:
					"Halts a running Docker stack and its containers while preserving configurations",
				responses: {
					"200": {
						description: "Successfully stopped stack",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										message: {
											type: "string",
											example: "Stack 1 stopped successfully",
										},
									},
								},
							},
						},
					},
					"400": {
						description: "Error stopping stack",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										error: {
											type: "string",
											example: "Error stopping stack",
										},
									},
								},
							},
						},
					},
				},
			},
			body: t.Object({
				stackId: t.Number(),
			}),
		},
	)
	.post(
		"/restart",
		async ({ set, body }) => {
			try {
				if (!body.stackId) {
					throw new Error("Stack needed");
				}
				await restartStack(body.stackId);
				logger.info(`Restarted Stack (${body.stackId})`);
				return responseHandler.ok(
					set,
					`Stack ${body.stackId} restarted successfully`,
				);
			} catch (error) {
				const errorMsg = error instanceof Error ? error.message : String(error);

				return responseHandler.error(set, errorMsg, "Error restarting stack");
			}
		},
		{
			detail: {
				tags: ["Stacks"],
				description:
					"Performs full stack restart - stops and restarts all stack components in sequence",
				responses: {
					"200": {
						description: "Successfully restarted stack",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										message: {
											type: "string",
											example: "Stack 1 restarted successfully",
										},
									},
								},
							},
						},
					},
					"400": {
						description: "Error restarting stack",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										error: {
											type: "string",
											example: "Error restarting stack",
										},
									},
								},
							},
						},
					},
				},
			},
			body: t.Object({
				stackId: t.Number(),
			}),
		},
	)
	.post(
		"/pull-images",
		async ({ set, body }) => {
			try {
				if (!body.stackId) {
					throw new Error("Stack needed");
				}
				await pullStackImages(body.stackId);
				logger.info(`Pulled Stack images (${body.stackId})`);
				return responseHandler.ok(
					set,
					`Images for stack ${body.stackId} pulled successfully`,
				);
			} catch (error) {
				const errorMsg = error instanceof Error ? error.message : String(error);

				return responseHandler.error(set, errorMsg, "Error pulling images");
			}
		},
		{
			detail: {
				tags: ["Stacks"],
				description:
					"Updates container images for a stack using Docker's pull mechanism (requires stack ID)",
				responses: {
					"200": {
						description: "Successfully pulled images",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										message: {
											type: "string",
											example: "Images for stack 1 pulled successfully",
										},
									},
								},
							},
						},
					},
					"400": {
						description: "Error pulling images",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										error: {
											type: "string",
											example: "Error pulling images",
										},
									},
								},
							},
						},
					},
				},
			},
			body: t.Object({
				stackId: t.Number(),
			}),
		},
	)
	.get(
		"/status",
		async ({ set, query }) => {
			try {
				// biome-ignore lint/suspicious/noExplicitAny:
				let status: Record<string, any>;
				let res = {};

				logger.debug("Entering stack status handler");
				logger.debug(`Request body: ${JSON.stringify(query)}`);

				if (query.stackId !== 0) {
					logger.debug(`Fetching status for stackId=${query.stackId}`);
					status = await getStackStatus(query.stackId);
					logger.debug(
						`Retrieved status for stackId=${query.stackId}: ${JSON.stringify(
							status,
						)}`,
					);

					res = responseHandler.ok(
						set,
						`Stack ${query.stackId} status retrieved successfully`,
					);
					logger.info("Fetched Stack status");
				} else {
					logger.debug("Fetching status for all stacks");
					status = await getAllStacksStatus();
					logger.debug(
						`Retrieved status for all stacks: ${JSON.stringify(status)}`,
					);

					res = responseHandler.ok(set, "Fetched all Stack's status");
					logger.info("Fetched all Stack status");
				}

				logger.debug("Returning response with status data");
				return { ...res, status: status };
			} catch (error) {
				const errorMsg = error instanceof Error ? error.message : String(error);
				logger.debug(`Error occurred while fetching stack status: ${errorMsg}`);

				return responseHandler.error(
					set,
					errorMsg,
					"Error getting stack status",
				);
			}
		},
		{
			detail: {
				tags: ["Stacks"],
				description:
					"Retrieves operational status for either a specific stack (by ID) or all managed stacks (ID: 0)",
				responses: {
					"200": {
						description: "Successfully retrieved stack status",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										message: {
											type: "string",
											example: "Stack 1 status retrieved successfully",
										},
										status: {
											type: "object",
											properties: {
												name: {
													type: "string",
													example: "example-stack",
												},
												status: {
													type: "string",
													example: "running",
												},
												containers: {
													type: "array",
													items: {
														type: "object",
														properties: {
															name: {
																type: "string",
																example: "example-stack_web_1",
															},
															status: {
																type: "string",
																example: "running",
															},
														},
													},
												},
											},
										},
									},
								},
							},
						},
					},
					"400": {
						description: "Error getting stack status",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										error: {
											type: "string",
											example: "Error getting stack status",
										},
									},
								},
							},
						},
					},
				},
			},
			query: t.Object({
				stackId: t.Number(),
			}),
		},
	)
	.get(
		"/",
		async ({ set }) => {
			try {
				const stacks = dbFunctions.getStacks();
				logger.info("Fetched Stacks");
				return stacks;
			} catch (error) {
				const errorMsg = error instanceof Error ? error.message : String(error);

				return responseHandler.error(set, errorMsg, "Error getting stacks");
			}
		},
		{
			detail: {
				tags: ["Stacks"],
				description:
					"Lists all registered stacks with their complete configuration details",
				responses: {
					"200": {
						description: "Successfully retrieved stacks",
						content: {
							"application/json": {
								schema: {
									type: "array",
									items: {
										type: "object",
										properties: {
											id: {
												type: "number",
												example: 1,
											},
											name: {
												type: "string",
												example: "example-stack",
											},
											version: {
												type: "number",
												example: 1,
											},
											source: {
												type: "string",
												example: "github.com/example/repo",
											},
											automatic_reboot_on_error: {
												type: "boolean",
												example: true,
											},
										},
									},
								},
							},
						},
					},
					"400": {
						description: "Error getting stacks",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										error: {
											type: "string",
											example: "Error getting stacks",
										},
									},
								},
							},
						},
					},
				},
			},
		},
	)
	.delete(
		"/",
		async ({ set, body }) => {
			try {
				const { stackId } = body;
				await removeStack(stackId);
				logger.info(`Deleted Stack ${stackId}`);
				return responseHandler.ok(set, `Stack ${stackId} deleted successfully`);
			} catch (error) {
				const errorMsg = error instanceof Error ? error.message : String(error);

				return responseHandler.error(set, errorMsg, "Error deleting stack");
			}
		},
		{
			detail: {
				tags: ["Stacks"],
				description:
					"Permanently removes a stack configuration and cleans up associated resources",
				responses: {
					"200": {
						description: "Successfully deleted stack",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										message: {
											type: "string",
											example: "Stack 1 deleted successfully",
										},
									},
								},
							},
						},
					},
					"400": {
						description: "Error deleting stack",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										error: {
											type: "string",
											example: "Error deleting stack",
										},
									},
								},
							},
						},
					},
				},
			},
			body: t.Object({
				stackId: t.Number(),
			}),
		},
	);
