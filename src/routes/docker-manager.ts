import { Elysia, t } from "elysia";
import { dbFunctions } from "~/core/database/repository";
import { logger } from "~/core/utils/logger";
import { responseHandler } from "~/core/utils/response-handler";

export const dockerRoutes = new Elysia({ prefix: "/docker-config" })
  .post(
    "/add-host",
    async ({ set, body }) => {
      try {
        set.headers["Content-Type"] = "application/json";
        dbFunctions.addDockerHost(body);
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
        description: "Add a new Host as Monitoring target",
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
        return dbFunctions.updateDockerHost(body);
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
        description: "Update an already existing target's config",
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
        description: "Returns an Array of Host-config-objects",
      },
    }
  );
