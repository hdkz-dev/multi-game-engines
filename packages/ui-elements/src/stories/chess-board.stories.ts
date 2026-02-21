import { html } from "lit";
import type { Meta, StoryObj } from "@storybook/web-components";
import "@multi-game-engines/ui-chess-elements";

const meta: Meta = {
  title: "Domain/Chess/ChessBoard",
  component: "chess-board",
  parameters: {
    layout: "centered",
  },
  argTypes: {
    orientation: {
      control: "radio",
      options: ["white", "black"],
    },
    locale: {
      control: "radio",
      options: ["en", "ja"],
    },
  },
};

export default meta;
type Story = StoryObj;

const initialFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export const Default: Story = {
  args: {
    fen: initialFEN,
    boardLabel: "Standard Chess Board",
  },
  render: (args) => html`
    <div style="width: 400px; height: 400px;">
      <chess-board
        .fen=${args.fen}
        .orientation=${args.orientation}
        .boardLabel=${args.boardLabel}
        .locale=${args.locale}
      ></chess-board>
    </div>
  `,
};

export const HighlightLastMove: Story = {
  args: {
    fen: "r1bqkbnr/pppp1ppp/2n5/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3",
    lastMove: "e2e4",
    boardLabel: "Board with last move highlight",
  },
  render: (args) => html`
    <div style="width: 400px; height: 400px;">
      <chess-board
        .fen=${args.fen}
        last-move=${args.lastMove}
        .boardLabel=${args.boardLabel}
      ></chess-board>
    </div>
  `,
};
