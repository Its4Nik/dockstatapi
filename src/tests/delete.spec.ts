import { describe, it } from "bun:test";
import { runTestCode } from "./helper";

describe("DockStatAPI (DELETE)", () => {
  it("Delete all Logs /logs", async () => {
    await runTestCode("/logs", 200, "DELETE", {});
  });

  it("Delete Logs (Debug) /logs/debug", async () => {
    await runTestCode("/logs/debug", 200, "DELETE", {});
  });
});
