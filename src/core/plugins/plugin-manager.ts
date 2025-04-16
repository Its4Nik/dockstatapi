import { EventEmitter } from "node:events";
import type { ContainerInfo } from "~/typings/docker";
import type { Plugin } from "~/typings/plugin";
import { logger } from "../utils/logger";

class PluginManager extends EventEmitter {
	private plugins: Map<string, Plugin> = new Map();

	register(plugin: Plugin) {
		try {
			this.plugins.set(plugin.name, plugin);
			logger.debug(`Registered plugin: ${plugin.name}`);
		} catch (error) {
			logger.error(
				`Registering plugin ${plugin.name} failed: ${error as string}`,
			);
		}
	}

	unregister(name: string) {
		this.plugins.delete(name);
	}

	getLoadedPlugins(): string[] {
		return Array.from(this.plugins.keys());
	}

	// Trigger plugin flows:
	handleContainerStop(containerInfo: ContainerInfo) {
		for (const [, plugin] of this.plugins) {
			plugin.onContainerStop?.(containerInfo);
		}
	}

	handleContainerStart(containerInfo: ContainerInfo) {
		for (const [, plugin] of this.plugins) {
			plugin.onContainerStart?.(containerInfo);
		}
	}

	handleContainerExit(containerInfo: ContainerInfo) {
		for (const [, plugin] of this.plugins) {
			plugin.onContainerExit?.(containerInfo);
		}
	}

	handleContainerCreate(containerInfo: ContainerInfo) {
		for (const [, plugin] of this.plugins) {
			plugin.onContainerCreate?.(containerInfo);
		}
	}

	handleContainerDestroy(containerInfo: ContainerInfo) {
		for (const [, plugin] of this.plugins) {
			plugin.onContainerDestroy?.(containerInfo);
		}
	}

	handleContainerPause(containerInfo: ContainerInfo) {
		for (const [, plugin] of this.plugins) {
			plugin.onContainerPause?.(containerInfo);
		}
	}

	handleContainerUnpause(containerInfo: ContainerInfo) {
		for (const [, plugin] of this.plugins) {
			plugin.onContainerUnpause?.(containerInfo);
		}
	}

	handleContainerRestart(containerInfo: ContainerInfo) {
		for (const [, plugin] of this.plugins) {
			plugin.onContainerRestart?.(containerInfo);
		}
	}

	handleContainerUpdate(containerInfo: ContainerInfo) {
		for (const [, plugin] of this.plugins) {
			plugin.onContainerUpdate?.(containerInfo);
		}
	}

	handleContainerRename(containerInfo: ContainerInfo) {
		for (const [, plugin] of this.plugins) {
			plugin.onContainerRename?.(containerInfo);
		}
	}

	handleContainerHealthStatus(containerInfo: ContainerInfo) {
		for (const [, plugin] of this.plugins) {
			plugin.onContainerHealthStatus?.(containerInfo);
		}
	}

	handleHostUnreachable(host: string, err: string) {
		for (const [, plugin] of this.plugins) {
			plugin.onHostUnreachable?.(host, err);
		}
	}

	handleHostReachableAgain(host: string) {
		for (const [, plugin] of this.plugins) {
			plugin.onHostReachableAgain?.(host);
		}
	}

	handleContainerKill(containerInfo: ContainerInfo) {
		for (const [, plugin] of this.plugins) {
			plugin.onContainerKill?.(containerInfo);
		}
	}

	handleContainerDie(containerInfo: ContainerInfo) {
		for (const [, plugin] of this.plugins) {
			plugin.handleContainerDie?.(containerInfo);
		}
	}
}

export const pluginManager = new PluginManager();
