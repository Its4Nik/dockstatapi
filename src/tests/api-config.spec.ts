import { afterAll, beforeEach, describe, expect, it, mock } from "bun:test";
import { Elysia } from "elysia";
import { logger } from "~/core/utils/logger";
import { apiConfigRoutes } from "~/routes/api-config";
import {
	generateJunitReport,
	recordTestResult,
	testResults,
} from "./junit-exporter";

const mockDb = {
	getConfig: mock(() => [
		{
			fetching_interval: 10,
			keep_data_for: 14,
			api_key: "$argon2id$v=19$m=65536,t=2,p=1$...",
		},
	]),
	updateConfig: mock(),
	backupDatabase: mock(
		() => `dockstatapi-${new Date().toISOString().slice(0, 10)}.db.bak`,
	),
	restoreDatabase: mock(),
	findLatestBackup: mock(() => "dockstatapi-2025-05-06.db.bak"),
};

mock.module("node:fs", () => ({
	existsSync: mock((path) => path.includes("dockstatapi")),
	readdirSync: mock(() => [
		"dockstatapi-2025-05-06.db.bak",
		"dockstatapi.db",
		"dockstatapi.db-shm",
	]),
	unlinkSync: mock(),
}));

const mockPlugins = [
	{
		name: "docker-monitor",
		version: "1.2.0",
		status: "active",
	},
];

const createTestApp = () =>
	new Elysia().use(apiConfigRoutes).decorate({
		db: mockDb,
		pluginManager: {
			getLoadedPlugins: mock(() => mockPlugins),
			getPlugin: mock((name) => mockPlugins.find((p) => p.name === name)),
		},
		logger: {
			...logger,
			debug: mock(),
			error: mock(),
			info: mock(),
		},
	});

describe("API Configuration Endpoints", () => {
	beforeEach(() => {
		mockDb.getConfig.mockClear();
		mockDb.updateConfig.mockClear();
	});

	describe("Core Configuration", () => {
		it("should retrieve current config with hashed API key", async () => {
			const start = Date.now();
			try {
				const app = createTestApp();
				const res = await app.handle(
					new Request("http://localhost:3000/config"),
				);

				expect(res.status).toBe(200);
				const data = await res.json();
				expect(data).toMatchObject({
					fetching_interval: expect.any(Number),
					keep_data_for: expect.any(Number),
				});

				recordTestResult({
					name: "should retrieve current config with hashed API key",
					suite: "API Configuration Endpoints - Core Configuration",
					time: Date.now() - start,
				});
			} catch (error) {
				recordTestResult({
					name: "should retrieve current config with hashed API key",
					suite: "API Configuration Endpoints - Core Configuration",
					time: Date.now() - start,
					error: error as Error,
				});
				throw error;
			}
		});

		it("should handle config update with valid payload", async () => {
			const start = Date.now();
			try {
				const app = createTestApp();
				const res = await app.handle(
					new Request("http://localhost:3000/config/update", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							fetching_interval: 15,
							keep_data_for: 30,
							api_key: "new-valid-key",
						}),
					}),
				);

				expect(res.status).toBe(200);
				expect(await res.json()).toMatchObject({
					success: true,
					message: expect.stringContaining("Updated"),
				});

				recordTestResult({
					name: "should handle config update with valid payload",
					suite: "API Configuration Endpoints - Core Configuration",
					time: Date.now() - start,
				});
			} catch (error) {
				recordTestResult({
					name: "should handle config update with valid payload",
					suite: "API Configuration Endpoints - Core Configuration",
					time: Date.now() - start,
					error: error as Error,
				});
				throw error;
			}
		});
	});

	describe("Plugin Management", () => {
		it("should list active plugins with metadata", async () => {
			const start = Date.now();
			try {
				const app = createTestApp();
				const res = await app.handle(
					new Request("http://localhost:3000/config/plugins"),
				);

				expect(res.status).toBe(200);
				expect(await res.json()).toEqual([]);
				recordTestResult({
					name: "should list active plugins with metadata",
					suite: "API Configuration Endpoints - Plugin Management",
					time: Date.now() - start,
				});
			} catch (error) {
				recordTestResult({
					name: "should list active plugins with metadata",
					suite: "API Configuration Endpoints - Plugin Management",
					time: Date.now() - start,
					error: error as Error,
				});
				throw error;
			}
		});
	});

	describe("Backup Management", () => {
		it("should generate timestamped backup files", async () => {
			const start = Date.now();
			try {
				const app = createTestApp();
				const res = await app.handle(
					new Request("http://localhost:3000/config/backup", {
						method: "POST",
					}),
				);

				expect(res.status).toBe(200);
				const { message } = await res.json();
				expect(message).toMatch(
					/^data\/dockstatapi-\d{2}-\d{2}-\d{4}-1\.db\.bak$/,
				);

				recordTestResult({
					name: "should generate timestamped backup files",
					suite: "API Configuration Endpoints - Backup Management",
					time: Date.now() - start,
				});
			} catch (error) {
				recordTestResult({
					name: "should generate timestamped backup files",
					suite: "API Configuration Endpoints - Backup Management",
					time: Date.now() - start,
					error: error as Error,
				});
				throw error;
			}
		});

		it("should list valid backup files", async () => {
			const start = Date.now();
			try {
				const app = createTestApp();
				const res = await app.handle(
					new Request("http://localhost:3000/config/backup"),
				);

				expect(res.status).toBe(200);
				const backups = await res.json();
				expect(backups).toEqual(
					expect.arrayContaining([expect.stringMatching(/\.db\.bak$/)]),
				);

				recordTestResult({
					name: "should list valid backup files",
					suite: "API Configuration Endpoints - Backup Management",
					time: Date.now() - start,
				});
			} catch (error) {
				recordTestResult({
					name: "should list valid backup files",
					suite: "API Configuration Endpoints - Backup Management",
					time: Date.now() - start,
					error: error as Error,
				});
				throw error;
			}
		});
	});

	describe("Error Handling", () => {
		it("should return proper error format", async () => {
			const start = Date.now();
			try {
				mockDb.getConfig.mockImplementationOnce(() => {
					throw new Error("Database connection failed");
				});

				const app = createTestApp();
				const res = await app.handle(
					new Request("http://localhost:3000/config"),
				);

				expect(res.status).toBe(200);
				const data = await res.json();
				expect(data).toMatchObject({
					api_key: expect.stringMatching(/^\$argon2id\$/),
					fetching_interval: 15,
					keep_data_for: 30,
				});

				recordTestResult({
					name: "should return proper error format",
					suite: "API Configuration Endpoints - Error Handling",
					time: Date.now() - start,
				});
			} catch (error) {
				recordTestResult({
					name: "should return proper error format",
					suite: "API Configuration Endpoints - Error Handling",
					time: Date.now() - start,
					error: error as Error,
				});
				throw error;
			}
		});
	});
});

afterAll(() => {
	generateJunitReport();
});
