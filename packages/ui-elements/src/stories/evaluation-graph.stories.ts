import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import "../evaluation-graph.js";

const meta: Meta = {
  title: "Atoms/evaluation-graph",
  component: "evaluation-graph",
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: (args) => html`
    <div style="padding: 2rem; max-width: 400px; border: 1px solid #ddd;">
      <evaluation-graph
        .entries="${args.entries}"
        .height="${args.height}"
      ></evaluation-graph>
    </div>
  `,
  args: {
    entries: [
      { score: { type: "cp", value: 10, relativeValue: 10 }, timestamp: 1 },
      { score: { type: "cp", value: 50, relativeValue: 50 }, timestamp: 2 },
      { score: { type: "mate", value: 5, relativeValue: 5 }, timestamp: 3 },
    ],
    height: 100,
  },
};
