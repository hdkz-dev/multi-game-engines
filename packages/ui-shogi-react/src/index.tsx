import React from "react";
import "@multi-game-engines/ui-shogi-elements";
import { ShogiBoard as ShogiBoardElement } from "@multi-game-engines/ui-shogi-elements";
import { Move } from "@multi-game-engines/core";
import { SFEN, ShogiPiece } from "@multi-game-engines/domain-shogi";

declare module "react/jsx-runtime" {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "shogi-board": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        sfen?: SFEN | undefined;
        "last-move"?: Move | undefined;
        class?: string | undefined;
        "board-label"?: string | undefined;
        "error-message"?: string | undefined;
        "hand-sente-label"?: string | undefined;
        "hand-gote-label"?: string | undefined;
        pieceNames?: Partial<Record<ShogiPiece, string>> | undefined;
        locale?: string | undefined;
        ref?: React.Ref<ShogiBoardElement> | undefined;
      };
    }
  }
}

export interface ShogiBoardProps {
  sfen: SFEN;
  lastMove?: Move;
  className?: string;
  boardLabel?: string;
  errorMessage?: string;
  handSenteLabel?: string;
  handGoteLabel?: string;
  pieceNames?: Partial<Record<ShogiPiece, string>>;
  locale?: string;
}

export const ShogiBoard: React.FC<ShogiBoardProps> = ({
  sfen,
  lastMove,
  className,
  boardLabel,
  errorMessage,
  handSenteLabel,
  handGoteLabel,
  pieceNames,
  locale,
}: ShogiBoardProps) => {
  const ref = React.useRef<ShogiBoardElement>(null);
  React.useLayoutEffect(() => {
    if (ref.current && pieceNames) {
      ref.current.pieceNames = pieceNames;
    }
  }, [pieceNames]);

  return (
    <shogi-board
      ref={ref}
      sfen={sfen}
      last-move={lastMove}
      class={className}
      board-label={boardLabel}
      error-message={errorMessage}
      hand-sente-label={handSenteLabel}
      hand-gote-label={handGoteLabel}
      locale={locale}
    />
  );
};
