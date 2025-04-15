import { Elysia, t } from "elysia";

import { logger } from "~/core/utils/logger";
import { dbFunctions } from "~/core/database";
import { responseHandler } from "~/core/utils/response-handler";
import {
  deployStack,
  stopStack,
  pullStackImages,
  restartStack,
  getStackStatus,
  startStack,
  getAllStacksStatus,
  removeStack,
} from "~/core/stacks/controller";

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
          body.stack_prefix
        );
        logger.info(`Deployed Stack (${body.name})`);
        return responseHandler.ok(
          set,
          `Stack ${body.name} deployed successfully`
        );
      } catch (error: any) {
        return responseHandler.error(
          set,
          error.message || error,
          "Error deploying stack"
        );
      }
    },
    {
      detail: {
        tags: ["Stacks"],
        description:
          "Deploys a new Docker stack using a provided compose specification, allowing custom configurations and image updates",
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
    }
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
          `Stack ${body.stackId} started successfully`
        );
      } catch (error: any) {
        return responseHandler.error(
          set,
          error.message || error,
          "Error starting stack"
        );
      }
    },
    {
      detail: {
        tags: ["Stacks"],
        description:
          "Initiates a Docker stack, starting all associated containers",
      },
      body: t.Object({
        stackId: t.Number(),
      }),
    }
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
          `Stack ${body.stackId} stopped successfully`
        );
      } catch (error: any) {
        return responseHandler.error(
          set,
          error.message || error,
          "Error stopping stack"
        );
      }
    },
    {
      detail: {
        tags: ["Stacks"],
        description:
          "Halts a running Docker stack and its containers while preserving configurations",
      },
      body: t.Object({
        stackId: t.Number(),
      }),
    }
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
          `Stack ${body.stackId} restarted successfully`
        );
      } catch (error: any) {
        return responseHandler.error(
          set,
          error.message || error,
          "Error restarting stack"
        );
      }
    },
    {
      detail: {
        tags: ["Stacks"],
        description:
          "Performs full stack restart - stops and restarts all stack components in sequence",
      },
      body: t.Object({
        stackId: t.Number(),
      }),
    }
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
          `Images for stack ${body.stackId} pulled successfully`
        );
      } catch (error: any) {
        return responseHandler.error(
          set,
          error.message || error,
          "Error pulling images"
        );
      }
    },
    {
      detail: {
        tags: ["Stacks"],
        description:
          "Updates container images for a stack using Docker's pull mechanism (requires stack ID)",
      },
      body: t.Object({
        stackId: t.Number(),
      }),
    }
  )
  .get(
    "/status",
    async ({ set, query }) => {
      try {
        let status;
        let res = {};
        if (query.stackId) {
          status = await getStackStatus(query.stackId);
          res = responseHandler.ok(
            set,
            `Stack ${query.stackId} status retrieved successfully`
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
          "Error getting stack status"
        );
      }
    },
    {
      detail: {
        tags: ["Stacks"],
        description:
          "Retrieves operational status for either a specific stack (by ID) or all managed stacks",
      },
      query: t.Object({
        stackId: t.Number(),
      }),
    }
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
          "Error getting stacks"
        );
      }
    },
    {
      detail: {
        tags: ["Stacks"],
        description:
          "Lists all registered stacks with their complete configuration details",
      },
    }
  )

  .delete(
    "/",
    async ({ set, body }) => {
      try {
        const { stackId } = body;
        await removeStack(stackId);
        logger.info(`Deleted Stack ${stackId}`);
        return responseHandler.ok(set, `Stack ${stackId} deleted successfully`);
      } catch (error: any) {
        return responseHandler.error(
          set,
          error.message || error,
          "Error deleting stack"
        );
      }
    },
    {
      detail: {
        tags: ["Stacks"],
        description:
          "Permanently removes a stack configuration and cleans up associated resources",
      },
      body: t.Object({
        stackId: t.Number(),
      }),
    }
  );
