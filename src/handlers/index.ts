import { setSchedules } from "~/core/docker/scheduler";
import { pluginManager } from "~/core/plugins/plugin-manager";
import { ApiHandler } from "./config";
import { DatabaseHandler } from "./database";
import { BasicDockerHandler } from "./docker";
import { LogHandler } from "./logs";
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
	StartServer: setSchedules(),
	ImportPlugins: await pluginManager.start(),
};
