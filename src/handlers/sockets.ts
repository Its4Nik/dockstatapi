import { createStackStream } from "./modules/live-stacks";
import { createLogStream } from "./modules/logs-socket";

export const Sockets = {
	stats: {
		port: 4837,
		path: "/ws/docker",
	},
	createLogStream,
	createStackStream,
};
