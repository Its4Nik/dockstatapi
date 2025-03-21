import { Elysia, t } from "elysia";
import { responseHandler } from "~/core/utils/respone-handler";
import {
  deployStack,
  stopStack,
  pullStackImages,
  restartStack,
  getStackStatus,
  startStack,
  getAllStacksStatus,
} from "~/core/stacks/controller";
import { dbFunctions } from "~/core/database/repository";
import { logger } from "~/core/utils/logger";

export const stackRoutes = new Elysia({ prefix: "/stacks" })
  .post(
    "/deploy",
    async ({ set, body }) => {
      try {
        const isCustom = body.isCustom || false;

        const image_updates = body.image_updates || false;

        let missingParams: string[] = [];
        if (!body.compose_spec) {
          missingParams.push("compose_spec");
        }
        if (body.automatic_reboot_on_error === undefined) {
          missingParams.push("automatic_reboot_on_error");
        }
        if (!body.source) {
          missingParams.push("source");
        }
        if (!body.name) {
          missingParams.push("name");
        }

        if (missingParams.length > 0) {
          const errMsg = `Missing values of: ${missingParams.join("; ")}`;
          return responseHandler.error(set, errMsg, errMsg);
        }

        await deployStack(
          body.compose_spec,
          body.name,
          body.version,
          body.source,
          body.automatic_reboot_on_error,
          isCustom,
          image_updates,
          body.stack_prefix,
        );
        logger.info(`Deployed Stack (${body.name})`);
        return responseHandler.ok(
          set,
          `Stack ${body.name} deployed successfully`,
        );
      } catch (error: any) {
        return responseHandler.error(
          set,
          error.message || error,
          "Error deploying stack",
        );
      }
    },
    {
      detail: {
        tags: ["Stacks"],
        description:
          "Deploy a Stack, either with a prebuilt one or provide your own structure",
      },
      body: t.Object({
        compose_spec: t.Any(),
        name: t.String(),
        version: t.Number(),
        automatic_reboot_on_error: t.Boolean(),
        isCustom: t.Boolean(),
        image_updates: t.Boolean(),
        source: t.String(),
        stack_prefix: t.Optional(t.String()),
      }),
    },
  )
  .post(
    "/start",
    async ({ set, body }) => {
      try {
        if (!body.stack) {
          throw new Error("Stack needed");
        }
        await startStack(body.stack);
        logger.info(`Started Stack (${body.stack})`);
        return responseHandler.ok(
          set,
          `Stack ${body.stack} started successfully`,
        );
      } catch (error: any) {
        return responseHandler.error(
          set,
          error.message || error,
          "Error starting stack",
        );
      }
    },
    {
      detail: { tags: ["Stacks"], description: "Start a specific Stack" },
      body: t.Object({
        stack: t.Any(),
      }),
    },
  )
  .post(
    "/stop",
    async ({ set, body }) => {
      try {
        if (!body.stack) {
          throw new Error("Stack needed");
        }
        await stopStack(body.stack);
        logger.info(`Stopped Stack (${body.stack})`);
        return responseHandler.ok(
          set,
          `Stack ${body.stack} stopped successfully`,
        );
      } catch (error: any) {
        return responseHandler.error(
          set,
          error.message || error,
          "Error stopping stack",
        );
      }
    },
    {
      detail: { tags: ["Stacks"], description: "Stop the specified Stack" },
      body: t.Object({
        stack: t.Any(),
      }),
    },
  )
  .post(
    "/restart",
    async ({ set, body }) => {
      try {
        if (!body.stack) {
          throw new Error("Stack needed");
        }
        await restartStack(body.stack);
        logger.info(`Restarted Stack (${body.stack})`);
        return responseHandler.ok(
          set,
          `Stack ${body.stack} restarted successfully`,
        );
      } catch (error: any) {
        return responseHandler.error(
          set,
          error.message || error,
          "Error restarting stack",
        );
      }
    },
    {
      detail: { tags: ["Stacks"], description: "Restart a whole Stack" },
      body: t.Object({
        stack: t.Any(),
      }),
    },
  )
  .post(
    "/pull-images",
    async ({ set, body }) => {
      try {
        if (!body.stack) {
          throw new Error("Stack needed");
        }
        await pullStackImages(body.stack);
        logger.info(`Pulled Stack images (${body.stack})`);
        return responseHandler.ok(
          set,
          `Images for stack ${body.stack} pulled successfully`,
        );
      } catch (error: any) {
        return responseHandler.error(
          set,
          error.message || error,
          "Error pulling images",
        );
      }
    },
    {
      detail: {
        tags: ["Stacks"],
        description: "Runs `docker compose pull` on the provided Stack",
      },
      body: t.Object({
        stack: t.Any(),
      }),
    },
  )
  .get(
    "/status",
    async ({ set, query }) => {
      try {
        let status;
        let res = {};
        if (query.stack_name) {
          status = await getStackStatus(query.stack_name);
          res = responseHandler.ok(
            set,
            `Stack ${query.stack_name} status retrieved successfully`,
          );
          logger.info("Fetched Stack status");
        } else {
          status = await getAllStacksStatus();
          res = responseHandler.ok(set, "Fetched all Stack's status");
          logger.info("Fetched all Stack status");
        }
        return { ...res, status: status };
      } catch (error: any) {
        return responseHandler.error(
          set,
          error.message || error,
          "Error getting stack status",
        );
      }
    },
    {
      detail: {
        tags: ["Stacks"],
        description:
          "Fetches the current status of all containers for a specific Stack or if no Stack name is provided, for all Stacks",
      },
      query: t.Object({
        stack_name: t.Any(),
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
      } catch (error: any) {
        return responseHandler.error(
          set,
          error.message || error,
          "Error getting stacks",
        );
      }
    },
    {
      detail: {
        tags: ["Stacks"],
        description: "Returns an Array of Stack-config-objects",
      },
    },
  );
