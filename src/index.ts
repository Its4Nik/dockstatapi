import { serverTiming } from "@elysiajs/server-timing";
import staticPlugin from "@elysiajs/static";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";

import { dbFunctions } from "~/core/database";
import { monitorDockerEvents } from "~/core/docker/monitor";
import { setSchedules } from "~/core/docker/scheduler";
import { loadPlugins } from "~/core/plugins/loader";
import { logger } from "~/core/utils/logger";
import {
	authorWebsite,
	contributors,
	license,
} from "~/core/utils/package-json";
import { swaggerReadme } from "~/core/utils/swagger-readme";

import { validateApiKey } from "~/middleware/auth";

import { apiConfigRoutes } from "~/routes/api-config";
import { dockerRoutes } from "~/routes/docker-manager";
import { dockerStatsRoutes } from "~/routes/docker-stats";
import { dockerWebsocketRoutes } from "~/routes/docker-websocket";
import { liveLogs } from "~/routes/live-logs";
import { backendLogs } from "~/routes/logs";
import { stackRoutes } from "~/routes/stacks";
import { utilRoutes } from "~/routes/utils";
import { liveStacks } from "./routes/live-stacks";

import type { config } from "~/typings/database";

console.log("");

logger.info("Starting DockStatAPI");

export const DockStatAPI = new Elysia()
	.use(staticPlugin())
	.use(serverTiming())
	.use(
		swagger({
			documentation: {
				info: {
					title: "DockStatAPI",
					version: "3.0.0",
					description: swaggerReadme,
				},
				components: {
					securitySchemes: {
						apiKeyAuth: {
							type: "apiKey",
							name: "x-api-key",
							in: "header",
							description: "API key for authentication",
						},
					},
				},
				security: [
					{
						apiKeyAuth: [],
					},
				],
				tags: [
					{
						name: "Statistics",
						description:
							"All endpoints for fetching statistics of hosts / containers",
					},
					{
						name: "Management",
						description: "Various endpoints for managing DockStatAPI",
					},
					{
						name: "Stacks",
						description: "DockStat's Stack functionality",
					},
					{
						name: "Utils",
						description: "Various utilities which might be useful",
					}
				],
			},
		}),
	)
	.onBeforeHandle(async (context) => {
		const { path, request, set } = context;

		if (path === "/health" || path.startsWith("/swagger") || path.startsWith("/trpc")) {
			logger.info(`Requested unguarded route: ${path}`);
			return;
		}

		const validation = await validateApiKey(request, set);

		if (validation.error) {
			set.status = 400;
			set.headers["Content-Type"] = "application/json";
			return { error: validation.error };
		}
	})
	.use(dockerRoutes)
	.use(dockerStatsRoutes)
	.use(backendLogs)
	.use(dockerWebsocketRoutes)
	.use(apiConfigRoutes)
	.use(utilRoutes)
	.use(stackRoutes)
	.use(utilRoutes)
	.use(liveLogs)
	.use(liveStacks)
	.get("/health", () => ({ status: "healthy" }), { tags: ["Utils"] })
	.onError(({ code, set, path }) => {
		if (code === "NOT_FOUND") {
			logger.warn(`Unknown route (${path}), showing error page!`);
			set.status = 404;
			set.headers["Content-Type"] = "text/html";
			return Bun.file("public/404.html");
		}
	});

async function startServer() {
	try {
		try {
			await loadPlugins("./src/plugins");
		} catch (error) {
			throw new Error(`Failed to load plugins: ${error}`);
		}

		try {
			await setSchedules();
		} catch (error) {
			throw new Error(`Failed to set schedules: ${error}`);
		}

		monitorDockerEvents().catch((error) => {
			logger.error(`Monitoring Error: ${error}`);
		});

		const configData = dbFunctions.getConfig() as config[];
		const apiKey = configData[0].api_key;

		if (apiKey === "changeme") {
			logger.warn(
				"Default API Key of 'changeme' detected. Please change your API Key via the `/config/update` route!",
			);
		}

		try {
			DockStatAPI.listen(
				process.env.DOCKSTATAPI_PORT || 3000,
				({ hostname, port }) => {
					console.log("----- [ ############## ]");
					logger.info(`DockStatAPI is running at http://${hostname}:${port}`);
					logger.info(
						`Swagger API Documentation available at http://${hostname}:${port}/swagger`,
					);
					logger.info(`License: ${license}`);
					logger.info(`Author: ${authorWebsite}`);
					logger.info(`Contributors: ${contributors}`);
				},
			);
		} catch (error) {
			logger.error("Failed to start server:", error);
			process.exit(1);
		}
	} catch (error) {
		logger.error("Error while starting server:", error);
		process.exit(1);
	}
}

await startServer();

logger.info("Started server");
console.log("----- [ ############## ]");
