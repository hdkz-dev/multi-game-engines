import { test, describe } from "vitest";
import { BENCHMARK_OPTIONS } from "./options.js";
import { ScoreNormalizer as ImportedScoreNormalizer } from "../utils/ScoreNormalizer.js";

// Capture the module export outside the measured loop.
const ScoreNormalizer = ImportedScoreNormalizer;

describe("ScoreNormalizer.normalize — chess/shogi (cp)", () => {
  test("normalize cp=0 (draw)", async ({ bench }) => {
    await bench("normalize cp=0 (draw)", () => {
      ScoreNormalizer.normalize(0, "cp", "chess");
    }).run(BENCHMARK_OPTIONS);
  });

  test("normalize cp=600 (1 pawn advantage)", async ({ bench }) => {
    await bench("normalize cp=600 (1 pawn advantage)", () => {
      ScoreNormalizer.normalize(600, "cp", "chess");
    }).run(BENCHMARK_OPTIONS);
  });

  test("normalize cp=2500 (dominant advantage)", async ({ bench }) => {
    await bench("normalize cp=2500 (dominant advantage)", () => {
      ScoreNormalizer.normalize(2500, "cp", "chess");
    }).run(BENCHMARK_OPTIONS);
  });

  test("normalize cp=-1200 (losing)", async ({ bench }) => {
    await bench("normalize cp=-1200 (losing)", () => {
      ScoreNormalizer.normalize(-1200, "cp", "shogi");
    }).run(BENCHMARK_OPTIONS);
  });
});

describe("ScoreNormalizer.normalize — mate", () => {
  test("normalize mate in 1", async ({ bench }) => {
    await bench("normalize mate in 1", () => {
      ScoreNormalizer.normalize(1, "mate");
    }).run(BENCHMARK_OPTIONS);
  });

  test("normalize mate in -3 (being mated)", async ({ bench }) => {
    await bench("normalize mate in -3 (being mated)", () => {
      ScoreNormalizer.normalize(-3, "mate");
    }).run(BENCHMARK_OPTIONS);
  });
});

describe("ScoreNormalizer.normalize — winrate", () => {
  test("normalize winrate=0.85 (winning)", async ({ bench }) => {
    await bench("normalize winrate=0.85 (winning)", () => {
      ScoreNormalizer.normalize(0.85, "winrate");
    }).run(BENCHMARK_OPTIONS);
  });

  test("normalize winrate=0.5 (even)", async ({ bench }) => {
    await bench("normalize winrate=0.5 (even)", () => {
      ScoreNormalizer.normalize(0.5, "winrate");
    }).run(BENCHMARK_OPTIONS);
  });
});

describe("ScoreNormalizer.normalize — reversi / go", () => {
  test("normalize reversi diff=16", async ({ bench }) => {
    await bench("normalize reversi diff=16", () => {
      ScoreNormalizer.normalize(16, "diff", "reversi");
    }).run(BENCHMARK_OPTIONS);
  });

  test("normalize go scoreLead=10", async ({ bench }) => {
    await bench("normalize go scoreLead=10", () => {
      ScoreNormalizer.normalize(10, "points", "go");
    }).run(BENCHMARK_OPTIONS);
  });
});

describe("ScoreNormalizer.normalize — bulk throughput (1000 calls)", () => {
  const samples: Array<[number, string, string]> = Array.from(
    { length: 1000 },
    (_, i) => [i * 2 - 1000, "cp", "chess"],
  );

  test("normalize 1000 cp values sequentially", async ({ bench }) => {
    await bench("normalize 1000 cp values sequentially", () => {
      for (const [raw, unit, domain] of samples) {
        ScoreNormalizer.normalize(raw, unit, domain);
      }
    }).run(BENCHMARK_OPTIONS);
  });
});
