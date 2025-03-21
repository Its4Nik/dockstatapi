import { describe, it } from "bun:test";
import { runTestResponse, runTestCode } from "./helper";
import { dbFunctions } from "~/core/database/repository";
import { API_KEY } from "./helper";

describe("DockStatAPI (POST)", () => {
  it("Check Host adding", async () => {
    const body: string =
      '{"name":"test","url":"localhost:2375","secure":false}';

    await runTestCode("/docker-config/add-host", 200, "POST", body);
    await runTestResponse(
      "/docker-config/hosts",
      '[{"name":"test","url":"localhost:2375","secure":0},{"name":"Localhost","url":"localhost:2375","secure":0}]',
      "GET",
    );
  });

  it("Check Host Updating", async () => {
    const body: string =
      '{"name":"test","url":"127.0.0.1:2375","secure":false}';

    await runTestCode("/docker-config/update-host", 200, "POST", body);
    await runTestResponse(
      "/docker-config/hosts",
      '[{"name":"test","url":"127.0.0.1:2375","secure":0},{"name":"Localhost","url":"localhost:2375","secure":0}]',
      "GET",
    );
  });

  it("Check Config update", async () => {
    const body = `{"fetching_interval":"1","keep_data_for":"1","api_key":${API_KEY}}`;
    await runTestCode(
      "/config/update",
      200,
      "POST",
      '{"fetching_interval":"1","keep_data_for":"1","api_key":"123"}',
    );
  });
});
