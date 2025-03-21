import { executeDbOperation } from "./helper";
import Database from "bun:sqlite";
import { logger } from "~/core/utils/logger";
import type { DockerHost, HostStats } from "~/typings/docker";
import type { config, stacks_config } from "~/typings/database";

const db = new Database("dockstatapi.db", { strict: true });
db.exec("PRAGMA journal_mode = WAL;");

export const dbFunctions = {
  init() {
    const startTime = Date.now();
    db.exec(`
      CREATE TABLE IF NOT EXISTS backend_log_entries (
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        level TEXT NOT NULL,
        message TEXT NOT NULL,
        file TEXT NOT NULL,
        line NUMBER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS stacks_config (
        name TEXT PRIMARY KEY NOT NULL,
        version INTEGER NOT NULL,
        custom BOOLEAN NOT NULL,
        source TEXT NOT NULL,
        container_count INTEGER NOT NULL,
        stack_prefix TEXT NOT NULL,
        automatic_reboot_on_error BOOLEAN NOT NULL,
        image_updates BOOLEAN NOT NULL
      );

      CREATE TABLE IF NOT EXISTS docker_hosts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        hostadress TEXT NOT NULL,
        secure BOOLEAN NOT NULL
      );

      CREATE TABLE IF NOT EXISTS host_stats (
          hostId TEXT PRIMARY KEY NOT NULL,
          dockerVersion TEXT NOT NULL,
          apiVersion TEXT NOT NULL,
          os TEXT NOT NULL,
          architecture TEXT NOT NULL,
          totalMemory INTEGER NOT NULL,
          totalCPU INTEGER NOT NULL,
          labels TEXT NOT NULL,
          containers INTEGER NOT NULL,
          containersRunning INTEGER NOT NULL,
          containersStopped INTEGER NOT NULL,
          containersPaused INTEGER NOT NULL,
          images INTEGER NOT NULL
        );

      CREATE TABLE IF NOT EXISTS container_stats (
        id TEXT NOT NULL,
        hostId TEXT NOT NULL,
        name TEXT NOT NULL,
        image TEXT NOT NULL,
        status TEXT NOT NULL,
        state TEXT NOT NULL,
        cpu_usage FLOAT NOT NULL,
        memory_usage FLOAT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS config (
        keep_data_for NUMBER NOT NULL,
        fetching_interval NUMBER NOT NULL,
        api_key TEXT NOT NULL
      );
    `);

    logger.info("Starting server...");

    /*
     * Default values:
     * - Data retention value for the database (logs and container stats) 7 days
     * - Data fetcher for the Database: 5 minutes
     * - api_key: changeme
     */
    const configRow = db
      .prepare(`SELECT COUNT(*) AS count FROM config`)
      .get() as { count: number };
    if (configRow.count === 0) {
      logger.debug("Initializing default config");
      const stmt = db.prepare(
        `
        INSERT INTO config (keep_data_for, fetching_interval, api_key) VALUES (7, 5, "changeme")
        `
      );
      stmt.run();
    }

    const hostRow = db
      .prepare(`SELECT COUNT(*) AS count FROM docker_hosts`)
      .get("Localhost") as { count: number };
    if (hostRow.count === 0) {
      logger.debug("Initializing default docker host (Localhost)");
      const stmt = db.prepare(
        `
        INSERT INTO docker_hosts (name, hostadress, secure) VALUES (?, ?, ?)
        `
      );
      stmt.run("Localhost", "localhost:2375", false);
    }
    logger.debug("__task__ __db__ Initializing Database ⏳");
    const duration = Date.now() - startTime;
    logger.debug(`__task__ __db__ Initializing Database ✔️  (${duration}ms)`);
  },

  addDockerHost(host: DockerHost) {
    return executeDbOperation(
      "Add Docker Host",
      () => {
        const stmt = db.prepare(`
          INSERT INTO docker_hosts (name, hostadress, secure)
          VALUES (?, ?, ?)
        `);
        return stmt.run(host.name, host.hostadress, host.secure);
      },
      () => {
        if (host.name.length < 1) {
          logger.error("Hostname needed");
          throw new Error("Invalid data provided - Hostname needed");
        }

        if (host.hostadress.length < 1) {
          logger.error("Hostadress needed");
          throw new Error("Invalid data provided - Hostadress needed");
        }

        if (
          typeof host.name !== "string" ||
          typeof host.secure !== "boolean" ||
          typeof host.hostadress !== "string"
        ) {
          logger.error("Invalid parameter types for addDockerHost");
          throw new TypeError("Invalid parameter types for addDockerHost");
        }
      }
    );
  },

  getDockerHosts(): DockerHost[] {
    return executeDbOperation(
      "Get Docker Hosts",
      () => {
        const stmt = db.prepare(`
          SELECT id, name, hostadress, secure
          FROM docker_hosts
          ORDER BY id DESC
        `);
        return stmt.all() as DockerHost[];
      },
      () => {}
    );
  },

  addLogEntry: (
    level: string,
    message: string,
    file_name: string,
    line: number
  ) => {
    if (
      typeof level !== "string" ||
      typeof message !== "string" ||
      typeof file_name !== "string" ||
      typeof line !== "number"
    ) {
      logger.crit("Invalid parameter types for addLogEntry");
      throw new TypeError("Invalid parameter types for addLogEntry");
    }

    const stmt = db.prepare(`
        INSERT INTO backend_log_entries (level, message, file, line)
        VALUES (?, ?, ?, ?)
      `);
    return stmt.run(level, message, file_name, line);
  },

  getAllLogs() {
    return executeDbOperation(
      "Get All Logs",
      () => {
        const stmt = db.prepare(`
          SELECT timestamp, level, message, file, line
          FROM backend_log_entries
          ORDER BY timestamp DESC
        `);
        return stmt.all();
      },
      () => {}
    );
  },

  getLogsByLevel(level: string) {
    return executeDbOperation(
      "Get Logs By Level",
      () => {
        const stmt = db.prepare(`
          SELECT timestamp, level, message, file, line
          FROM backend_log_entries
          WHERE level = ?
          ORDER BY timestamp DESC
        `);
        return stmt.all(level);
      },
      () => {
        if (typeof level !== "string") {
          logger.error("Level parameter must be a string");
          throw new TypeError("Level parameter must be a string");
        }
      }
    );
  },

  updateDockerHost(host: DockerHost) {
    return executeDbOperation(
      "Update Docker Host",
      () => {
        const stmt = db.prepare(`
          UPDATE docker_hosts
          SET hostadress = ?, secure = ?, name = ?
          WHERE id = ?
        `);
        return stmt.run(
          host.hostadress,
          host.secure,
          host.name,
          String(host.id)
        );
      },
      () => {
        if (
          typeof host.name !== "string" ||
          typeof host.hostadress !== "string" ||
          typeof host.secure !== "boolean" ||
          typeof host.id !== "number"
        ) {
          logger.error("Invalid parameter types for updateDockerHost");
          throw new TypeError("Invalid parameter types for updateDockerHost");
        }
      }
    );
  },

  deleteDockerHost(id: number) {
    return executeDbOperation(
      "Delete Docker Host",
      () => {
        const stmt = db.prepare(`
          DELETE FROM docker_hosts
          WHERE id = ?
        `);
        return stmt.run(id);
      },
      () => {
        if (typeof id !== "number") {
          logger.error("Invalid parameter type for deleteDockerHost");
          throw new TypeError("Name parameter must be a string");
        }
      }
    );
  },

  clearAllLogs() {
    return executeDbOperation(
      "Clear All Logs",
      () => {
        const stmt = db.prepare(`
          DELETE FROM backend_log_entries
        `);
        return stmt.run();
      },
      () => {}
    );
  },

  clearLogsByLevel(level: string) {
    return executeDbOperation(
      "Clear Logs By Level",
      () => {
        const stmt = db.prepare(`
          DELETE FROM backend_log_entries
          WHERE level = ?
        `);
        return stmt.run(level);
      },
      () => {
        if (typeof level !== "string") {
          logger.error("Invalid parameter type for clearLogsByLevel");
          throw new TypeError("Level parameter must be a string");
        }
      }
    );
  },

  updateConfig(
    fetching_interval: number,
    keep_data_for: number,
    api_key: string
  ) {
    return executeDbOperation(
      "Update Config",
      () => {
        const stmt = db.prepare(`
          UPDATE config
          SET fetching_interval = ?,
              keep_data_for = ?,
              api_key = ?
        `);
        return stmt.run(fetching_interval, keep_data_for, api_key);
      },
      () => {
        if (
          typeof fetching_interval !== "number" ||
          typeof keep_data_for !== "number"
        ) {
          logger.error("Invalid parameter types for updateConfig");
          throw new TypeError("Invalid parameter types for updateConfig");
        }
      }
    );
  },

  getConfig() {
    return executeDbOperation(
      "Get Config",
      () => {
        const stmt = db.prepare(`
          SELECT keep_data_for, fetching_interval, api_key
          FROM config
        `);
        return stmt.all();
      },
      () => {}
    );
  },

  deleteOldData(days: number) {
    return executeDbOperation(
      "Delete Old Data",
      () => {
        const deleteContainerStmt = db.prepare(`
          DELETE FROM container_stats
          WHERE timestamp < datetime('now', '-' || ? || ' days')
        `);
        deleteContainerStmt.run(days);

        const deleteLogsStmt = db.prepare(`
          DELETE FROM backend_log_entries
          WHERE timestamp < datetime('now', '-' || ? || ' days')
        `);
        deleteLogsStmt.run(days);
      },
      () => {
        if (typeof days !== "number") {
          logger.error("Invalid parameter type for deleteOldData");
          throw new TypeError("Days parameter must be a number");
        }
      }
    );
  },

  addContainerStats(
    id: string,
    hostId: string,
    name: string,
    image: string,
    status: string,
    state: string,
    cpu_usage: number,
    memory_usage: number
  ) {
    return executeDbOperation(
      "Add Container Stats",
      () => {
        const stmt = db.prepare(`
          INSERT INTO container_stats (id, hostId, name, image, status, state, cpu_usage, memory_usage)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(
          id,
          hostId,
          name,
          image,
          status,
          state,
          cpu_usage,
          memory_usage
        );
      },
      () => {
        if (
          typeof id !== "string" ||
          typeof hostId !== "string" ||
          typeof name !== "string" ||
          typeof image !== "string" ||
          typeof status !== "string" ||
          typeof state !== "string" ||
          typeof cpu_usage !== "number" ||
          typeof memory_usage !== "number"
        ) {
          logger.error("Invalid parameter types for addContainerStats");
          throw new TypeError("Invalid parameter types for addContainerStats");
        }
      }
    );
  },

  updateHostStats(stats: HostStats) {
    return executeDbOperation(
      "Update Host Stats",
      () => {
        const labelsJson = JSON.stringify(stats.labels);
        const stmt = db.prepare(`
          INSERT INTO host_stats (
            hostId,
            dockerVersion,
            apiVersion,
            os,
            architecture,
            totalMemory,
            totalCPU,
            labels,
            containers,
            containersRunning,
            containersStopped,
            containersPaused,
            images
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(hostId) DO UPDATE SET
            dockerVersion = excluded.dockerVersion,
            apiVersion = excluded.apiVersion,
            os = excluded.os,
            architecture = excluded.architecture,
            totalMemory = excluded.totalMemory,
            totalCPU = excluded.totalCPU,
            labels = excluded.labels,
            containers = excluded.containers,
            containersRunning = excluded.containersRunning,
            containersStopped = excluded.containersStopped,
            containersPaused = excluded.containersPaused,
            images = excluded.images;
        `);
        return stmt.run(
          stats.hostId,
          stats.dockerVersion,
          stats.apiVersion,
          stats.os,
          stats.architecture,
          stats.totalMemory,
          stats.totalCPU,
          labelsJson,
          stats.containers,
          stats.containersRunning,
          stats.containersStopped,
          stats.containersPaused,
          stats.images
        );
      },
      () => {}
    );
  },

  addStack(stack_config: stacks_config) {
    return executeDbOperation(
      "Add Stack Config",
      () => {
        const stmt = db.prepare(`
          INSERT INTO stacks_config (
            name,
            version,
            custom,
            source,
            container_count,
            stack_prefix,
            automatic_reboot_on_error,
            image_updates
          )
          VALUES(?, ?, ?, ?, ?, ?, ?, ?)
        `);
        return stmt.run(
          stack_config.name,
          stack_config.version,
          stack_config.custom,
          stack_config.source,
          stack_config.container_count,
          stack_config.stack_prefix,
          stack_config.automatic_reboot_on_error,
          stack_config.image_updates
        );
      },
      () => {}
    );
  },

  getStacks() {
    return executeDbOperation(
      "Get Stacks",
      () => {
        const stmt = db.prepare(`
          SELECT name, version, custom, source, container_count, stack_prefix, automatic_reboot_on_error, image_updates
          FROM stacks_config
          ORDER BY name DESC
        `);
        return stmt.all();
      },
      () => {}
    );
  },

  deleteStack(name: string) {
    return executeDbOperation(
      "Delete Stack",
      () => {
        const stmt = db.prepare(`
          DELETE FROM stacks_config
          WHERE name = ?;
        `);
        return stmt.run(name);
      },
      () => {}
    );
  },

  updateStack(stack_config: stacks_config) {
    return executeDbOperation(
      "Update Stack",
      () => {
        const stmt = db.prepare(`
          UPDATE stacks_config
          SET
            version = ?,
            custom = ?,
            source = ?,
            container_count = ?,
            stack_prefix = ?,
            automatic_reboot_on_error = ?,
            image_updates = ?
          WHERE name = ?;
        `);
        return stmt.run(
          stack_config.version,
          stack_config.custom,
          stack_config.source,
          stack_config.container_count,
          stack_config.stack_prefix,
          stack_config.automatic_reboot_on_error,
          stack_config.image_updates,
          stack_config.name
        );
      },
      () => {}
    );
  },
};
