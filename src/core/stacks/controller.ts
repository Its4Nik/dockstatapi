import { dbFunctions } from "../database/repository";
import YAML from "yaml";
import { logger } from "../utils/logger";
import DockerCompose from "docker-compose";
import type { Stack, ComposeSpec } from "~/typings/docker-compose";
import type { stacks_config } from "~/typings/database";

async function runStackCommand<T>(
  stack_id: number,
  command: (cwd: string) => Promise<T>,
  action: string,
): Promise<T> {
  try {
    const stack = { id: stack_id };
    const stackPath = await getStackPath(stack as Stack);
    return await command(stackPath);
  } catch (error: any) {
    throw new Error(
      `Error while ${action} stack "${stack_id}": ${error.message || error}`,
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
  stack_prefix?: string,
): Promise<void> {
  try {
    logger.debug(`Deploying Stack: ${JSON.stringify(stack)}`);

    const serviceCount = stack.services
      ? Object.keys(stack.services).length
      : 0;

    const resolvedPrefix = stack_prefix ?? "";

    const stack_config: stacks_config = {
      id: 0,
      name: name,
      version: version,
      source,
      stack_prefix: resolvedPrefix,
      automatic_reboot_on_error,
      container_count: serviceCount,
      custom: isCustom,
      image_updates,
    };

    if (!stack.name) {
      logger.debug(`${JSON.stringify(stack)}`);
      throw new Error("Stack name needed");
    }

    dbFunctions.addStack(stack_config);

    const stackYaml: Stack = {
      name: name,
      source: source,
      version: version,
      compose_spec: stack,
    };
    await createStackYAML(stackYaml);
    const stackPath = await getStackPath(stackYaml);
    await DockerCompose.upAll({ cwd: stackPath });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }
}

export async function stopStack(stack_id: number): Promise<void> {
  try {
    await runStackCommand(
      stack_id,
      (cwd) => DockerCompose.downAll({ cwd }),
      "stopping",
    );
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }
}

export async function startStack(stack_id: number): Promise<void> {
  try {
    await runStackCommand(
      stack_id,
      (cwd) => DockerCompose.upAll({ cwd }),
      "starting",
    );
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }
}

export async function pullStackImages(stack_id: number): Promise<void> {
  try {
    await runStackCommand(
      stack_id,
      (cwd) => DockerCompose.pullAll({ cwd }),
      "pulling images for",
    );
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }
}

export async function restartStack(stack_id: number): Promise<void> {
  try {
    await runStackCommand(
      stack_id,
      (cwd) => DockerCompose.restartAll({ cwd }),
      "restarting",
    );
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }
}

export async function getStackStatus(stack_id: number): Promise<void> {
  try {
    return await runStackCommand(
      stack_id,
      async (cwd) => {
        const rawStatus = await DockerCompose.ps({ cwd });
        return rawStatus.data.services.reduce((acc: any, service: any) => {
          acc[service.name] = service.state;
          return acc;
        }, {});
      },
      "retrieving status for",
    );
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }
}

export async function removeStack(stack_id: number): Promise<void> {
  try {
    await runStackCommand(
      stack_id,
      async (cwd) => {
        await DockerCompose.down({ cwd });
      },
      "removing",
    );

    dbFunctions.deleteStack(stack_id);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }
}

export async function getAllStacksStatus(): Promise<Record<string, any>> {
  try {
    const stacks = dbFunctions.getStacks() as stacks_config[];

    const statusResults = await Promise.all(
      stacks.map(async (stack) => {
        const status = await runStackCommand(
          stack.id,
          async (cwd) => {
            const rawStatus = await DockerCompose.ps({ cwd });
            return rawStatus.data.services.reduce((acc: any, service: any) => {
              acc[service.name] = service.state;
              return acc;
            }, {});
          },
          "retrieving status for",
        );
        return { stackName: stack.name, status };
      }),
    );

    return statusResults.reduce(
      (acc, { stackName, status }) => {
        acc[stackName] = status;
        return acc;
      },
      {} as Record<string, any>,
    );
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error(errorMsg);
    throw new Error(errorMsg);
  }
}
