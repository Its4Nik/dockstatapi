import { pluginManager } from "./plugin-manager";
import path from "path";
import fs from "fs";
import { logger } from "../utils/logger";
import { checkFileForChangeMe } from "../utils/change-me-checker";

export async function loadPlugins(pluginDir: string) {
  const pluginPath = path.join(process.cwd(), pluginDir);

  logger.debug(`Loading plugins (${pluginPath})`);

  if (!fs.existsSync(pluginPath)) {
    throw new Error(`Failed to check plugin directory`);
  }
  logger.debug(`Plugin directory exists`);

  let pluginCount = 0;
  let files;
  try {
    files = fs.readdirSync(pluginPath);
    logger.debug(`Found ${files.length} files in plugin directory`);
  } catch (error) {
    throw new Error(`Failed to read plugin-directory: ${error}`);
  }

  if (!files) {
    logger.info(`No plugins found in ${pluginPath}`);
    return;
  }

  for (const file of files) {
    if (!file.endsWith(".plugin.ts")) {
      logger.debug(`Skipping non-plugin file: ${file}`);
      continue;
    }

    const absolutePath = path.join(pluginPath, file);
    logger.info(`Loading plugin: ${absolutePath}`);
    try {
      await checkFileForChangeMe(absolutePath);
      const module = await import(absolutePath);
      const plugin = module.default;
      pluginManager.register(plugin);
      pluginCount++;
    } catch (error) {
      logger.error(
        `Error while importing plugin ${absolutePath}: ${error as string}`,
      );
    }
  }

  logger.info(`Registered ${pluginCount} plugin(s)`);
}
