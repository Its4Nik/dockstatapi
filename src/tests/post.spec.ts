import { describe, it } from "bun:test";
import { runTestResponse, runTestCode } from "./helper";
import { DockerHost } from "~/typings/docker";

describe("DockStatAPI (POST)", () => {
  it("Check Host adding", async () => {
    const body = {
      name: "test",
      hostadress: "localhost:2375",
      secure: false,
    };

    await runTestCode("/docker-config/add-host", 200, "POST", body);
    await runTestCode("/docker-config/hosts", 200, "GET");
  });

  it("Check Host Updating", async () => {
    const codeBody: DockerHost = {
      id: 2,
      name: "test",
      hostadress: "127.0.0.1:2375",
      secure: false,
    };

    await runTestCode("/docker-config/update-host", 200, "POST", codeBody);

    const responseBody: DockerHost[] = [
      { id: 2, name: "test", hostadress: "127.0.0.1:2375", secure: 0 },
      {
        id: 1,
        name: "Localhost",
        hostadress: "localhost:2375",
        secure: 0,
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
