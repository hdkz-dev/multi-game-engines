import { html } from "lit";
import type { Meta, StoryObj } from "@storybook/web-components";
import "@multi-game-engines/ui-shogi-elements";

const meta: Meta = {
  title: "Domain/Shogi/ShogiBoard",
  component: "shogi-board",
  parameters: {
    layout: "centered",
  },
  argTypes: {
    locale: {
      control: "radio",
      options: ["en", "ja"],
    },
  },
};

export default meta;
type Story = StoryObj;

const initialSFEN =
  "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1";

export const Default: Story = {
  args: {
    sfen: initialSFEN,
    boardLabel: "Standard Shogi Board",
  },
  render: (args) => html`
    <div style="width: 400px; height: 450px;">
      <shogi-board
        .sfen=${args.sfen}
        .boardLabel=${args.boardLabel}
        .locale=${args.locale}
      ></shogi-board>
    </div>
  `,
};

export const HandPieces: Story = {
  args: {
    sfen: "lnsgk2nl/1r5b1/pppppp1pp/6p2/9/2P6/PP1PPPPPP/1B5R1/LNSGK2NL w 2P 1",
    boardLabel: "Shogi Board with pieces in hand",
  },
  render: (args) => html`
    <div style="width: 400px; height: 450px;">
      <shogi-board
        .sfen=${args.sfen}
        .boardLabel=${args.boardLabel}
      ></shogi-board>
    </div>
  `,
};
