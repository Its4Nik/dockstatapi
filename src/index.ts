import cors from "@elysiajs/cors";
import { serverTiming } from "@elysiajs/server-timing";
import staticPlugin from "@elysiajs/static";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { dts } from "elysia-remote-dts";
import { Logestic } from "logestic";
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
import type { config } from "~/typings/database";
import { checkStacks } from "./core/stacks/checker";
import { liveStacks } from "./routes/live-stacks";

console.log("");

logger.info("Starting DockStatAPI");

const DockStatAPI = new Elysia({
  normalize: true,
  precompile: true,
})
  .use(cors())
  //.use(Logestic.preset("fancy"))
  .use(staticPlugin())
  .use(serverTiming())
  .use(
    dts("./src/index.ts", {
      tsconfig: "./tsconfig.json",
      compilerOptions: {
        strict: true,
      },
    })
  )
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
              type: "apiKey" as const,
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
          },
        ],
      },
    })
  )
  .onBeforeHandle(async (context) => {
    const { path, request, set } = context;

    if (
      path === "/health" ||
      path.startsWith("/swagger") ||
      path.startsWith("/public")
    ) {
      logger.info(`Requested unguarded route: ${path}`);
      return;
    }

    const validation = await validateApiKey(request, set);

    if (!validation) {
      throw new Error("Error while checking API key");
    }

    if (!validation.success) {
      set.status = 400;

      throw new Error(validation.error);
    }
  })
  .onError(({ code, set, path, error }) => {
    if (code === "NOT_FOUND") {
      logger.warn(`Unknown route (${path}), showing error page!`);
      set.status = 404;
      set.headers["Content-Type"] = "text/html";
      return Bun.file("public/404.html");
    }

    logger.error(`Internal server error at ${path}: ${error.message}`);
    set.status = 500;
    set.headers["Content-Type"] = "text/html";
    return { success: false, message: error.message };
  })
  .use(dockerRoutes)
  .use(dockerStatsRoutes)
  .use(backendLogs)
  .use(dockerWebsocketRoutes)
  .use(apiConfigRoutes)
  .use(stackRoutes)
  .use(liveLogs)
  .use(liveStacks)
  .get("/health", () => ({ status: "healthy" }), {
    tags: ["Utils"],
    response: { message: "healthy" },
  })
  .listen(process.env.DOCKSTATAPI_PORT || 3000, ({ hostname, port }) => {
    console.log("----- [ ############## ]");
    logger.info(`DockStatAPI is running at http://${hostname}:${port}`);
    logger.info(
      `Swagger API Documentation available at http://${hostname}:${port}/swagger`
    );
    logger.info(`License: ${license}`);
    logger.info(`Author: ${authorWebsite}`);
    logger.info(`Contributors: ${contributors}`);
  });

const initializeServer = async () => {
  try {
    await loadPlugins("./src/plugins");
    await setSchedules();

    monitorDockerEvents().catch((error) => {
      logger.error(`Monitoring Error: ${error}`);
    });

    const configData = dbFunctions.getConfig() as config[];
    const apiKey = configData[0].api_key;

    if (apiKey === "changeme") {
      logger.warn(
        "Default API Key of 'changeme' detected. Please change your API Key via the `/config/update` route!"
      );
    }

    await checkStacks();

    logger.info("Started server");
    console.log("----- [ ############## ]");
  } catch (error) {
    logger.error("Error while starting server:", error);
    process.exit(1);
  }
};

await initializeServer();

export type App = typeof DockStatAPI;
export { DockStatAPI };
