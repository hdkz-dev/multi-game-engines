import { describe, it, expect } from "vitest";
import { GNUBGAdapter } from "../GNUBGAdapter.js";
import { IEngineConfig } from "@multi-game-engines/core";

describe("GNUBGAdapter", () => {
  const mockConfig: IEngineConfig = {
    id: "gnubg",
    adapter: "gnubg",
    sources: {
      main: {
        url: "http://localhost/gnubg.js",
        sri: "sha384-dummy",
        type: "worker-js",
      },
    },
  };

  it("should be instantiated", () => {
    const adapter = new GNUBGAdapter(mockConfig);
    expect(adapter).toBeDefined();
    expect(adapter.id).toBe("gnubg");
  });

  // TODO: Add tests for load, search, etc. with Worker mocks
});
