import { Elysia, t } from "elysia";

import {
	authorEmail,
	authorName,
	authorWebsite,
	contributors,
	dependencies,
	description,
	devDependencies,
	license,
	version,
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
		} catch (error) {
			return responseHandler.error(
				set,
				String(error),
				"Error getting DockStatAPI information",
			);
		}
	},
	{
		detail: {
			tags: ["Utils"],
			description:
				"Retrieves DockStatAPI metadata including version, author information, dependencies, and licensing details",
		},
	},
);
