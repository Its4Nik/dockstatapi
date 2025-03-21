import { describe, it } from "bun:test";
import { runTestResponse, runTestCode } from "./helper";
import {
  version,
  authorEmail,
  authorName,
  authorWebsite,
  contributors,
  dependencies,
  description,
  devDependencies,
  license,
} from "~/core/utils/package-json";

describe("DockStatAPI (GET)", () => {
  it("Check Server connection", async () => {
    await runTestResponse("/health", '{"status":"healthy"}', "GET");
  });

  it("Check /docker/containers", async () => {
    await runTestCode("/docker/containers", 200, "GET");
  });

  it("Check /docker/hosts/Localhost", async () => {
    await runTestCode("/docker/hosts/Localhost", 200, "GET");
  });

  it("Check /docker-config/hosts", async () => {
    await runTestCode("/docker-config/hosts", 200, "GET");
  });

  it("Check /logs/", async () => {
    await runTestCode("/logs", 200, "GET");
  });

  it("Check /logs/debug", async () => {
    await runTestCode("/logs/debug", 200, "GET");
  });

  it("Check /config", async () => {
    await runTestCode("/config", 200, "GET");
  });

  it("Check /config/package", async () => {
    const expected = {
      version,
      description,
      license,
      authorName,
      authorEmail,
      authorWebsite,
      contributors,
      dependencies,
      devDependencies,
    };

    await runTestResponse("/config/package", JSON.stringify(expected), "GET");
  });
});
