import type { Meta, StoryObj } from "@storybook/react";
import { EngineStats } from "../EngineStats.js";

const meta: Meta<typeof EngineStats> = {
  title: "Molecules/EngineStats",
  component: EngineStats,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof EngineStats>;

const mockStats = {
  depth: 24,
  seldepth: 32,
  nodes: 1250400,
  nps: 850000,
  time: 1500,
};

export const UCI: Story = {
  args: {
    stats: mockStats,
  },
};

export const MCTS: Story = {
  args: {
    stats: {
      ...mockStats,
      visits: 50000,
    },
  },
};
