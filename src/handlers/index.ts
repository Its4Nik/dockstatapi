import { ApiHandler } from "./config";
import { DatabaseHandler } from "./database";
import { BasicDockerHandler } from "./docker";
import { LogHandler } from "./logs";
import { StackHandler } from "./stacks";

export const handlers = {
	BasicDockerHandler,
	ApiHandler,
	DatabaseHandler,
	StackHandler,
	LogHandler,
};
