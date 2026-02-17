import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "../search-log.js";
import { createMove } from "@multi-game-engines/core";

const meta: Meta = {
  title: "Atoms/search-log",
  component: "search-log",
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: (args) => html`
    <div style="padding: 1rem; background: #f3f4f6;">
      <search-log .log="${args.log}" locale="en"></search-log>
    </div>
  `,
  args: {
    log: [
      {
        id: "1",
        depth: 10,
        score: { type: "cp", value: 15, relativeValue: 15 },
        time: 500,
        nodes: 10000,
        nps: 2000,
        multipv: 1,
        pv: [createMove("e2e4"), createMove("e7e5")],
        timestamp: Date.now(),
      },
    ],
  },
};
