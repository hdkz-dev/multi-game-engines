import React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";
import { ChessBoard as ChessBoardElement } from "@multi-game-engines/ui-chess-elements";
import { FEN, createFEN } from "@multi-game-engines/domain-chess";
import { ChessBoard } from "../index.js";

describe("ChessBoard", () => {
  afterEach(cleanup);

  it("should render without crashing", () => {
    const fen = createFEN(
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    );
    const { container } = render(<ChessBoard fen={fen} />);
    const el = container.querySelector("chess-board");
    expect(el).not.toBeNull();
  });

  it("should pass props correctly to the custom element", async () => {
    const fen = createFEN(
      "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    );
    const { container } = render(
      <ChessBoard
        fen={fen}
        orientation="black"
        locale="ja"
        boardLabel="Test Board"
      />,
    );

    await waitFor(
      () => {
        const el = container.querySelector("chess-board") as ChessBoardElement;
        expect(el).not.toBeNull();
        expect(el.fen).toBe(fen);
        // React 19 might set attributes for reflected properties
        expect(el.getAttribute("orientation")).toBe("black");
        expect(el.getAttribute("locale")).toBe("ja");
        expect(el.getAttribute("board-label")).toBe("Test Board");
      },
      { timeout: 1000 },
    );
  });

  describe("injection safety", () => {
    const checkInjection = (obj: unknown): boolean => {
      if (typeof obj === "string") {
        try {
          createFEN(obj as FEN);
        } catch {
          return true; // Rejected
        }
      } else if (typeof obj === "object" && obj !== null) {
        return Object.values(obj).some(checkInjection);
      }
      return false;
    };

    it("should reject malicious payloads", () => {
      const payloads = [
        "<script>alert(1)</script> w KQkq - 0 1",
        "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1; DROP TABLE users",
      ];

      payloads.forEach((p) => {
        expect(checkInjection(p)).toBe(true);
      });
    });
  });
});
