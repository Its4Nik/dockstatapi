import * as fs from "fs";
import * as net from "net";
import logger from "../config/loggerConfig";

const filePath: string = "./src/data/dockerConfig.json";

interface Host {
  name: string;
  url: string;
  port: string;
}

interface StatusResponse {
  ApiReachable: boolean;
  online: { [key: string]: boolean };
}

async function checkHostStatus(hosts: Host[]): Promise<StatusResponse> {
  const results: { [key: string]: boolean } = {};
  for (const host of hosts) {
    const { name, url, port } = host;

    const isOnline = await checkPort(url, parseInt(port, 10));

    results[name] = isOnline ? true : false;

    if (results[name] == true) {
      logger.debug(`${host.url}:${port} is online`);
    } else {
      logger.debug(`${host.url}:${port} is unreachable`);
    }
  }

  return {
    ApiReachable: true,
    online: results,
  };
}

function checkPort(host: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(3000);

    socket.on("connect", () => {
      socket.end();
      resolve(true);
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });

    socket.on("error", () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(port, host);
  });
}

async function checkReachability(): Promise<StatusResponse | undefined> {
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    const parsedData = JSON.parse(data);
    const hosts: Host[] = parsedData.hosts;
    const resp = await checkHostStatus(hosts);
    return resp;
  } catch (error: any) {
    logger.error(`Error reading file: ${error}`);
    return undefined;
  }
}

export default checkReachability;
