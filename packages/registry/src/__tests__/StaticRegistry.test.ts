import { describe, it, expect } from "vitest";
import { OfficialRegistry, StaticRegistry } from "../index.js";

describe("StaticRegistry", () => {
  it("should be able to resolve official engines", () => {
    const registry = new StaticRegistry();
    const engines = registry.getSupportedEngines();

    expect(engines).toContain("stockfish");
    expect(engines).toContain("yaneuraou");

    const stockfish = registry.resolve("stockfish");
    expect(stockfish).not.toBeNull();
    expect(stockfish?.["main"]).toBeDefined();
    expect(stockfish?.["main"]?.url).toMatch(/stockfish/);
  });

  it("should return null for unknown engines", () => {
    const registry = new StaticRegistry();
    expect(registry.resolve("unknown-engine")).toBeNull();
  });

  it("should provide an OfficialRegistry instance", () => {
    expect(OfficialRegistry).toBeInstanceOf(StaticRegistry);
    expect(OfficialRegistry.getSupportedEngines()).toContain("stockfish");
  });
});
