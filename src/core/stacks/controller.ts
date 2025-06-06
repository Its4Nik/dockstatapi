import { runStackCommand } from "./operations/runStackCommand";
import {
  getStackPath,
  createStackYAML,
  getStackName,
} from "./operations/stackHelpers";
import { dbFunctions } from "~/core/database";
import { logger } from "~/core/utils/logger";
import { postToClient } from "~/routes/live-stacks";
import type { stacks_config } from "~/typings/database";
import { checkStacks } from "./checker";
import type { Stack } from "~/typings/docker-compose";
import { wrapProgressCallback } from "./operations/runStackCommand";
import type { ComposeSpec } from "~/typings/docker-compose";
import { rm } from "node:fs/promises";
import DockerCompose from "docker-compose";

export async function deployStack(stack_config: stacks_config): Promise<void> {
  let stackId: number | null = null;
  let stackPath = "";

  try {
    logger.debug(`Deploying Stack: ${JSON.stringify(stack_config)}`);
    if (!stack_config.name) throw new Error("Stack name needed");

    const jsonStringStack = {
      ...stack_config,
      compose_spec: JSON.stringify(stack_config.compose_spec),
    };

    stackId = dbFunctions.addStack(jsonStringStack) || null;
    if (!stackId) {
      throw new Error("Failed to add stack to database");
    }

    postToClient({
      type: "stack-status",
      data: {
        stack_id: stackId,
        status: "pending",
        message: "Creating stack configuration",
      },
    });

    const stackYaml: Stack = {
      id: stackId,
      name: stack_config.name,
      source: stack_config.source,
      version: stack_config.version,
      compose_spec: stack_config.compose_spec as unknown as ComposeSpec,
    };

    await createStackYAML(stackYaml);
    stackPath = await getStackPath(stackYaml);

    await runStackCommand(
      stackId,
      (cwd, progressCallback) =>
        DockerCompose.upAll({
          cwd,
          log: true,
          callback: wrapProgressCallback(progressCallback),
        }),
      "deploying"
    );

    postToClient({
      type: "stack-status",
      data: {
        stack_id: stackId,
        status: "deployed",
        message: "Stack deployed successfully",
      },
    });

    await checkStacks();
  } catch (error: unknown) {
    const errorMsg =
      error instanceof Error ? error.message : JSON.stringify(error);
    logger.error(errorMsg);
    if (stackId !== null) {
      dbFunctions.deleteStack(stackId);
      if (stackPath) {
        try {
          await rm(stackPath, { recursive: true });
        } catch (cleanupError) {
          logger.error(`Error cleaning up stack path: ${cleanupError}`);
        }
      }
    }
    postToClient({
      type: "stack-error",
      data: {
        stack_id: stackId ?? 0,
        action: "deploying",
        message: errorMsg,
        timestamp: new Date().toISOString(),
      },
    });
    throw new Error(errorMsg);
  }
}

export async function stopStack(stack_id: number): Promise<void> {
  await runStackCommand(
    stack_id,
    (cwd, progressCallback) =>
      DockerCompose.downAll({
        cwd,
        log: true,
        callback: wrapProgressCallback(progressCallback),
      }),
    "stopping"
  );
}

export async function startStack(stack_id: number): Promise<void> {
  await runStackCommand(
    stack_id,
    (cwd, progressCallback) =>
      DockerCompose.upAll({
        cwd,
        log: true,
        callback: wrapProgressCallback(progressCallback),
      }),
    "starting"
  );
}

export async function pullStackImages(stack_id: number): Promise<void> {
  await runStackCommand(
    stack_id,
    (cwd, progressCallback) =>
      DockerCompose.pullAll({
        cwd,
        log: true,
        callback: wrapProgressCallback(progressCallback),
      }),
    "pulling-images"
  );
}

export async function restartStack(stack_id: number): Promise<void> {
  await runStackCommand(
    stack_id,
    (cwd, progressCallback) =>
      DockerCompose.restartAll({
        cwd,
        log: true,
        callback: wrapProgressCallback(progressCallback),
      }),
    "restarting"
  );
}

export async function removeStack(stack_id: number): Promise<void> {
  try {
    const _ = dbFunctions.deleteStack(stack_id);

    await runStackCommand(
      stack_id,
      async (cwd, progressCallback) => {
        await DockerCompose.down({
          cwd,
          log: true,
          callback: wrapProgressCallback(progressCallback),
        });
      },
      "removing"
    );

    const stackName = await getStackName(stack_id);
    const stackPath = await getStackPath({
      id: stack_id,
      name: stackName,
    } as Stack);

    try {
      await rm(stackPath, { recursive: true });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error(errorMsg);
      postToClient({
        type: "stack-error",
        data: {
          stack_id,
          action: "removing",
          message: errorMsg,
          timestamp: new Date().toISOString(),
        },
      });
      throw new Error(errorMsg);
    }

    postToClient({
      type: "stack-removed",
      data: {
        stack_id,
        message: "Stack removed successfully",
      },
    });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(errorMsg);
    postToClient({
      type: "stack-error",
      data: {
        stack_id,
        action: "removing",
        message: errorMsg,
        timestamp: new Date().toISOString(),
      },
    });
    throw new Error(errorMsg);
  }
}

export { getStackStatus, getAllStacksStatus } from "./operations/stackStatus";
