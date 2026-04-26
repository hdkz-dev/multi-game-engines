import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { createKataGoEngine } from "../index.js";

vi.mock("@multi-game-engines/registry", () => ({
  OfficialRegistry: {
    resolve: vi.fn().mockReturnValue({
      main: {
        url: "katago.js",
        type: "worker-js",
        sri: "sha384-ValidSRIHashForTest64CharsLongAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      },
    }),
  },
}));

vi.mock("@multi-game-engines/core", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@multi-game-engines/core")>();
  return {
    ...actual,
    normalizeAndValidateSources: vi.fn().mockReturnValue({
      main: {
        url: "katago.js",
        type: "worker-js",
        sri: "sha384-ValidSRIHashForTest64CharsLongAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
      },
    }),
  };
});

describe("createKataGoEngine", () => {
  beforeAll(() => {
    vi.spyOn(performance, "now").mockReturnValue(0);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("should return an engine instance with the expected interface", () => {
    const engine = createKataGoEngine();
    expect(engine).toBeDefined();
    expect(typeof engine.load).toBe("function");
    expect(typeof engine.onInfo).toBe("function");
    expect(typeof engine.onSearchResult).toBe("function");
  });

  it("should return an engine with id 'katago'", () => {
    const engine = createKataGoEngine();
    expect(engine.id).toBe("katago");
  });

  it("should accept a custom config and return an engine", () => {
    const engine = createKataGoEngine({ version: "1.15.0" });
    expect(engine).toBeDefined();
    expect(engine.id).toBe("katago");
  });

  it("should call OfficialRegistry.resolve with the engine id", async () => {
    const { OfficialRegistry } = await import("@multi-game-engines/registry");
    createKataGoEngine();
    expect(OfficialRegistry.resolve).toHaveBeenCalledWith("katago", undefined);
  });

  it("should pass config.version to OfficialRegistry.resolve", async () => {
    const { OfficialRegistry } = await import("@multi-game-engines/registry");
    createKataGoEngine({ version: "1.14.0" });
    expect(OfficialRegistry.resolve).toHaveBeenCalledWith("katago", "1.14.0");
  });
});
