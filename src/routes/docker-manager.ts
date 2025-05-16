import { Elysia, t } from "elysia";
import type { DockerHost } from "~/typings/docker";
import { dbFunctions } from "~/core/database";
import { logger } from "~/core/utils/logger";
import { responseHandler } from "~/core/utils/response-handler";

export const dockerRoutes = new Elysia({ prefix: "/docker-config" })
  .post(
    "/add-host",
    async ({ set, body }) => {
      try {
        dbFunctions.addDockerHost(body as DockerHost);
        return responseHandler.ok(set, `Added docker host (${body.name})`);
      } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        throw new Error(errMsg);
      }
    },
    {
      detail: {
        tags: ["Management"],
        description:
          "Registers a new Docker host to the monitoring system with connection details",
        responses: {
          "200": {
            description: "Successfully added Docker host",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "Added docker host (Localhost)",
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Error adding Docker host",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                      example: "Error adding docker Host",
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
        const errMsg = error instanceof Error ? error.message : String(error);
        throw new Error(errMsg);
      }
    },
    {
      detail: {
        tags: ["Management"],
        description:
          "Modifies existing Docker host configuration parameters (name, address, security)",
        responses: {
          "200": {
            description: "Successfully updated Docker host",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "Updated docker host (1)",
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Error updating Docker host",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                      example: "Failed to update host",
                    },
                  },
                },
              },
            },
          },
        },
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

        logger.debug("Retrieved docker hosts");
        return dockerHosts;
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        throw new Error(errMsg);
      }
    },
    {
      detail: {
        tags: ["Management"],
        description:
          "Lists all configured Docker hosts with their connection settings",
        responses: {
          "200": {
            description: "Successfully retrieved Docker hosts",
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
                        example: "Localhost",
                      },
                      hostAddress: {
                        type: "string",
                        example: "localhost:2375",
                      },
                      secure: {
                        type: "boolean",
                        example: false,
                      },
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Error retrieving Docker hosts",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                      example: "Failed to retrieve hosts",
                    },
                  },
                },
              },
            },
          },
        },
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
        const errMsg = error instanceof Error ? error.message : String(error);
        throw new Error(errMsg);
      }
    },
    {
      detail: {
        tags: ["Management"],
        description:
          "Removes Docker host from monitoring system and clears associated data",
        responses: {
          "200": {
            description: "Successfully deleted Docker host",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    message: {
                      type: "string",
                      example: "Deleted docker host (1)",
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Error deleting Docker host",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                      example: "Failed to delete host",
                    },
                  },
                },
              },
            },
          },
        },
      },
      params: t.Object({
        id: t.Number(),
      }),
    }
  );
