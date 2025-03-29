import { Database } from "bun:sqlite";

export const db = new Database("dockstatapi.db", { strict: true });
db.exec("PRAGMA journal_mode = WAL;");

export function init() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS backend_log_entries (
      timestamp STRING NOT NULL,
      level TEXT NOT NULL,
      message TEXT NOT NULL,
      file TEXT NOT NULL,
      line NUMBER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS stacks_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
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
      hostAddress TEXT NOT NULL,
      secure BOOLEAN NOT NULL
    );

    CREATE TABLE IF NOT EXISTS host_stats (
      hostId INTEGER PRIMARY KEY NOT NULL,
      hostName TEXT NOT NULL,
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

  const configRow = db
    .prepare(`SELECT COUNT(*) AS count FROM config`)
    .get() as { count: number };

  if (configRow.count === 0) {
    db.prepare(
      `INSERT INTO config (keep_data_for, fetching_interval, api_key) VALUES (7, 5, "changeme")`,
    ).run();
  }

  const hostRow = db
    .prepare(`SELECT COUNT(*) AS count FROM docker_hosts`)
    .get() as { count: number };

  if (hostRow.count === 0) {
    db.prepare(
      `INSERT INTO docker_hosts (name, hostAddress, secure) VALUES (?, ?, ?)`,
    ).run("Localhost", "localhost:2375", false);
  }
}

init();
