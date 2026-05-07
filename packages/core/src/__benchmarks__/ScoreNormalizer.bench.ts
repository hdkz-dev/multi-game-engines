import { bench, describe } from "vitest";
import { ScoreNormalizer } from "../utils/ScoreNormalizer.js";

describe("ScoreNormalizer.normalize — chess/shogi (cp)", () => {
  bench("normalize cp=0 (draw)", () => {
    ScoreNormalizer.normalize(0, "cp", "chess");
  });

  bench("normalize cp=600 (1 pawn advantage)", () => {
    ScoreNormalizer.normalize(600, "cp", "chess");
  });

  bench("normalize cp=2500 (dominant advantage)", () => {
    ScoreNormalizer.normalize(2500, "cp", "chess");
  });

  bench("normalize cp=-1200 (losing)", () => {
    ScoreNormalizer.normalize(-1200, "cp", "shogi");
  });
});

describe("ScoreNormalizer.normalize — mate", () => {
  bench("normalize mate in 1", () => {
    ScoreNormalizer.normalize(1, "mate");
  });

  bench("normalize mate in -3 (being mated)", () => {
    ScoreNormalizer.normalize(-3, "mate");
  });
});

describe("ScoreNormalizer.normalize — winrate", () => {
  bench("normalize winrate=0.85 (winning)", () => {
    ScoreNormalizer.normalize(0.85, "winrate");
  });

  bench("normalize winrate=0.5 (even)", () => {
    ScoreNormalizer.normalize(0.5, "winrate");
  });
});

describe("ScoreNormalizer.normalize — reversi / go", () => {
  bench("normalize reversi diff=16", () => {
    ScoreNormalizer.normalize(16, "diff", "reversi");
  });

  bench("normalize go scoreLead=10", () => {
    ScoreNormalizer.normalize(10, "points", "go");
  });
});

describe("ScoreNormalizer.normalize — bulk throughput (1000 calls)", () => {
  const samples: Array<[number, string, string]> = Array.from(
    { length: 1000 },
    (_, i) => [i * 2 - 1000, "cp", "chess"],
  );

  bench("normalize 1000 cp values sequentially", () => {
    for (const [raw, unit, domain] of samples) {
      ScoreNormalizer.normalize(raw, unit, domain);
    }
  });
});
