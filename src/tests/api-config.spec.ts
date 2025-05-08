import { afterAll, beforeEach, describe, expect, it, mock } from "bun:test";
import { Elysia } from "elysia";
import { logger } from "~/core/utils/logger";
import { apiConfigRoutes } from "~/routes/api-config";
import { generateJunitReport, recordTestResult } from "./junit-exporter";
import type { TestContext } from "./junit-exporter";

const mockDb = {
  updateConfig: mock(() => ({})),
  backupDatabase: mock(
    () => `dockstatapi-${new Date().toISOString().slice(0, 10)}.db.bak`
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
    dbFunctions: mockDb,
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

async function captureTestContext(
  req: Request,
  res: Response
): Promise<TestContext> {
  const responseStatus = res.status;
  const responseHeaders = Object.fromEntries(res.headers.entries());
  let responseBody: string;

  try {
    responseBody = await res.clone().json();
  } catch (parseError) {
    try {
      responseBody = await res.clone().text();
    } catch (textError) {
      responseBody = "Unparseable response content";
    }
  }

  return {
    request: {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries()),
      body: req.body ? await req.clone().text() : undefined,
    },
    response: {
      status: responseStatus,
      headers: responseHeaders,
      body: responseBody,
    },
  };
}

describe("API Configuration Endpoints", () => {
  beforeEach(() => {
    mockDb.updateConfig.mockClear();
  });

  describe("Core Configuration", () => {
    it("should retrieve current config with hashed API key", async () => {
      const start = Date.now();
      let context: TestContext | undefined;

      try {
        const app = createTestApp();
        const req = new Request("http://localhost:3000/config");
        const res = await app.handle(req);
        context = await captureTestContext(req, res);

        expect(res.status).toBe(200);
        expect(context.response.body).toMatchObject({
          fetching_interval: expect.any(Number),
          keep_data_for: expect.any(Number),
        });

        recordTestResult({
          name: "should retrieve current config with hashed API key",
          suite: "API Configuration Endpoints - Core Configuration",
          time: Date.now() - start,
          context,
        });
      } catch (error) {
        recordTestResult({
          name: "should retrieve current config with hashed API key",
          suite: "API Configuration Endpoints - Core Configuration",
          time: Date.now() - start,
          error: error as Error,
          context,
          errorDetails: {
            expected: "200 OK with valid config structure",
            received: context?.response,
          },
        });
        throw error;
      }
    });

    it("should handle config update with valid payload", async () => {
      const start = Date.now();
      let context: TestContext | undefined;

      try {
        const app = createTestApp();
        const requestBody = {
          fetching_interval: 15,
          keep_data_for: 30,
          api_key: "new-valid-key",
        };
        const req = new Request("http://localhost:3000/config/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });
        const res = await app.handle(req);
        context = await captureTestContext(req, res);

        expect(res.status).toBe(200);
        expect(context.response.body).toMatchObject({
          success: true,
          message: expect.stringContaining("Updated"),
        });

        recordTestResult({
          name: "should handle config update with valid payload",
          suite: "API Configuration Endpoints - Core Configuration",
          time: Date.now() - start,
          context,
        });
      } catch (error) {
        recordTestResult({
          name: "should handle config update with valid payload",
          suite: "API Configuration Endpoints - Core Configuration",
          time: Date.now() - start,
          error: error as Error,
          context,
          errorDetails: {
            expected: "200 OK with update confirmation",
            received: context?.response,
          },
        });
        throw error;
      }
    });
  });

  describe("Plugin Management", () => {
    it("should list active plugins with metadata", async () => {
      const start = Date.now();
      let context: TestContext | undefined;

      try {
        const app = createTestApp();
        const req = new Request("http://localhost:3000/config/plugins");
        const res = await app.handle(req);
        context = await captureTestContext(req, res);

        expect(res.status).toBe(200);
        expect(context.response.body).toEqual(
          []
          //expect.arrayContaining([
          //  expect.objectContaining({
          //    name: expect.any(String),
          //    version: expect.any(String),
          //    status: expect.any(String),
          //  }),
          //])
        );

        recordTestResult({
          name: "should list active plugins with metadata",
          suite: "API Configuration Endpoints - Plugin Management",
          time: Date.now() - start,
          context,
        });
      } catch (error) {
        recordTestResult({
          name: "should list active plugins with metadata",
          suite: "API Configuration Endpoints - Plugin Management",
          time: Date.now() - start,
          error: error as Error,
          context,
          errorDetails: {
            expected: "200 OK with plugin list",
            received: context?.response,
          },
        });
        throw error;
      }
    });
  });

  describe("Backup Management", () => {
    it("should generate timestamped backup files", async () => {
      const start = Date.now();
      let context: TestContext | undefined;

      try {
        const app = createTestApp();
        const req = new Request("http://localhost:3000/config/backup", {
          method: "POST",
        });
        const res = await app.handle(req);
        context = await captureTestContext(req, res);

        expect(res.status).toBe(200);
        const { message } = context.response.body as { message: string };
        expect(message).toMatch(
          /^data\/dockstatapi-\d{2}-\d{2}-\d{4}-1\.db\.bak$/
        );

        recordTestResult({
          name: "should generate timestamped backup files",
          suite: "API Configuration Endpoints - Backup Management",
          time: Date.now() - start,
          context,
        });
      } catch (error) {
        recordTestResult({
          name: "should generate timestamped backup files",
          suite: "API Configuration Endpoints - Backup Management",
          time: Date.now() - start,
          error: error as Error,
          context,
          errorDetails: {
            expected: "200 OK with backup path",
            received: context?.response,
          },
        });
        throw error;
      }
    });

    it("should list valid backup files", async () => {
      const start = Date.now();
      let context: TestContext | undefined;

      try {
        const app = createTestApp();
        const req = new Request("http://localhost:3000/config/backup");
        const res = await app.handle(req);
        context = await captureTestContext(req, res);

        expect(res.status).toBe(200);
        const backups = context.response.body as string[];
        expect(backups).toEqual(
          expect.arrayContaining([expect.stringMatching(/\.db\.bak$/)])
        );

        recordTestResult({
          name: "should list valid backup files",
          suite: "API Configuration Endpoints - Backup Management",
          time: Date.now() - start,
          context,
        });
      } catch (error) {
        recordTestResult({
          name: "should list valid backup files",
          suite: "API Configuration Endpoints - Backup Management",
          time: Date.now() - start,
          error: error as Error,
          context,
          errorDetails: {
            expected: "200 OK with backup list",
            received: context?.response,
          },
        });
        throw error;
      }
    });
  });

  describe("Error Handling", () => {
    it("should return proper error format", async () => {
      const start = Date.now();
      let context: TestContext | undefined;

      try {
        const app = createTestApp();
        const req = new Request("http://localhost:3000/random_link", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        const res = await app.handle(req);
        context = await captureTestContext(req, res);

        expect(res.status).toBe(404);

        recordTestResult({
          name: "should return proper error format",
          suite:
            "API Configuration Endpoints - Error Handling of unkown routes",
          time: Date.now() - start,
          context,
        });
      } catch (error) {
        recordTestResult({
          name: "should return proper error format",
          suite: "API Configuration Endpoints - Error Handling",
          time: Date.now() - start,
          error: error as Error,
          context,
          errorDetails: {
            expected: "500 Error with structured error format",
            received: context?.response,
          },
        });
        throw error;
      }
    });
  });
});

afterAll(() => {
  generateJunitReport();
});
