import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";

import { SFEN, createSFEN } from "@multi-game-engines/domain-shogi";
import { ShogiBoard as ShogiBoardElement } from "@multi-game-engines/ui-shogi-elements";
import { ShogiBoard } from "../index.js";

describe("ShogiBoard", () => {
  beforeEach(() => {
    vi.spyOn(performance, "now").mockReturnValue(0);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("should render without crashing", () => {
    const sfen = createSFEN(
      "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1",
    );
    const { container } = render(<ShogiBoard sfen={sfen} />);
    const el = container.querySelector("shogi-board");
    expect(el).not.toBeNull();
  });

  it("should pass props correctly to the custom element", async () => {
    const sfen = createSFEN(
      "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1",
    );
    const { container } = render(
      <ShogiBoard sfen={sfen} locale="ja" boardLabel="将棋盤" />,
    );

    await waitFor(
      () => {
        const el = container.querySelector("shogi-board") as ShogiBoardElement;
        expect(el).not.toBeNull();
        expect(el.getAttribute("sfen") || el.sfen).toBe(sfen);
        expect(el.getAttribute("locale")).toBe("ja");
        expect(el.getAttribute("board-label")).toBe("将棋盤");
      },
      { timeout: 1000 },
    );
  });

  describe("injection safety", () => {
    const checkInjection = (obj: unknown): boolean => {
      if (typeof obj === "string") {
        try {
          createSFEN(obj as SFEN);
        } catch {
          return true; // Rejected
        }
      } else if (typeof obj === "object" && obj !== null) {
        return Object.values(obj).some(checkInjection);
      }
      return false;
    };

    it("should reject malicious payloads recursively", () => {
      const payloads = [
        "<script>alert(1)</script> b - 1",
        "lnsgkgsnl/9/9/9/9/9/9/9/LNSGKGSNL b - 1; DROP TABLE users",
        { nested: "lnsgkgsnl/9/9/9/9/9/9/9/LNSGKGSNL b - 1 <img onerror=...>" },
      ];

      payloads.forEach((p) => {
        expect(checkInjection(p)).toBe(true);
      });
    });
  });
});
