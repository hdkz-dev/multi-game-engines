import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { PVList } from "../components/PVList.js";
import { PrincipalVariation } from "@multi-game-engines/ui-core";
import { createMove } from "@multi-game-engines/core";

const meta: Meta<typeof PVList> = {
  title: "Molecules/PVList",
  component: PVList,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof PVList>;

const mockPVs: PrincipalVariation[] = [
  {
    multipv: 1,
    score: { type: "cp", value: 45, relativeValue: 45 },
    moves: [createMove("e2e4"), createMove("e7e5"), createMove("g1f3")],
  },
  {
    multipv: 2,
    score: { type: "cp", value: 12, relativeValue: 12 },
    moves: [createMove("d2d4"), createMove("d7d5")],
  },
];

export const Default: Story = {
  args: {
    pvs: mockPVs,
  },
  render: (args: React.ComponentProps<typeof PVList>) => (
    <div style={{ width: "350px" }} className="p-4 bg-gray-50 rounded-xl">
      <PVList {...args} />
    </div>
  ),
};

export const SinglePV: Story = {
  args: {
    pvs: [mockPVs[0]!],
  },
};
