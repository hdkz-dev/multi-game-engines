import React from "react";
import { ChessBoard as ChessBoardElement } from "@multi-game-engines/ui-chess-elements";

import { Move } from "@multi-game-engines/core";
import { FEN, ChessPiece } from "@multi-game-engines/domain-chess";

declare module "react" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "chess-board": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        fen?: FEN | undefined;
        "last-move"?: Move | undefined;
        orientation?: "white" | "black" | undefined;
        class?: string | undefined;
        "board-label"?: string | undefined;
        "error-message"?: string | undefined;
        pieceNames?: Partial<Record<ChessPiece, string>> | undefined;
        locale?: string | undefined;
        ref?: React.Ref<ChessBoardElement> | undefined;
      };
    }
  }
}

export interface ChessBoardProps {
  fen: FEN;
  lastMove?: Move;
  orientation?: "white" | "black";
  className?: string;
  boardLabel?: string;
  errorMessage?: string;
  pieceNames?: Partial<Record<ChessPiece, string>>;
  locale?: string;
}

export const ChessBoard: React.FC<ChessBoardProps> = ({
  fen,
  lastMove,
  orientation,
  className,
  boardLabel,
  errorMessage,
  pieceNames,
  locale,
}: ChessBoardProps) => {
  const ref = React.useRef<ChessBoardElement>(null);

  React.useLayoutEffect(() => {
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
      locale={locale}
    />
  );
};
