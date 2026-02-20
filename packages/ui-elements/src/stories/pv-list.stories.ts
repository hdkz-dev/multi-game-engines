import { html } from "lit";
import type { Meta, StoryObj } from "@storybook/web-components";
import "../pv-list.js";

const meta: Meta = {
  title: "Molecules/PVList",
  component: "pv-list",
  argTypes: {
    locale: {
      control: "radio",
      options: ["en", "ja"],
    },
  },
};

export default meta;
type Story = StoryObj;

const mockPVs = [
  {
    multipv: 1,
    score: { type: "cp", value: 45 },
    moves: ["e2e4", "e7e5", "g1f3", "b8c6"],
  },
  {
    multipv: 2,
    score: { type: "cp", value: 12 },
    moves: ["d2d4", "d7d5", "c2c4"],
  },
];

export const Default: Story = {
  args: {
    pvs: mockPVs,
    locale: "en",
  },
  render: (args) => html`
    <div style="width: 300px;">
      <pv-list .pvs=${args.pvs} .locale=${args.locale}></pv-list>
    </div>
  `,
};

export const Searching: Story = {
  args: {
    pvs: [],
    locale: "en",
  },
  render: (args) => html`
    <div style="width: 300px;">
      <pv-list .pvs=${args.pvs} .locale=${args.locale}></pv-list>
    </div>
  `,
};
