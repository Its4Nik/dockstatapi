import { BasicDockerHandler } from "./docker";
import { ApiHandler } from "./config";
import { DatabaseHandler } from "./database";
import { StackHandler } from "./stacks";
import { LogHandler } from "./logs";

export const handlers = {
  BasicDockerHandler,
  ApiHandler,
  DatabaseHandler,
  StackHandler,
  LogHandler,
};
