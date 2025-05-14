import { existsSync, readdirSync, unlinkSync } from "node:fs";
import { Elysia, t } from "elysia";
import { dbFunctions } from "~/core/database";
import { pluginManager } from "~/core/plugins/plugin-manager";
import { logger } from "~/core/utils/logger";
import {
	authorEmail,
	authorName,
	authorWebsite,
	contributors,
	dependencies,
	description,
	devDependencies,
	license,
	version,
} from "~/core/utils/package-json";
import { responseHandler } from "~/core/utils/response-handler";

import { backupDir } from "~/core/database/backup";
import { hashApiKey } from "~/middleware/auth";
import type { config } from "~/typings/database";

export const apiConfigRoutes = new Elysia({ prefix: "/config" })
	.get(
		"",
		async ({ set }) => {
			try {
				const data = dbFunctions.getConfig() as config[];
				const distinct = data[0];
				set.status = 200;

				logger.debug("Fetched backend config");
				return distinct;
			} catch (error) {
				const errMsg = error instanceof Error ? error.message : String(error);
				throw new Error(errMsg);
			}
		},
		{
			detail: {
				tags: ["Management"],
				description:
					"Returns current API configuration including data retention policies and security settings",
				responses: {
					"200": {
						description: "Successfully retrieved configuration",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										fetching_interval: {
											type: "number",
											example: 5,
										},
										keep_data_for: {
											type: "number",
											example: 7,
										},
										api_key: {
											type: "string",
											example: "hashed_api_key",
										},
									},
								},
							},
						},
					},
					"400": {
						description: "Error retrieving configuration",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										error: {
											type: "string",
											example: "Error getting the DockStatAPI config",
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
	.get(
		"/plugins",
		({ set }) => {
			try {
				return pluginManager.getLoadedPlugins();
			} catch (error) {
				const errMsg = error instanceof Error ? error.message : String(error);
				throw new Error(errMsg);
			}
		},
		{
			detail: {
				tags: ["Management"],
				description:
					"Lists all active plugins with their registration details and status",
				responses: {
					"200": {
						description: "Successfully retrieved plugins",
						content: {
							"application/json": {
								schema: {
									type: "array",
									items: {
										type: "object",
										properties: {
											name: {
												type: "string",
												example: "example-plugin",
											},
											version: {
												type: "string",
												example: "1.0.0",
											},
											status: {
												type: "string",
												example: "active",
											},
										},
									},
								},
							},
						},
					},
					"400": {
						description: "Error retrieving plugins",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										error: {
											type: "string",
											example: "Error getting all registered plugins",
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
	.post(
		"/update",
		async ({ set, body }) => {
			try {
				const { fetching_interval, keep_data_for, api_key } = body;

				dbFunctions.updateConfig(
					fetching_interval,
					keep_data_for,
					await hashApiKey(api_key),
				);
				return responseHandler.ok(set, "Updated DockStatAPI config");
			} catch (error) {
				const errMsg = error instanceof Error ? error.message : String(error);
				throw new Error(errMsg);
			}
		},
		{
			detail: {
				tags: ["Management"],
				description:
					"Modifies core API settings including data collection intervals, retention periods, and security credentials",
				responses: {
					"200": {
						description: "Successfully updated configuration",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										message: {
											type: "string",
											example: "Updated DockStatAPI config",
										},
									},
								},
							},
						},
					},
					"400": {
						description: "Error updating configuration",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										error: {
											type: "string",
											example: "Error updating the DockStatAPI config",
										},
									},
								},
							},
						},
					},
				},
			},
			body: t.Object({
				fetching_interval: t.Number(),
				keep_data_for: t.Number(),
				api_key: t.String(),
			}),
		},
	)
	.get(
		"/package",
		async () => {
			try {
				logger.debug("Fetching package.json");
				const data = {
					version: version,
					description: description,
					license: license,
					authorName: authorName,
					authorEmail: authorEmail,
					authorWebsite: authorWebsite,
					contributors: contributors,
					dependencies: dependencies,
					devDependencies: devDependencies,
				};

				logger.debug(
					`Received: ${JSON.stringify(data).length} chars in package.json`,
				);

				if (JSON.stringify(data).length <= 10) {
					throw new Error("Failed to read package.json");
				}

				return data;
			} catch (error) {
				const errMsg = error instanceof Error ? error.message : String(error);
				throw new Error(errMsg);
			}
		},
		{
			detail: {
				tags: ["Management"],
				description:
					"Displays package metadata including dependencies, contributors, and licensing information",
				responses: {
					"200": {
						description: "Successfully retrieved package information",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										version: {
											type: "string",
											example: "3.0.0",
										},
										description: {
											type: "string",
											example:
												"DockStatAPI is an API backend featuring plugins and more for DockStat",
										},
										license: {
											type: "string",
											example: "CC BY-NC 4.0",
										},
										authorName: {
											type: "string",
											example: "ItsNik",
										},
										authorEmail: {
											type: "string",
											example: "info@itsnik.de",
										},
										authorWebsite: {
											type: "string",
											example: "https://github.com/Its4Nik",
										},
										contributors: {
											type: "array",
											items: {
												type: "string",
											},
											example: [],
										},
										dependencies: {
											type: "object",
											example: {
												"@elysiajs/server-timing": "^1.2.1",
												"@elysiajs/static": "^1.2.0",
											},
										},
										devDependencies: {
											type: "object",
											example: {
												"@biomejs/biome": "1.9.4",
												"@types/dockerode": "^3.3.38",
											},
										},
									},
								},
							},
						},
					},
					"400": {
						description: "Error retrieving package information",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										error: {
											type: "string",
											example: "Error while reading package.json",
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
	.post(
		"/backup",
		async ({ set }) => {
			try {
				const backupFilename = await dbFunctions.backupDatabase();
				return responseHandler.ok(set, backupFilename);
			} catch (error) {
				const errMsg = error instanceof Error ? error.message : String(error);
				throw new Error(errMsg);
			}
		},
		{
			detail: {
				tags: ["Management"],
				description: "Backs up the internal database",
				responses: {
					"200": {
						description: "Successfully created backup",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										message: {
											type: "string",
											example: "backup_2024-03-20_12-00-00.db.bak",
										},
									},
								},
							},
						},
					},
					"400": {
						description: "Error creating backup",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										error: {
											type: "string",
											example: "Error backing up",
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
	.get(
		"/backup",
		async ({ set }) => {
			try {
				const backupFiles = readdirSync(backupDir);

				const filteredFiles = backupFiles.filter((file: string) => {
					return !(
						file.endsWith(".db") ||
						file.endsWith(".db-shm") ||
						file.endsWith(".db-wal")
					);
				});

				return filteredFiles;
			} catch (error) {
				const errMsg = error instanceof Error ? error.message : String(error);
				throw new Error(errMsg);
			}
		},
		{
			detail: {
				tags: ["Management"],
				description: "Lists all available backups",
				responses: {
					"200": {
						description: "Successfully retrieved backup list",
						content: {
							"application/json": {
								schema: {
									type: "array",
									items: {
										type: "string",
									},
									example: [
										"backup_2024-03-20_12-00-00.db.bak",
										"backup_2024-03-19_12-00-00.db.bak",
									],
								},
							},
						},
					},
					"400": {
						description: "Error retrieving backup list",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										error: {
											type: "string",
											example: "Reading Backup directory",
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

	.get(
		"/backup/download",
		async ({ query, set }) => {
			try {
				const filename = query.filename || dbFunctions.findLatestBackup();
				const filePath = `${backupDir}/${filename}`;

				if (!existsSync(filePath)) {
					throw new Error("Backup file not found");
				}

				set.headers["Content-Type"] = "application/octet-stream";
				set.headers["Content-Disposition"] =
					`attachment; filename="${filename}"`;
				return Bun.file(filePath);
			} catch (error) {
				const errMsg = error instanceof Error ? error.message : String(error);
				throw new Error(errMsg);
			}
		},
		{
			detail: {
				tags: ["Management"],
				description:
					"Download a specific backup or the latest if no filename is provided",
				responses: {
					"200": {
						description: "Successfully downloaded backup file",
						content: {
							"application/octet-stream": {
								schema: {
									type: "string",
									format: "binary",
									example: "Binary backup file content",
								},
							},
						},
						headers: {
							"Content-Disposition": {
								schema: {
									type: "string",
									example:
										'attachment; filename="backup_2024-03-20_12-00-00.db.bak"',
								},
							},
						},
					},
					"400": {
						description: "Error downloading backup",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										error: {
											type: "string",
											example: "Backup download failed",
										},
									},
								},
							},
						},
					},
				},
			},
			query: t.Object({
				filename: t.Optional(t.String()),
			}),
		},
	)
	.post(
		"/restore",
		async ({ body, set }) => {
			try {
				const { file } = body;

				set.headers["Content-Type"] = "text/html";

				if (!file) {
					throw new Error("No file uploaded");
				}

				if (!file.name.endsWith(".db.bak")) {
					throw new Error("Invalid file type. Expected .db.bak");
				}

				const tempPath = `${backupDir}/upload_${Date.now()}.db.bak`;
				const fileBuffer = await file.arrayBuffer();

				await Bun.write(tempPath, fileBuffer);
				dbFunctions.restoreDatabase(tempPath);
				unlinkSync(tempPath);

				return responseHandler.ok(set, "Database restored successfully");
			} catch (error) {
				const errMsg = error instanceof Error ? error.message : String(error);
				throw new Error(errMsg);
			}
		},
		{
			body: t.Object({ file: t.File() }),
			detail: {
				tags: ["Management"],
				description: "Restore database from uploaded backup file",
				responses: {
					"200": {
						description: "Successfully restored database",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										message: {
											type: "string",
											example: "Database restored successfully",
										},
									},
								},
							},
						},
					},
					"400": {
						description: "Error restoring database",
						content: {
							"application/json": {
								schema: {
									type: "object",
									properties: {
										error: {
											type: "string",
											example: "Database restoration error",
										},
									},
								},
							},
						},
					},
				},
			},
		},
	);
