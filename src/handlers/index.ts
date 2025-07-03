import { setSchedules } from "~/core/docker/scheduler";
import { pluginManager } from "~/core/plugins/plugin-manager";
import { logger } from "~/core/utils/logger";
import { ApiHandler } from "./config";
import { DatabaseHandler } from "./database";
import { BasicDockerHandler } from "./docker";
import { LogHandler } from "./logs";
import { startDockerStatsBroadcast } from "./modules/docker-socket";
import { Starter } from "./modules/starter";
import { Sockets } from "./sockets";
import { StackHandler } from "./stacks";
import { CheckHealth } from "./utils";

export const handlers = {
	BasicDockerHandler,
	ApiHandler,
	DatabaseHandler,
	StackHandler,
	LogHandler,
	CheckHealth,
	Sockets: Sockets,
};

Starter.startAll();
