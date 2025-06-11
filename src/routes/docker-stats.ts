import type Docker from "dockerode";
import { Elysia } from "elysia";
import { dbFunctions } from "~/core/database";
import { getDockerClient } from "~/core/docker/client";
import {
  calculateCpuPercent,
  calculateMemoryUsage,
} from "~/core/utils/calculations";
import { findObjectByKey } from "~/core/utils/helpers";
import { logger } from "~/core/utils/logger";
import { responseHandler } from "~/core/utils/response-handler";
import type { ContainerInfo, DockerHost, HostStats } from "~/typings/docker";
import type { DockerInfo } from "~/typings/dockerode";

export const dockerStatsRoutes = new Elysia({ prefix: "/docker" })
  .get(
    "/containers",
    async ({ set }) => {
      try {
        const hosts = dbFunctions.getDockerHosts() as DockerHost[];
        const containers: ContainerInfo[] = [];

        await Promise.all(
          hosts.map(async (host) => {
            try {
              const docker = getDockerClient(host);
              try {
                await docker.ping();
              } catch (pingError) {
                return responseHandler.error(
                  set,
                  pingError as string,
                  "Docker host connection failed"
                );
              }

              const hostContainers = await docker.listContainers({ all: true });

              await Promise.all(
                hostContainers.map(async (containerInfo) => {
                  try {
                    const container = docker.getContainer(containerInfo.Id);
                    const stats = await new Promise<Docker.ContainerStats>(
                      (resolve, reject) => {
                        container.stats({ stream: false }, (error, stats) => {
                          if (error) {
                            return responseHandler.reject(
                              set,
                              reject,
                              "An error occurred",
                              error
                            );
                          }
                          if (!stats) {
                            return responseHandler.reject(
                              set,
                              reject,
                              "No stats available"
                            );
                          }
                          resolve(stats);
                        });
                      }
                    );

                    containers.push({
                      id: containerInfo.Id,
                      hostId: `${host.id}`,
                      name: containerInfo.Names[0].replace(/^\//, ""),
                      image: containerInfo.Image,
                      status: containerInfo.Status,
                      state: containerInfo.State,
                      cpuUsage: calculateCpuPercent(stats),
                      memoryUsage: calculateMemoryUsage(stats),
                      stats: stats,
                      info: containerInfo,
                    });
                  } catch (containerError) {
                    logger.error(
                      "Error fetching container stats,",
                      containerError
                    );
                  }
                })
              );
              logger.debug(`Fetched stats for ${host.name}`);
            } catch (error) {
              const errMsg =
                error instanceof Error ? error.message : String(error);
              throw new Error(errMsg);
            }
          })
        );

        logger.debug("Fetched all containers across all hosts");
        return { containers };
      } catch (error) {
        const errMsg = error instanceof Error ? error.message : String(error);
        throw new Error(errMsg);
      }
    },
    {
      detail: {
        tags: ["Statistics"],
        description:
          "Collects real-time statistics for all Docker containers across monitored hosts, including CPU and memory utilization",
        responses: {
          "200": {
            description: "Successfully retrieved container statistics",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    containers: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          id: {
                            type: "string",
                            example: "abc123def456",
                          },
                          hostId: {
                            type: "string",
                            example: "1",
                          },
                          name: {
                            type: "string",
                            example: "example-container",
                          },
                          image: {
                            type: "string",
                            example: "nginx:latest",
                          },
                          status: {
                            type: "string",
                            example: "running",
                          },
                          state: {
                            type: "string",
                            example: "running",
                          },
                          cpuUsage: {
                            type: "number",
                            example: 0.5,
                          },
                          memoryUsage: {
                            type: "number",
                            example: 1024,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Error retrieving container statistics",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                      example: "Failed to retrieve containers",
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
  .get(
    "/hosts",
    async ({ set }) => {
      try {
        const hosts = dbFunctions.getDockerHosts() as DockerHost[];

        const stats: HostStats[] = [];

        for (const host of hosts) {
          const docker = getDockerClient(host);
          const info: DockerInfo = await docker.info();

          const config: HostStats = {
            hostId: host.id as number,
            hostName: host.name,
            dockerVersion: info.ServerVersion,
            apiVersion: info.Driver,
            os: info.OperatingSystem,
            architecture: info.Architecture,
            totalMemory: info.MemTotal,
            totalCPU: info.NCPU,
            labels: info.Labels,
            images: info.Images,
            containers: info.Containers,
            containersPaused: info.ContainersPaused,
            containersRunning: info.ContainersRunning,
            containersStopped: info.ContainersStopped,
          };

          stats.push(config);
        }

        logger.debug("Fetched all hosts");
        return stats;
      } catch (error) {
        return responseHandler.error(
          set,
          error as string,
          "Failed to retrieve host config"
        );
      }
    },
    {
      detail: {
        tags: ["Statistics"],
        description:
          "Provides detailed system metrics and Docker runtime information for specified host",
        responses: {
          "200": {
            description: "Successfully retrieved host statistics",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    hostId: {
                      type: "number",
                      example: 1,
                    },
                    hostName: {
                      type: "string",
                      example: "Localhost",
                    },
                    dockerVersion: {
                      type: "string",
                      example: "24.0.5",
                    },
                    apiVersion: {
                      type: "string",
                      example: "1.41",
                    },
                    os: {
                      type: "string",
                      example: "Linux",
                    },
                    architecture: {
                      type: "string",
                      example: "x86_64",
                    },
                    totalMemory: {
                      type: "number",
                      example: 16777216,
                    },
                    totalCPU: {
                      type: "number",
                      example: 4,
                    },
                    labels: {
                      type: "array",
                      items: {
                        type: "string",
                      },
                      example: ["environment=production"],
                    },
                    images: {
                      type: "number",
                      example: 10,
                    },
                    containers: {
                      type: "number",
                      example: 5,
                    },
                    containersPaused: {
                      type: "number",
                      example: 0,
                    },
                    containersRunning: {
                      type: "number",
                      example: 4,
                    },
                    containersStopped: {
                      type: "number",
                      example: 1,
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Error retrieving host statistics",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                      example: "Failed to retrieve host config",
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
  .get(
    "/hosts",
    async ({ set }) => {
      try {
        const hosts = dbFunctions.getDockerHosts() as DockerHost[];

        const stats: HostStats[] = [];

        for (const host of hosts) {
          const docker = getDockerClient(host);
          const info: DockerInfo = await docker.info();

          const config: HostStats = {
            hostId: host.id as number,
            hostName: host.name,
            dockerVersion: info.ServerVersion,
            apiVersion: info.Driver,
            os: info.OperatingSystem,
            architecture: info.Architecture,
            totalMemory: info.MemTotal,
            totalCPU: info.NCPU,
            labels: info.Labels,
            images: info.Images,
            containers: info.Containers,
            containersPaused: info.ContainersPaused,
            containersRunning: info.ContainersRunning,
            containersStopped: info.ContainersStopped,
          };

          stats.push(config);
        }

        logger.debug("Fetched stats for all hosts");
        return stats;
      } catch (error) {
        return responseHandler.error(
          set,
          error as string,
          "Failed to retrieve host config"
        );
      }
    },
    {
      detail: {
        tags: ["Statistics"],
        description:
          "Provides detailed system metrics and Docker runtime information for all hosts",
        responses: {
          "200": {
            description: "Successfully retrieved host statistics",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    hostId: {
                      type: "number",
                      example: 1,
                    },
                    hostName: {
                      type: "string",
                      example: "Localhost",
                    },
                    dockerVersion: {
                      type: "string",
                      example: "24.0.5",
                    },
                    apiVersion: {
                      type: "string",
                      example: "1.41",
                    },
                    os: {
                      type: "string",
                      example: "Linux",
                    },
                    architecture: {
                      type: "string",
                      example: "x86_64",
                    },
                    totalMemory: {
                      type: "number",
                      example: 16777216,
                    },
                    totalCPU: {
                      type: "number",
                      example: 4,
                    },
                    labels: {
                      type: "array",
                      items: {
                        type: "string",
                      },
                      example: ["environment=production"],
                    },
                    images: {
                      type: "number",
                      example: 10,
                    },
                    containers: {
                      type: "number",
                      example: 5,
                    },
                    containersPaused: {
                      type: "number",
                      example: 0,
                    },
                    containersRunning: {
                      type: "number",
                      example: 4,
                    },
                    containersStopped: {
                      type: "number",
                      example: 1,
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Error retrieving host statistics",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                      example: "Failed to retrieve host config",
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
  .get(
    "/hosts/:id",
    async ({ params, set }) => {
      try {
        const hosts = dbFunctions.getDockerHosts() as DockerHost[];

        const host = findObjectByKey(hosts, "id", Number(params.id));
        if (!host) {
          return responseHandler.simple_error(
            set,
            `Host (${params.id}) not found`
          );
        }

        const docker = getDockerClient(host);
        const info: DockerInfo = await docker.info();

        const config: HostStats = {
          hostId: host.id as number,
          hostName: host.name,
          dockerVersion: info.ServerVersion,
          apiVersion: info.Driver,
          os: info.OperatingSystem,
          architecture: info.Architecture,
          totalMemory: info.MemTotal,
          totalCPU: info.NCPU,
          labels: info.Labels,
          images: info.Images,
          containers: info.Containers,
          containersPaused: info.ContainersPaused,
          containersRunning: info.ContainersRunning,
          containersStopped: info.ContainersStopped,
        };

        logger.debug(`Fetched config for ${host.name}`);
        return config;
      } catch (error) {
        return responseHandler.error(
          set,
          error as string,
          "Failed to retrieve host config"
        );
      }
    },
    {
      detail: {
        tags: ["Statistics"],
        description:
          "Provides detailed system metrics and Docker runtime information for specified host",
        responses: {
          "200": {
            description: "Successfully retrieved host statistics",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    hostId: {
                      type: "number",
                      example: 1,
                    },
                    hostName: {
                      type: "string",
                      example: "Localhost",
                    },
                    dockerVersion: {
                      type: "string",
                      example: "24.0.5",
                    },
                    apiVersion: {
                      type: "string",
                      example: "1.41",
                    },
                    os: {
                      type: "string",
                      example: "Linux",
                    },
                    architecture: {
                      type: "string",
                      example: "x86_64",
                    },
                    totalMemory: {
                      type: "number",
                      example: 16777216,
                    },
                    totalCPU: {
                      type: "number",
                      example: 4,
                    },
                    labels: {
                      type: "array",
                      items: {
                        type: "string",
                      },
                      example: ["environment=production"],
                    },
                    images: {
                      type: "number",
                      example: 10,
                    },
                    containers: {
                      type: "number",
                      example: 5,
                    },
                    containersPaused: {
                      type: "number",
                      example: 0,
                    },
                    containersRunning: {
                      type: "number",
                      example: 4,
                    },
                    containersStopped: {
                      type: "number",
                      example: 1,
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Error retrieving host statistics",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    error: {
                      type: "string",
                      example: "Failed to retrieve host config",
                    },
                  },
                },
              },
            },
          },
        },
      },
    }
  );
