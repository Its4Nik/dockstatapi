import { Elysia, t } from "elysia";
import { dbFunctions } from "~/core/database/repository";
import { logger } from "~/core/utils/logger";
import { responseHandler } from "~/core/utils/respone-handler";
import { config } from "~/typings/database";
import {
  version,
  authorEmail,
  authorName,
  authorWebsite,
  contributors,
  dependencies,
  description,
  devDependencies,
  license,
} from "~/core/utils/package-json";
import { hashApiKey } from "~/middleware/auth";
import { pluginManager } from "~/core/plugins/plugin-manager";

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
        description: "Returns DockStatAPI's config",
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
    { detail: { tags: ["Management"], description: "List all Plugin Names" } },
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
        description: "Update the current DockStatAPI config",
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
        description: "Returns relevant information about the package.json",
      },
    },
  );
