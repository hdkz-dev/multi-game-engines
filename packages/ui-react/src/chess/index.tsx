import React from "react";
import "@multi-game-engines/ui-elements/chess";
import { ChessBoard as ChessBoardElement } from "@multi-game-engines/ui-elements/chess";
import { Move } from "@multi-game-engines/core";
import { FEN } from "@multi-game-engines/core/chess";
import { ChessPiece } from "@multi-game-engines/ui-core/chess";

declare module "react/jsx-runtime" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      /**
       * Lit-based Chess board custom element.
       */
      "chess-board": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        /** Current position in FEN format. */
        fen?: FEN | undefined;
        /** Move to highlight (e.g., 'e2e4'). */
        "last-move"?: Move | undefined;
        /** Perspective: 'white' or 'black'. */
        orientation?: "white" | "black" | undefined;
        /** CSS class name. */
        class?: string | undefined;
        /** Accessible label for the board. */
        "board-label"?: string | undefined;
        /** Error message to display when parsing fails. */
        "error-message"?: string | undefined;
        /** Custom piece names for accessibility. */
        pieceNames?: Partial<Record<ChessPiece, string>> | undefined;
        /** Ref support */
        ref?: React.Ref<ChessBoardElement> | undefined;
      };
    }
  }
}

/**
 * Props for the ChessBoard React wrapper.
 */
export interface ChessBoardProps {
  /** Validated Chess FEN string. */
  fen: FEN;
  /** Move to highlight (e.g., 'e2e4'). */
  lastMove?: Move;
  /** Perspective: 'white' (default) or 'black'. */
  orientation?: "white" | "black";
  /** CSS class name for styling. */
  className?: string;
  /** Accessible label for screen readers. */
  boardLabel?: string;
  /** Error message to display when parsing fails. */
  errorMessage?: string;
  /** Custom piece names for accessibility (aria-labels). */
  pieceNames?: Partial<Record<ChessPiece, string>>;
}

/**
 * React wrapper for the `<chess-board>` Web Component.
 * Ensures type safety and framework-idiomatic usage.
 */
export const ChessBoard: React.FC<ChessBoardProps> = ({
  fen,
  lastMove,
  orientation,
  className,
  boardLabel,
  errorMessage,
  pieceNames,
}) => {
  const ref = React.useRef<ChessBoardElement>(null);

  React.useEffect(() => {
    if (ref.current) {
      ref.current.pieceNames = pieceNames ?? {};
    }
  }, [pieceNames]);

  return (
    <chess-board
      ref={ref}
      fen={fen}
      last-move={lastMove}
      orientation={orientation}
      class={className}
      board-label={boardLabel}
      error-message={errorMessage}
    />
  );
};
