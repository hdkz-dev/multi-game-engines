import { bench, describe } from "vitest";
import { ProtocolValidator } from "../protocol/ProtocolValidator.js";

const CLEAN_SHORT = "e2e4";
const CLEAN_LONG =
  "position startpos moves e2e4 e7e5 g1f3 b8c6 f1b5 a7a6 b5a4 g8f6";
const CLEAN_FEN = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1";

describe("ProtocolValidator.assertNoInjection — clean input", () => {
  bench("short move string (e2e4)", () => {
    ProtocolValidator.assertNoInjection(CLEAN_SHORT, "move");
  });

  bench("long position string (9 moves)", () => {
    ProtocolValidator.assertNoInjection(CLEAN_LONG, "position");
  });

  bench("FEN string", () => {
    ProtocolValidator.assertNoInjection(CLEAN_FEN, "fen");
  });
});

describe("ProtocolValidator.assertNoInjection — object validation", () => {
  const optionObj = { name: "Threads", value: "4" };
  const deepOptionObj = {
    name: "Hash",
    value: "128",
    meta: { source: "user", validated: "true" },
  };

  bench("flat option object", () => {
    ProtocolValidator.assertNoInjection(optionObj, "option", true);
  });

  bench("nested option object (depth=2)", () => {
    ProtocolValidator.assertNoInjection(deepOptionObj, "option", true);
  });
});

describe("ProtocolValidator.assertNoInjection — allowSemicolon (GTP)", () => {
  const gtpMove = "B[qd]";
  const sgfSequence = "B[qd];W[dd];B[cp]";

  bench("GTP move (semicolons allowed)", () => {
    ProtocolValidator.assertNoInjection(gtpMove, "gtp-move", false, true);
  });

  bench("SGF sequence (semicolons allowed)", () => {
    ProtocolValidator.assertNoInjection(
      sgfSequence,
      "sgf-sequence",
      false,
      true,
    );
  });
});

describe("ProtocolValidator.assertNoInjection — bulk throughput", () => {
  const moves = Array.from(
    { length: 500 },
    (_, i) => `e${(i % 8) + 1}e${((i + 1) % 8) + 1}`,
  );

  bench("validate 500 move strings sequentially", () => {
    for (const move of moves) {
      ProtocolValidator.assertNoInjection(move, "move");
    }
  });
});
