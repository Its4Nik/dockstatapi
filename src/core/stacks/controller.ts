import { dbFunctions } from "~/core/database";
import YAML from "yaml";
import { logger } from "~/core/utils/logger";
import DockerCompose from "docker-compose";
import type { Stack, ComposeSpec } from "~/typings/docker-compose";
import type { stacks_config } from "~/typings/database";
import { rm } from "node:fs/promises";
import { findObjectByKey } from "../utils/helpers";
import { postToClient } from "~/routes/live-stacks";

const wrapProgressCallback = (progressCallback?: (log: string) => void) => {
  return progressCallback
    ? (chunk: Buffer, streamSource?: "stdout" | "stderr") => {
        const log = chunk.toString();
        progressCallback(log);
      }
    : undefined;
};

async function getStackName(stack_id: number): Promise<string> {
  logger.debug(`Fetching stack name for id ${stack_id}`);
  const stacks = dbFunctions.getStacks();
  const stack = findObjectByKey(stacks, "id", stack_id);
  if (!stack) {
    throw new Error(`Stack with id ${stack_id} not found`);
  }
  return stack.name;
}

async function runStackCommand<T>(
  stack_id: number,
  command: (
    cwd: string,
    progressCallback?: (log: string) => void
  ) => Promise<T>,
  action: string
): Promise<T> {
  try {
    const stackName = await getStackName(stack_id);
    const stackPath = await getStackPath({
      id: stack_id,
      name: stackName,
    } as Stack);

    const progressCallback = (log: string) => {
      postToClient({
        type: "stack-progress",
        data: {
          stack_id,
          action,
          message: log.trim(),
          timestamp: new Date().toISOString(),
        },
      });
    };

    return await command(stackPath, progressCallback);
  } catch (error: any) {
    postToClient({
      type: "stack-error",
      data: {
        stack_id,
        action,
        message: error.message || String(error),
        timestamp: new Date().toISOString(),
      },
    });
    throw new Error(
      `Error while ${action} stack "${stack_id}": ${error.message || error}`
    );
  }
}

async function getStackPath(stack: Stack): Promise<string> {
  const stackName = stack.name.trim().replace(/\s+/g, "_");
  return `stacks/${stackName}`;
}

async function createStackYAML(compose_spec: Stack): Promise<void> {
  const yaml = YAML.stringify(compose_spec.compose_spec);
  const stackPath = await getStackPath(compose_spec);
  await Bun.write(`${stackPath}/docker-compose.yaml`, yaml, {
    createPath: true,
  });
}

export async function deployStack(
  stack: ComposeSpec,
  name: string,
  version: number,
  source: string,
  automatic_reboot_on_error: boolean,
  isCustom: boolean,
  image_updates: boolean,
  stack_prefix?: string
): Promise<void> {
  let stackId: number;

  try {
    logger.debug(`Deploying Stack: ${JSON.stringify(stack)}`);
    const serviceCount = stack.services
      ? Object.keys(stack.services).length
      : 0;
    const resolvedPrefix = stack_prefix ?? "";

    const stack_config: stacks_config = {
      id: 0,
      name,
      version,
      source,
      stack_prefix: resolvedPrefix,
      automatic_reboot_on_error,
      container_count: serviceCount,
      custom: isCustom,
      image_updates,
    };

    if (!name) {
      throw new Error("Stack name needed");
    }

    stackId = dbFunctions.addStack(stack_config) as number;
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
      name,
      source,
      version,
      compose_spec: stack,
    };

    await createStackYAML(stackYaml);

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
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(errorMsg);
    postToClient({
      type: "stack-error",
      data: {
        stack_id: 0,
        action: "deploying",
        message: errorMsg,
        timestamp: new Date().toISOString(),
      },
    });
    throw new Error(errorMsg);
  }
}

export async function stopStack(stack_id: number): Promise<void> {
  // Note the await to discard the result (convert to void)
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

export async function getStackStatus(
  stack_id: number
): Promise<Record<string, any>> {
  // Wrap the returned status value to match Promise<void> if that is the expectation.
  // In this case, if you need the status, you might adjust the type signature.
  const status = await runStackCommand(
    stack_id,
    async (cwd) => {
      const rawStatus = await DockerCompose.ps({ cwd });
      return rawStatus.data.services.reduce((acc: any, service: any) => {
        acc[service.name] = service.state;
        return acc;
      }, {});
    },
    "status-check"
  );
  return status;
}

export async function removeStack(stack_id: number): Promise<void> {
  try {
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
    } catch (error: any) {
      if (error.code !== "ENOENT") throw error;
    }

    dbFunctions.deleteStack(stack_id);
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

export async function getAllStacksStatus(): Promise<Record<string, any>> {
  try {
    const stacks = dbFunctions.getStacks();

    const statusResults = await Promise.all(
      stacks.map(async (stack) => {
        const status = await runStackCommand(
          stack.id as number,
          async (cwd) => {
            const rawStatus = await DockerCompose.ps({ cwd });
            return rawStatus.data.services.reduce((acc: any, service: any) => {
              acc[service.name] = service.state;
              return acc;
            }, {});
          },
          "status-check"
        );
        return { stackId: stack.id, status };
      })
    );

    return statusResults.reduce((acc, { stackId, status }) => {
      // Ensure stackId is used as a string if necessary, e.g.
      acc[String(stackId)] = status;
      return acc;
    }, {} as Record<string, any>);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }
}
