import Elysia from "elysia";
import { dbFunctions } from "~/core/database";

export const databaseStats = new Elysia({ prefix: "/db-stats" })
	.get(
		"/containers",
		async () => {
			return dbFunctions.getContainerStats();
		},
		{
			detail: {
				tags: ["Statistics"],
				description: "Shows all stored metrics of containers",
				responses: {
					"200": {
						description: "Successfully fetched Container Stats from the DB",
						content: {
							"application/json": {
								schema: {
									type: "array",
									items: {
										type: "object",
										properties: {
											id: {
												type: "string",
												example:
													"0c1142d825a4104f45099e8297428cc7ef820319924aa9cf46739cf1c147cdae",
											},
											hostId: {
												type: "string",
												example: "Localhost",
											},
											name: {
												type: "string",
												example: "heimdall",
											},
											image: {
												type: "string",
												example: "linuxserver/heimdall:latest",
											},
											status: {
												type: "string",
												example: "Up About a minute",
											},
											state: {
												type: "string",
												example: "running",
											},
											cpu_usage: {
												type: "number",
												example: 0.00628140703517588,
											},
											memory_usage: {
												type: "number",
												example: 0.2784590652462969,
											},
											timestamp: {
												type: "string",
												example: "2025-06-07 07:01:26",
											},
										},
									},
								},
							},
						},
					},
				},
			},
		},
	)
	.get(
		"/hosts",
		async () => {
			return dbFunctions.getHostStats();
		},
		{
			detail: {
				tags: ["Statistics"],
				description: "Shows all stored metrics of Docker hosts",
				responses: {
					"200": {
						description: "Successfully fetched Host Stats from the DB",
						content: {
							"application/json": {
								schema: {
									type: "array",
									items: {
										type: "object",
										properties: {
											hostId: {
												type: "number",
												example: 1,
												description: "Unique identifier for the host",
											},
											hostName: {
												type: "string",
												example: "Localhost",
												description: "Display name of the host",
											},
											dockerVersion: {
												type: "string",
												example: "28.2.0",
												description: "Installed Docker version",
											},
											apiVersion: {
												type: "string",
												example: "overlay2",
												description: "Docker API version",
											},
											os: {
												type: "string",
												example: "Arch Linux",
												description: "Host operating system",
											},
											architecture: {
												type: "string",
												example: "x86_64",
												description: "System architecture",
											},
											totalMemory: {
												type: "number",
												example: 33512706048,
												description: "Total system memory in bytes",
											},
											totalCPU: {
												type: "number",
												example: 4,
												description: "Number of available CPU cores",
											},
											labels: {
												type: "string",
												example: "[]",
												description: "JSON string of host labels",
											},
											containers: {
												type: "number",
												example: 3,
												description: "Total containers on host",
											},
											containersRunning: {
												type: "number",
												example: 3,
												description: "Currently running containers",
											},
											containersStopped: {
												type: "number",
												example: 0,
												description: "Stopped containers",
											},
											containersPaused: {
												type: "number",
												example: 0,
												description: "Paused containers",
											},
											images: {
												type: "number",
												example: 30,
												description: "Available Docker images",
											},
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
