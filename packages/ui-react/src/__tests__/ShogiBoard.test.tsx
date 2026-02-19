import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";
import { ShogiBoard } from "../shogi/index.js";
import { createSFEN } from "@multi-game-engines/core/shogi";

describe("ShogiBoard", () => {
  beforeEach(() => {
    vi.spyOn(performance, "now").mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("should render without crashing", () => {
    const sfen = createSFEN(
      "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1",
    );
    render(<ShogiBoard sfen={sfen} />);
    const el = document.querySelector("shogi-board");
    expect(el).not.toBeNull();
  });

  describe("injection safety", () => {
    const checkInjection = (obj: unknown): boolean => {
      if (typeof obj === "string") {
        try {
          createSFEN(obj);
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
