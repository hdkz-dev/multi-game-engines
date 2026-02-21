import { describe, it, expect } from "vitest";
import { KingsRowAdapter } from "../KingsRowAdapter.js";
import { IEngineConfig } from "@multi-game-engines/core";

describe("KingsRowAdapter", () => {
  const mockConfig: IEngineConfig = {
    id: "kingsrow",
    adapter: "kingsrow",
    sources: {
      main: {
        url: "http://localhost/kingsrow.js",
        sri: "sha384-dummy",
        type: "worker-js",
      },
    },
  };

  it("should be instantiated", () => {
    const adapter = new KingsRowAdapter(mockConfig);
    expect(adapter).toBeDefined();
    expect(adapter.id).toBe("kingsrow");
  });

  // TODO: Add tests for load, search, etc. with Worker mocks
});
