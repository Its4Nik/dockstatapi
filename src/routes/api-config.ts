import { existsSync, readdir, readdirSync, unlinkSync } from "node:fs";
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
		"/",
		async ({ set }) => {
			try {
				const data = dbFunctions.getConfig() as config[];
				const distinct = data[0];
				set.status = 200;
				set.headers["Content-Type"] = "application/json";
				logger.debug("Fetched backend config");
				return distinct;
			} catch (error) {
				return responseHandler.error(
					set,
					error as string,
					"Error getting the DockStatAPI config",
				);
			}
		},
		{
			detail: {
				tags: ["Management"],
				description:
					"Returns current API configuration including data retention policies and security settings",
			},
		},
	)
	.get(
		"/plugins",
		({ set }) => {
			try {
				return pluginManager.getLoadedPlugins();
			} catch (error) {
				return responseHandler.error(
					set,
					error as string,
					"Error getting all registered plugins",
				);
			}
		},
		{
			detail: {
				tags: ["Management"],
				description:
					"Lists all active plugins with their registration details and status",
			},
		},
	)
	.post(
		"/update",
		async ({ set, body }) => {
			try {
				const { fetching_interval, keep_data_for, api_key } = body;
				set.headers["Content-Type"] = "application/json";
				dbFunctions.updateConfig(
					fetching_interval,
					keep_data_for,
					await hashApiKey(api_key),
				);
				return responseHandler.ok(set, "Updated DockStatAPI config");
			} catch (error) {
				return responseHandler.error(
					set,
					"Error updating the DockStatAPI config",
					error as string,
				);
			}
		},
		{
			body: t.Object({
				fetching_interval: t.Number(),
				keep_data_for: t.Number(),
				api_key: t.String(),
			}),
			detail: {
				tags: ["Management"],
				description:
					"Modifies core API settings including data collection intervals, retention periods, and security credentials",
			},
		},
	)
	.get(
		"/package",
		async ({ set }) => {
			try {
				logger.debug("Fetching package.json");
				return {
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
			} catch (error) {
				return responseHandler.error(
					set,
					error as string,
					"Error while reading package.json",
				);
			}
		},
		{
			detail: {
				tags: ["Management"],
				description:
					"Displays package metadata including dependencies, contributors, and licensing information",
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
				return responseHandler.error(set, error as string, "Error backing up");
			}
		},
		{
			detail: {
				tags: ["Management"],
				description: "Backs up the internal database",
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
				return responseHandler.error(
					set,
					error as string,
					"Reading Backup directory",
				);
			}
		},
		{
			detail: {
				tags: ["Management"],
				description: "Lists all available backups",
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
				return responseHandler.error(
					set,
					error as string,
					"Backup download failed",
				);
			}
		},
		{
			query: t.Object({
				filename: t.Optional(t.String()),
			}),
			detail: {
				tags: ["Management"],
				description:
					"Download a specific backup or the latest if no filename is provided",
			},
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
				return responseHandler.error(
					set,
					error instanceof Error ? error.message : "Restoration failed",
					"Database restoration error",
				);
			}
		},
		{
			body: t.Object({ file: t.File() }),
			detail: {
				tags: ["Management"],
				description: "Restore database from uploaded backup file",
			},
		},
	);
