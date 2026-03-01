import { describe, it, expect } from "vitest";
import { ScoreNormalizer } from "../ScoreNormalizer.js";

describe("ScoreNormalizer", () => {
  it("should normalize chess/shogi cp scores", () => {
    // 0 cp -> 0
    expect(ScoreNormalizer.normalize(0, "cp", "chess")).toBe(0);
    // 600 cp -> ~0.46
    const n600 = ScoreNormalizer.normalize(600, "cp", "chess");
    expect(n600).toBeGreaterThan(0.4);
    expect(n600).toBeLessThan(0.5);
    // 2500 cp -> ~0.96
    expect(ScoreNormalizer.normalize(2500, "cp", "chess")).toBeGreaterThan(0.9);
    // -600 cp -> ~-0.46
    expect(ScoreNormalizer.normalize(-600, "cp", "chess")).toBeLessThan(-0.4);
  });

  it("should normalize mate scores", () => {
    expect(ScoreNormalizer.normalize(1, "mate", "chess")).toBe(0.99);
    expect(ScoreNormalizer.normalize(-1, "mate", "chess")).toBe(-0.99);
  });

  it("should normalize winrate scores", () => {
    expect(ScoreNormalizer.normalize(0.5, "winrate")).toBe(0);
    expect(ScoreNormalizer.normalize(1.0, "winrate")).toBe(1);
    expect(ScoreNormalizer.normalize(0.0, "winrate")).toBe(-1);
  });

  it("should normalize reversi diff scores", () => {
    expect(ScoreNormalizer.normalize(16, "diff", "reversi")).toBeGreaterThan(
      0.4,
    );
    expect(ScoreNormalizer.normalize(64, "diff", "reversi")).toBeGreaterThan(
      0.9,
    );
  });

  it("should normalize go points scores", () => {
    // 10 points -> ~0.46 (sigmoid with k=10)
    expect(ScoreNormalizer.normalize(10, "points", "go")).toBeGreaterThan(0.4);
  });

  it("should normalize scores for unknown domain", () => {
    expect(ScoreNormalizer.normalize(1000, "cp", "unknown")).toBeGreaterThan(
      0.4,
    );
  });

  it("should handle extreme values", () => {
    expect(ScoreNormalizer.normalize(1000000, "cp", "chess")).toBeCloseTo(1, 2);
    expect(ScoreNormalizer.normalize(-1000000, "cp", "chess")).toBeCloseTo(
      -1,
      2,
    );
  });
});
