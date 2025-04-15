import { describe, it } from "bun:test";

import { runTestResponse, runTestCode } from "./helper";

import { DockerHost } from "~/typings/docker";

describe("DockStatAPI (POST)", () => {
  it("Check Host adding", async () => {
    const body = {
      name: "test",
      hostAddress: "localhost:2375",
      secure: false,
    };

    await runTestCode("/docker-config/add-host", 200, "POST", body);
    await runTestCode("/docker-config/hosts", 200, "GET");
  });

  it("Check Host Updating", async () => {
    const codeBody: DockerHost = {
      id: 2,
      name: "test",
      hostAddress: "127.0.0.1:2375",
      secure: false,
    };

    await runTestCode("/docker-config/update-host", 200, "POST", codeBody);

    const responseBody: DockerHost[] = [
      { id: 2, name: "test", hostAddress: "127.0.0.1:2375", secure: false },
      {
        id: 1,
        name: "Localhost",
        hostAddress: "localhost:2375",
        secure: false,
      },
    ];
    await runTestResponse(
      "/docker-config/hosts",
      JSON.stringify(responseBody),
      "GET"
    );
  });

  it("Check Config update", async () => {
    await runTestCode("/config/update", 200, "POST", {
      fetching_interval: 1,
      keep_data_for: 1,
      api_key: "TestKey",
    });
  });
});
