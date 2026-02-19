import type { Meta, StoryObj } from "@storybook/react-vite";
import { ScoreBadge } from "../ScoreBadge.js";

const meta: Meta<typeof ScoreBadge> = {
  title: "Atoms/ScoreBadge",
  component: ScoreBadge,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ScoreBadge>;

export const Centered: Story = {
  args: {
    score: { type: "cp", value: 0, relativeValue: 0 },
  },
};

export const StrongAdvantage: Story = {
  args: {
    score: { type: "cp", value: 550, relativeValue: 550 },
  },
};

export const Disadvantage: Story = {
  args: {
    score: { type: "cp", value: -820, relativeValue: -820 },
  },
};

export const MateDiscovery: Story = {
  args: {
    score: { type: "mate", value: 5, relativeValue: 5 },
  },
};
