import { Elysia } from "elysia";
import type { ElysiaWS } from "elysia/dist/ws";
import { dbFunctions } from "~/core/database";
import { getDockerClient } from "~/core/docker/client";
import {
  calculateCpuPercent,
  calculateMemoryUsage,
} from "~/core/utils/calculations";
import { logger } from "~/core/utils/logger";
import { responseHandler } from "~/core/utils/response-handler";
import split2 from "split2";
import type { Readable } from "stream";

const activeDockerConnections = new Set<ElysiaWS<any>>();
const connectionStreams = new Map<
  ElysiaWS<any>,
  Array<{ statsStream: Readable; splitStream: ReturnType<typeof split2> }>
>();

export const dockerWebsocketRoutes = new Elysia({ prefix: "/docker" }).ws(
  "/stats",
  {
    async open(ws) {
      activeDockerConnections.add(ws);
      connectionStreams.set(ws, []);

      ws.send(JSON.stringify({ message: "Connection established" }));
      logger.info(`New Docker WebSocket established (${ws.id})`);

      try {
        const hosts = dbFunctions.getDockerHosts();
        logger.debug(`Retrieved ${hosts.length} docker host(s)`);

        for (const host of hosts) {
          if (ws.readyState !== 1) {
            break;
          }

          const docker = getDockerClient(host);
          await docker.ping();
          const containers = await docker.listContainers({ all: true });
          logger.debug(
            `Found ${containers.length} containers on ${host.name} (id: ${host.id})`
          );

          for (const containerInfo of containers) {
            if (ws.readyState !== 1) {
              break;
            }

            const container = docker.getContainer(containerInfo.Id);
            const statsStream = (await container.stats({
              stream: true,
            })) as Readable;
            const splitStream = split2();

            connectionStreams.get(ws)?.push({ statsStream, splitStream });

            statsStream
              .on("close", () => splitStream.destroy())
              .pipe(splitStream)
              .on("data", (line: string) => {
                if (ws.readyState !== 1 || !line) {
                  return;
                }
                try {
                  const stats = JSON.parse(line);
                  ws.send(
                    JSON.stringify({
                      id: containerInfo.Id,
                      hostId: host.id,
                      name: containerInfo.Names[0].replace(/^\//, ""),
                      image: containerInfo.Image,
                      status: containerInfo.Status,
                      state: containerInfo.State,
                      cpuUsage: calculateCpuPercent(stats) || 0,
                      memoryUsage: calculateMemoryUsage(stats) || 0,
                    })
                  );
                } catch (error) {
                  logger.error(`Parse error: ${error}`);
                }
              })
              .on("error", (error: Error) => {
                logger.error(`Stream error: ${error}`);
                statsStream.destroy();
                ws.send(
                  JSON.stringify({
                    hostId: host.name,
                    containerId: containerInfo.Id,
                    error: `Stats stream error: ${error}`,
                  })
                );
              });
          }
        }
      } catch (error) {
        logger.error(`Connection error: ${error}`);
        ws.send(
          JSON.stringify(
            responseHandler.error(
              { headers: {} },
              error as string,
              "Docker connection failed",
              500
            )
          )
        );
      }
    },

    message(ws, message) {
      if (message === "pong") ws.pong();
    },

    close(ws) {
      logger.info(`Closing connection ${ws.id}`);
      activeDockerConnections.delete(ws);

      const streams = connectionStreams.get(ws) || [];
      streams.forEach(({ statsStream, splitStream }) => {
        try {
          statsStream.unpipe(splitStream);
          statsStream.destroy();
          splitStream.destroy();
        } catch (error) {
          logger.error(`Cleanup error: ${error}`);
        }
      });
      connectionStreams.delete(ws);
    },
  }
);
