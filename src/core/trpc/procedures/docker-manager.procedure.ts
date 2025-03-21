import { dbFunctions } from "~/core/database/repository";
import { logger } from "~/core/utils/logger";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { router, publicProcedure } from "../trpc";
import { DockerHost } from "~/typings/docker";

const addHostInput = z.object({
  name: z.string(),
  hostadress: z.string(),
  secure: z.boolean(),
});

const updateHostInput = z.object({
  name: z.string(),
  hostadress: z.string(),
  secure: z.boolean(),
});

export const dockerManagerProcedure = router({
  addHost: publicProcedure.input(addHostInput).mutation(({ input }) => {
    try {
      dbFunctions.addDockerHost(input as DockerHost);
      logger.debug(`Added docker host (${input.name})`);
      return { success: true, message: `Added docker host (${input.name})` };
    } catch (error) {
      logger.error("Error adding docker host", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Error adding docker host",
        cause: error,
      });
    }
  }),

  updateHost: publicProcedure.input(updateHostInput).mutation(({ input }) => {
    try {
      (input as unknown as DockerHost).id = "0";
      dbFunctions.updateDockerHost(input as DockerHost);
      return { success: true, message: `Updated docker host (${name})` };
    } catch (error) {
      logger.error("Error updating docker host", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update host",
        cause: error,
      });
    }
  }),

  getHosts: publicProcedure.query(() => {
    try {
      const dockerHosts = dbFunctions.getDockerHosts();
      logger.debug("Retrieved docker hosts via tRPC");
      return dockerHosts;
    } catch (error) {
      logger.error("Error retrieving docker hosts", error);
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to retrieve hosts",
        cause: error,
      });
    }
  }),
});
