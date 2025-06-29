import { createDockerStatsStream } from "./modules/docker-socket";
import { createStackStream } from "./modules/live-stacks";
import { createLogStream } from "./modules/logs-socket";

export const Sockets = {
	createDockerStatsStream,
	createLogStream,
	createStackStream,
};
