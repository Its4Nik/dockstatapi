import { Elysia, t } from "elysia";

import { logger } from "~/core/utils/logger";
import { dbFunctions } from "~/core/database";
import { responseHandler } from "~/core/utils/response-handler";

import { DockerHost } from "~/typings/docker";

export const dockerRoutes = new Elysia({ prefix: "/docker-config" })
  .post(
    "/add-host",
    async ({ set, body }) => {
      try {
        set.headers["Content-Type"] = "application/json";
        dbFunctions.addDockerHost(body as DockerHost);
        return responseHandler.ok(set, `Added docker host (${body.name})`);
      } catch (error: unknown) {
        return responseHandler.error(
          set,
          "Error adding docker Host",
          error as string
        );
      }
    },
    {
      detail: {
        tags: ["Management"],
        description:
          "Registers a new Docker host to the monitoring system with connection details",
      },
      body: t.Object({
        name: t.String(),
        hostAddress: t.String(),
        secure: t.Boolean(),
      }),
    }
  )

  .post(
    "/update-host",
    async ({ set, body }) => {
      try {
        set.status = 200;
        dbFunctions.updateDockerHost(body);
        return responseHandler.ok(set, `Updated docker host (${body.id})`);
      } catch (error) {
        return responseHandler.error(
          set,
          error as string,
          "Failed to update host"
        );
      }
    },
    {
      detail: {
        tags: ["Management"],
        description:
          "Modifies existing Docker host configuration parameters (name, address, security)",
      },
      body: t.Object({
        id: t.Number(),
        name: t.String(),
        hostAddress: t.String(),
        secure: t.Boolean(),
      }),
    }
  )

  .get(
    "/hosts",
    async ({ set }) => {
      try {
        const dockerHosts = dbFunctions.getDockerHosts();
        set.headers["Content-Type"] = "application/json";
        logger.debug("Retrieved docker hosts");
        return dockerHosts;
      } catch (error) {
        return responseHandler.error(
          set,
          error as string,
          "Failed to retrieve hosts"
        );
      }
    },
    {
      detail: {
        tags: ["Management"],
        description:
          "Lists all configured Docker hosts with their connection settings",
      },
    }
  )

  .delete(
    "/hosts/:id",
    async ({ set, params }) => {
      try {
        set.status = 200;
        dbFunctions.deleteDockerHost(params.id);
        return responseHandler.ok(set, `Deleted docker host (${params.id})`);
      } catch (error) {
        return responseHandler.error(
          set,
          error as string,
          "Failed to delete host"
        );
      }
    },
    {
      detail: {
        tags: ["Management"],
        description:
          "Removes Docker host from monitoring system and clears associated data",
      },
      params: t.Object({
        id: t.Number(),
      }),
    }
  );
