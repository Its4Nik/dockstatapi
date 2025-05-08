import { afterAll, beforeEach, describe, expect, it, mock } from "bun:test";
import { Elysia } from "elysia";
import { dbFunctions } from "~/core/database";
import { dockerRoutes } from "~/routes/docker-manager";
import {
	generateJunitReport,
	recordTestResult,
	testResults,
} from "./junit-exporter";

type DockerHost = {
	id?: number;
	name: string;
	hostAddress: string;
	secure: boolean;
};

mock.module("~/core/database", () => ({
	dbFunctions: {
		addDockerHost: mock(),
		updateDockerHost: mock(),
		getDockerHosts: mock(),
		deleteDockerHost: mock(),
	},
}));

// Silence logger
mock.module("~/core/utils/logger", () => ({
	logger: { debug: mock(), info: mock(), error: mock() },
}));

const createApp = () => new Elysia().use(dockerRoutes).decorate({});

describe("Docker Configuration Endpoints", () => {
	beforeEach(() => {
		// Clear mocks and testResults
		testResults.length = 0;
		Object.values(dbFunctions).forEach((fn) => fn.mockClear());
	});

	describe("POST /docker-config/add-host", () => {
		it("should add a docker host successfully", async () => {
			const start = Date.now();
			const host: DockerHost = {
				name: "Host1",
				hostAddress: "127.0.0.1:2375",
				secure: false,
			};
			try {
				const app = createApp();
				const res = await app.handle(
					new Request("http://localhost/docker-config/add-host", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(host),
					}),
				);
				expect(res.status).toBe(200);
				const data = await res.json();
				expect(data).toMatchObject({
					message: `Added docker host (${host.name})`,
				});
				expect(dbFunctions.addDockerHost).toHaveBeenCalledWith(host);
				recordTestResult({
					name: "add-host success",
					suite: "Docker Config - Add Host",
					time: Date.now() - start,
				});
			} catch (error) {
				recordTestResult({
					name: "add-host success",
					suite: "Docker Config - Add Host",
					time: Date.now() - start,
					error: error as Error,
				});
				throw error;
			}
		});

		it("should handle error when adding a docker host fails", async () => {
			const start = Date.now();
			const host: DockerHost = {
				name: "Host2",
				hostAddress: "invalid",
				secure: true,
			};
			dbFunctions.addDockerHost.mockImplementationOnce(() => {
				throw new Error("DB error");
			});
			try {
				const app = createApp();
				const res = await app.handle(
					new Request("http://localhost/docker-config/add-host", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(host),
					}),
				);
				expect(res.status).toBe(400);
				const data = await res.json();
				expect(data).toHaveProperty("error");
				recordTestResult({
					name: "add-host failure",
					suite: "Docker Config - Add Host",
					time: Date.now() - start,
				});
			} catch (error) {
				recordTestResult({
					name: "add-host failure",
					suite: "Docker Config - Add Host",
					time: Date.now() - start,
					error: error as Error,
				});
				throw error;
			}
		});
	});

	describe("POST /docker-config/update-host", () => {
		it("should update a docker host successfully", async () => {
			const start = Date.now();
			const host: DockerHost = {
				id: 1,
				name: "Host1-upd",
				hostAddress: "127.0.0.1:2376",
				secure: true,
			};
			try {
				const app = createApp();
				const res = await app.handle(
					new Request("http://localhost/docker-config/update-host", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(host),
					}),
				);
				expect(res.status).toBe(200);
				const data = await res.json();
				expect(data).toMatchObject({
					message: `Updated docker host (${host.id})`,
				});
				expect(dbFunctions.updateDockerHost).toHaveBeenCalledWith(host);
				recordTestResult({
					name: "update-host success",
					suite: "Docker Config - Update Host",
					time: Date.now() - start,
				});
			} catch (error) {
				recordTestResult({
					name: "update-host success",
					suite: "Docker Config - Update Host",
					time: Date.now() - start,
					error: error as Error,
				});
				throw error;
			}
		});

		it("should handle error when update fails", async () => {
			const start = Date.now();
			const host: DockerHost = {
				id: 2,
				name: "Host2",
				hostAddress: "x",
				secure: false,
			};
			dbFunctions.updateDockerHost.mockImplementationOnce(() => {
				throw new Error("Update error");
			});
			try {
				const app = createApp();
				const res = await app.handle(
					new Request("http://localhost/docker-config/update-host", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(host),
					}),
				);
				expect(res.status).toBe(400);
				const data = await res.json();
				expect(data).toHaveProperty("error");
				recordTestResult({
					name: "update-host failure",
					suite: "Docker Config - Update Host",
					time: Date.now() - start,
				});
			} catch (error) {
				recordTestResult({
					name: "update-host failure",
					suite: "Docker Config - Update Host",
					time: Date.now() - start,
					error: error as Error,
				});
				throw error;
			}
		});
	});

	describe("GET /docker-config/hosts", () => {
		it("should retrieve list of hosts", async () => {
			const start = Date.now();
			const hosts: DockerHost[] = [
				{ id: 1, name: "H1", hostAddress: "a", secure: false },
			];
			dbFunctions.getDockerHosts.mockReturnValueOnce(hosts);
			try {
				const app = createApp();
				const res = await app.handle(
					new Request("http://localhost/docker-config/hosts"),
				);
				expect(res.status).toBe(200);
				const data = await res.json();
				expect(data).toEqual(hosts);
				recordTestResult({
					name: "get-hosts success",
					suite: "Docker Config - List Hosts",
					time: Date.now() - start,
				});
			} catch (error) {
				recordTestResult({
					name: "get-hosts success",
					suite: "Docker Config - List Hosts",
					time: Date.now() - start,
					error: error as Error,
				});
				throw error;
			}
		});

		it("should handle error when retrieval fails", async () => {
			const start = Date.now();
			dbFunctions.getDockerHosts.mockImplementationOnce(() => {
				throw new Error("Fetch error");
			});
			try {
				const app = createApp();
				const res = await app.handle(
					new Request("http://localhost/docker-config/hosts"),
				);
				expect(res.status).toBe(400);
				const data = await res.json();
				expect(data).toHaveProperty("error");
				recordTestResult({
					name: "get-hosts failure",
					suite: "Docker Config - List Hosts",
					time: Date.now() - start,
				});
			} catch (error) {
				recordTestResult({
					name: "get-hosts failure",
					suite: "Docker Config - List Hosts",
					time: Date.now() - start,
					error: error as Error,
				});
				throw error;
			}
		});
	});

	describe("DELETE /docker-config/hosts/:id", () => {
		it("should delete a host successfully", async () => {
			const start = Date.now();
			const id = 5;
			try {
				const app = createApp();
				const res = await app.handle(
					new Request(`http://localhost/docker-config/hosts/${id}`, {
						method: "DELETE",
					}),
				);
				expect(res.status).toBe(200);
				const data = await res.json();
				expect(data).toMatchObject({ message: `Deleted docker host (${id})` });
				expect(dbFunctions.deleteDockerHost).toHaveBeenCalledWith(id);
				recordTestResult({
					name: "delete-host success",
					suite: "Docker Config - Delete Host",
					time: Date.now() - start,
				});
			} catch (error) {
				recordTestResult({
					name: "delete-host success",
					suite: "Docker Config - Delete Host",
					time: Date.now() - start,
					error: error as Error,
				});
				throw error;
			}
		});

		it("should handle error when delete fails", async () => {
			const start = Date.now();
			const id = 6;
			dbFunctions.deleteDockerHost.mockImplementationOnce(() => {
				throw new Error("Delete error");
			});
			try {
				const app = createApp();
				const res = await app.handle(
					new Request(`http://localhost/docker-config/hosts/${id}`, {
						method: "DELETE",
					}),
				);
				expect(res.status).toBe(400);
				const data = await res.json();
				expect(data).toHaveProperty("error");
				recordTestResult({
					name: "delete-host failure",
					suite: "Docker Config - Delete Host",
					time: Date.now() - start,
				});
			} catch (error) {
				recordTestResult({
					name: "delete-host failure",
					suite: "Docker Config - Delete Host",
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
