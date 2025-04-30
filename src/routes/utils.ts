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
			responses: {
				"200": {
					description: "Successfully retrieved API information",
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									version: {
										type: "string",
										example: "3.0.0",
									},
									authorEmail: {
										type: "string",
										example: "info@itsnik.de",
									},
									authorName: {
										type: "string",
										example: "ItsNik",
									},
									authorWebsite: {
										type: "string",
										example: "https://github.com/Its4Nik",
									},
									contributors: {
										type: "array",
										items: {
											type: "string",
										},
										example: [],
									},
									dependencies: {
										type: "object",
										example: {
											"@elysiajs/server-timing": "^1.2.1",
											"@elysiajs/static": "^1.2.0",
										},
									},
									description: {
										type: "string",
										example:
											"DockStatAPI is an API backend featuring plugins and more for DockStat",
									},
									devDependencies: {
										type: "object",
										example: {
											"@biomejs/biome": "1.9.4",
											"@types/dockerode": "^3.3.38",
										},
									},
									license: {
										type: "string",
										example: "CC BY-NC 4.0",
									},
								},
							},
						},
					},
				},
				"400": {
					description: "Error retrieving API information",
					content: {
						"application/json": {
							schema: {
								type: "object",
								properties: {
									error: {
										type: "string",
										example: "Error getting DockStatAPI information",
									},
								},
							},
						},
					},
				},
			},
		},
	},
);
