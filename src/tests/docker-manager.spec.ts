import { afterAll, beforeEach, describe, expect, it, mock } from "bun:test";
import { Elysia } from "elysia";
import { dbFunctions } from "~/core/database";
import { dockerRoutes } from "~/routes/docker-manager";
import {
  generateJunitReport,
  recordTestResult,
  testResults,
} from "./junit-exporter";
import type { TestContext } from "./junit-exporter";

type DockerHost = {
  id?: number;
  name: string;
  hostAddress: string;
  secure: boolean;
};

const mockDb = {
  addDockerHost: mock(() => ({
    changes: 1,
    lastInsertRowid: 1,
  })),
  updateDockerHost: mock(() => ({
    changes: 1,
    lastInsertRowid: 1,
  })),
  getDockerHosts: mock(() => []),
  deleteDockerHost: mock(() => ({
    changes: 1,
    lastInsertRowid: 1,
  })),
};

mock.module("~/core/database", () => ({
  dbFunctions: mockDb,
}));

mock.module("~/core/utils/logger", () => ({
  logger: {
    debug: mock(),
    info: mock(),
    error: mock(),
  },
}));

const createApp = () => new Elysia().use(dockerRoutes).decorate({});

async function captureTestContext(
  req: Request,
  res: Response
): Promise<TestContext> {
  const responseStatus = res.status;
  const responseHeaders = Object.fromEntries(res.headers.entries());
  let responseBody: unknown;

  try {
    responseBody = await res.clone().json();
  } catch (parseError) {
    try {
      responseBody = await res.clone().text();
    } catch {
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

describe("Docker Configuration Endpoints", () => {
  beforeEach(() => {
    mockDb.addDockerHost.mockClear();
    mockDb.updateDockerHost.mockClear();
    mockDb.getDockerHosts.mockClear();
    mockDb.deleteDockerHost.mockClear();
  });

  describe("POST /docker-config/add-host", () => {
    it("should add a docker host successfully", async () => {
      const start = Date.now();
      let context: TestContext | undefined;
      const host: DockerHost = {
        name: "Host1",
        hostAddress: "127.0.0.1:2375",
        secure: false,
      };

      try {
        const app = createApp();
        const req = new Request("http://localhost/docker-config/add-host", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(host),
        });
        const res = await app.handle(req);
        context = await captureTestContext(req, res);

        expect(res.status).toBe(200);
        expect(context.response.body).toMatchObject({
          message: `Added docker host (${host.name})`,
        });
        expect(mockDb.addDockerHost).toHaveBeenCalledWith(host);

        recordTestResult({
          name: "add-host success",
          suite: "Docker Config - Add Host",
          time: Date.now() - start,
          context,
        });
      } catch (error) {
        recordTestResult({
          name: "add-host success",
          suite: "Docker Config - Add Host",
          time: Date.now() - start,
          error: error as Error,
          context,
          errorDetails: {
            expected: "200 OK with success message",
            received: context?.response,
          },
        });
        throw error;
      }
    });

    it("should handle error when adding a docker host fails", async () => {
      const start = Date.now();
      let context: TestContext | undefined;
      const host: DockerHost = {
        name: "Host2",
        hostAddress: "invalid",
        secure: true,
      };

      // Set mock implementation
      mockDb.addDockerHost.mockImplementationOnce(() => {
        throw new Error("DB error");
      });

      try {
        const app = createApp();
        const req = new Request("http://localhost/docker-config/add-host", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(host),
        });
        const res = await app.handle(req);
        context = await captureTestContext(req, res);

        expect(res.status).toBe(500);
        expect(context.response.body).toMatchObject({
          error: expect.any(String),
        });

        recordTestResult({
          name: "add-host failure",
          suite: "Docker Config - Add Host",
          time: Date.now() - start,
          context,
        });
      } catch (error) {
        recordTestResult({
          name: "add-host failure",
          suite: "Docker Config - Add Host",
          time: Date.now() - start,
          error: error as Error,
          context,
          errorDetails: {
            expected: "400 Error with error structure",
            received: context?.response,
          },
        });
        throw error;
      }
    });
  });

  describe("POST /docker-config/update-host", () => {
    it("should update a docker host successfully", async () => {
      const start = Date.now();
      let context: TestContext | undefined;
      const host: DockerHost = {
        id: 1,
        name: "Host1-upd",
        hostAddress: "127.0.0.1:2376",
        secure: true,
      };

      try {
        const app = createApp();
        const req = new Request("http://localhost/docker-config/update-host", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(host),
        });
        const res = await app.handle(req);
        context = await captureTestContext(req, res);

        expect(res.status).toBe(200);
        expect(context.response.body).toMatchObject({
          message: `Updated docker host (${host.id})`,
        });
        expect(mockDb.updateDockerHost).toHaveBeenCalledWith(host);

        recordTestResult({
          name: "update-host success",
          suite: "Docker Config - Update Host",
          time: Date.now() - start,
          context,
        });
      } catch (error) {
        recordTestResult({
          name: "update-host success",
          suite: "Docker Config - Update Host",
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

    it("should handle error when update fails", async () => {
      const start = Date.now();
      let context: TestContext | undefined;
      const host: DockerHost = {
        id: 2,
        name: "Host2",
        hostAddress: "x",
        secure: false,
      };

      mockDb.updateDockerHost.mockImplementationOnce(() => {
        throw new Error("Update error");
      });

      try {
        const app = createApp();
        const req = new Request("http://localhost/docker-config/update-host", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(host),
        });
        const res = await app.handle(req);
        context = await captureTestContext(req, res);

        expect(res.status).toBe(500);
        expect(context.response.body).toMatchObject({
          error: expect.any(String),
        });

        recordTestResult({
          name: "update-host failure",
          suite: "Docker Config - Update Host",
          time: Date.now() - start,
          context,
        });
      } catch (error) {
        recordTestResult({
          name: "update-host failure",
          suite: "Docker Config - Update Host",
          time: Date.now() - start,
          error: error as Error,
          context,
          errorDetails: {
            expected: "400 Error with error details",
            received: context?.response,
          },
        });
        throw error;
      }
    });
  });

  describe("GET /docker-config/hosts", () => {
    it("should retrieve list of hosts", async () => {
      const start = Date.now();
      let context: TestContext | undefined;
      const hosts: DockerHost[] = [
        { id: 1, name: "H1", hostAddress: "a", secure: false },
      ];

      mockDb.getDockerHosts.mockImplementation(() => hosts as never[]);

      try {
        const app = createApp();
        const req = new Request("http://localhost/docker-config/hosts");
        const res = await app.handle(req);
        context = await captureTestContext(req, res);

        expect(res.status).toBe(200);
        expect(context.response.body).toEqual(hosts);

        recordTestResult({
          name: "get-hosts success",
          suite: "Docker Config - List Hosts",
          time: Date.now() - start,
          context,
        });
      } catch (error) {
        recordTestResult({
          name: "get-hosts success",
          suite: "Docker Config - List Hosts",
          time: Date.now() - start,
          error: error as Error,
          context,
          errorDetails: {
            expected: "200 OK with hosts array",
            received: context?.response,
          },
        });
        throw error;
      }
    });

    it("should handle error when retrieval fails", async () => {
      const start = Date.now();
      let context: TestContext | undefined;

      mockDb.getDockerHosts.mockImplementationOnce(() => {
        throw new Error("Fetch error");
      });

      try {
        const app = createApp();
        const req = new Request("http://localhost/docker-config/hosts");
        const res = await app.handle(req);
        context = await captureTestContext(req, res);

        expect(res.status).toBe(500);
        expect(context.response.body).toMatchObject({
          error: expect.any(String),
        });

        recordTestResult({
          name: "get-hosts failure",
          suite: "Docker Config - List Hosts",
          time: Date.now() - start,
          context,
        });
      } catch (error) {
        recordTestResult({
          name: "get-hosts failure",
          suite: "Docker Config - List Hosts",
          time: Date.now() - start,
          error: error as Error,
          context,
          errorDetails: {
            expected: "400 Error with error details",
            received: context?.response,
          },
        });
        throw error;
      }
    });
  });

  describe("DELETE /docker-config/hosts/:id", () => {
    it("should delete a host successfully", async () => {
      const start = Date.now();
      let context: TestContext | undefined;
      const id = 5;

      try {
        const app = createApp();
        const req = new Request(`http://localhost/docker-config/hosts/${id}`, {
          method: "DELETE",
        });
        const res = await app.handle(req);
        context = await captureTestContext(req, res);

        expect(res.status).toBe(200);
        expect(context.response.body).toMatchObject({
          message: `Deleted docker host (${id})`,
        });
        expect(mockDb.deleteDockerHost).toHaveBeenCalledWith(id);

        recordTestResult({
          name: "delete-host success",
          suite: "Docker Config - Delete Host",
          time: Date.now() - start,
          context,
        });
      } catch (error) {
        recordTestResult({
          name: "delete-host success",
          suite: "Docker Config - Delete Host",
          time: Date.now() - start,
          error: error as Error,
          context,
          errorDetails: {
            expected: "200 OK with deletion confirmation",
            received: context?.response,
          },
        });
        throw error;
      }
    });

    it("should handle error when delete fails", async () => {
      const start = Date.now();
      let context: TestContext | undefined;
      const id = 6;

      mockDb.deleteDockerHost.mockImplementationOnce(() => {
        throw new Error("Delete error");
      });

      try {
        const app = createApp();
        const req = new Request(`http://localhost/docker-config/hosts/${id}`, {
          method: "DELETE",
        });
        const res = await app.handle(req);
        context = await captureTestContext(req, res);

        expect(res.status).toBe(500);
        expect(context.response.body).toMatchObject({
          error: expect.any(String),
        });

        recordTestResult({
          name: "delete-host failure",
          suite: "Docker Config - Delete Host",
          time: Date.now() - start,
          context,
        });
      } catch (error) {
        recordTestResult({
          name: "delete-host failure",
          suite: "Docker Config - Delete Host",
          time: Date.now() - start,
          error: error as Error,
          context,
          errorDetails: {
            expected: "400 Error with error details",
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
