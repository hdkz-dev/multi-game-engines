import type { Meta, StoryObj } from "@storybook/vue3";
import { ShogiBoard } from "../index.js";
import { createSFEN } from "@multi-game-engines/domain-shogi";

const meta: Meta<typeof ShogiBoard> = {
  title: "Domain/Shogi/ShogiBoard",
  component: ShogiBoard,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof ShogiBoard>;

const initialSFEN = createSFEN(
  "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1",
);

export const Default: Story = {
  args: {
    sfen: initialSFEN,
    boardLabel: "Standard Shogi Board",
  },
};

export const HandPieces: Story = {
  args: {
    sfen: createSFEN(
      "lnsgk2nl/1r5b1/pppppp1pp/6p2/9/2P6/PP1PPPPPP/1B5R1/LNSGK2NL w 2P 1",
    ),
    boardLabel: "Shogi Board with pieces in hand",
    handSenteLabel: "Sente Hand",
    handGoteLabel: "Gote Hand",
  },
};
