import { html } from "lit";
import type { Meta, StoryObj } from "@storybook/web-components";
import "../engine-stats.js";

const meta: Meta = {
  title: "Molecules/EngineStats",
  component: "engine-stats",
  argTypes: {
    locale: {
      control: "radio",
      options: ["en", "ja"],
    },
  },
};

export default meta;
type Story = StoryObj;

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
    locale: "en",
  },
  render: (args) => html`
    <engine-stats .stats=${args.stats} .locale=${args.locale}></engine-stats>
  `,
};

export const MCTS: Story = {
  args: {
    stats: {
      ...mockStats,
      visits: 50000,
    },
    locale: "en",
  },
  render: (args) => html`
    <engine-stats .stats=${args.stats} .locale=${args.locale}></engine-stats>
  `,
};
