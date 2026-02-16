import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import { EvaluationScore } from "@multi-game-engines/ui-core";
import "../score-badge.ts";

const meta: Meta = {
  title: "Components/ScoreBadge",
  component: "score-badge",
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

export const Centipawns: Story = {
  args: {
    score: { type: "cp", value: 120, relativeValue: 120 },
  },
  render: (args: unknown) => {
    const a = args as { score: EvaluationScore; inverted?: boolean };
    return html`<score-badge
      .score="${a.score}"
      ?inverted="${a.inverted}"
    ></score-badge>`;
  },
};

export const Mate: Story = {
  args: {
    score: { type: "mate", value: 5, relativeValue: 5 },
  },
  render: (args: unknown) => {
    const a = args as { score: EvaluationScore };
    return html`<score-badge .score="${a.score}"></score-badge>`;
  },
};
