import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ChessBoard } from "../index.js";
import { createFEN } from "@multi-game-engines/domain-chess";

const meta: Meta<typeof ChessBoard> = {
  title: "Domain/Chess/ChessBoard",
  component: ChessBoard,
  parameters: {
    layout: "centered",
  },
  argTypes: {
    orientation: {
      control: "radio",
      options: ["white", "black"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof ChessBoard>;

const initialFEN = createFEN(
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
);

export const Default: Story = {
  args: {
    fen: initialFEN,
    boardLabel: "Standard Chess Board",
  },
};

export const BlackOrientation: Story = {
  args: {
    fen: initialFEN,
    orientation: "black",
    boardLabel: "Board from Black perspective",
  },
};

export const CustomPieces: Story = {
  args: {
    fen: initialFEN,
    pieceNames: {
      K: "King (Sente)",
      k: "King (Gote)",
    },
    boardLabel: "Board with Custom piece names",
  },
};
