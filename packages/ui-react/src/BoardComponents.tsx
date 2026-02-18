import React from "react";
import "@multi-game-engines/ui-elements";
import {
  ChessBoard as ChessBoardElement,
  ShogiBoard as ShogiBoardElement,
} from "@multi-game-engines/ui-elements";
import {
  FEN,
  SFEN,
  Move,
  ChessPiece,
  ShogiPiece,
} from "@multi-game-engines/ui-core";

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ref?: React.RefObject<any> | undefined;
      };
      /**
       * Lit-based Shogi board custom element.
       */
      "shogi-board": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        /** Current position in SFEN format. */
        sfen?: SFEN | undefined;
        /** Move to highlight (e.g., '7g7f' or 'P*5e'). */
        "last-move"?: Move | undefined;
        /** CSS class name. */
        class?: string | undefined;
        /** Accessible label for the board. */
        "board-label"?: string | undefined;
        /** Error message to display when parsing fails. */
        "error-message"?: string | undefined;
        /** Accessible label for Sente's hand. */
        "hand-sente-label"?: string | undefined;
        /** Accessible label for Gote's hand. */
        "hand-gote-label"?: string | undefined;
        /** Custom piece names for accessibility. */
        pieceNames?: Partial<Record<ShogiPiece, string>> | undefined;
        /** Ref support */
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ref?: React.RefObject<any> | undefined;
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
    if (ref.current && pieceNames) {
      ref.current.pieceNames = pieceNames;
    }
  }, [pieceNames]);

  return (
    <chess-board
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as React.RefObject<any>}
      fen={fen}
      last-move={lastMove}
      orientation={orientation}
      class={className}
      board-label={boardLabel}
      error-message={errorMessage}
    />
  );
};

/**
 * Props for the ShogiBoard React wrapper.
 */
export interface ShogiBoardProps {
  /** Validated Shogi SFEN string. */
  sfen: SFEN;
  /** Move to highlight (e.g., '7g7f'). */
  lastMove?: Move;
  /** CSS class name for styling. */
  className?: string;
  /** Accessible label for screen readers. */
  boardLabel?: string;
  /** Error message to display when parsing fails. */
  errorMessage?: string;
  /** Custom label for Sente's captured pieces. */
  handSenteLabel?: string;
  /** Custom label for Gote's captured pieces. */
  handGoteLabel?: string;
  /** Custom piece names for accessibility (aria-labels). */
  pieceNames?: Partial<Record<ShogiPiece, string>>;
}

/**
 * React wrapper for the `<shogi-board>` Web Component.
 * Supports SFEN, move highlighting, and hand rendering.
 */
export const ShogiBoard: React.FC<ShogiBoardProps> = ({
  sfen,
  lastMove,
  className,
  boardLabel,
  errorMessage,
  handSenteLabel,
  handGoteLabel,
  pieceNames,
}) => {
  const ref = React.useRef<ShogiBoardElement>(null);

  React.useEffect(() => {
    if (ref.current && pieceNames) {
      ref.current.pieceNames = pieceNames;
    }
  }, [pieceNames]);

  return (
    <shogi-board
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ref={ref as React.RefObject<any>}
      sfen={sfen}
      last-move={lastMove}
      class={className}
      board-label={boardLabel}
      error-message={errorMessage}
      hand-sente-label={handSenteLabel}
      hand-gote-label={handGoteLabel}
    />
  );
};
