import { Elysia, t } from "elysia";
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
import { responseHandler } from "~/core/utils/response-handler";

export const utilRoutes = new Elysia({ prefix: "/utils" }).get(
  "/info",
  async ({ set }) => {
    try {
      set.status = 200;
      return {
        version,
        authorEmail,
        authorName,
        authorWebsite,
        contributors,
        dependencies,
        description,
        devDependencies,
        license,
      };
    } catch (error: any) {
      return responseHandler.error(
        set,
        error.message || error,
        "Error getting DockStatAPI information"
      );
    }
  },
  {
    detail: {
      tags: ["Utils"],
      description: "Shows general information about DockStatAPI",
    },
  }
);
