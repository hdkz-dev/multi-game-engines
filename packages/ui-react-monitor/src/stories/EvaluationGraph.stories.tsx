import type { Meta, StoryObj } from "@storybook/react-vite";
import { EvaluationGraph } from "../components/EvaluationGraph.js";

const meta: Meta<typeof EvaluationGraph> = {
  title: "Atoms/EvaluationGraph",
  component: EvaluationGraph,
  decorators: [
    (Story) => (
      <div className="p-8 max-w-md border border-gray-200 rounded">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof EvaluationGraph>;

export const TrendUp: Story = {
  args: {
    entries: [
      { score: { type: "cp", value: 10, relativeValue: 10 }, timestamp: 1 },
      { score: { type: "cp", value: 50, relativeValue: 50 }, timestamp: 2 },
      { score: { type: "cp", value: 30, relativeValue: 30 }, timestamp: 3 },
      { score: { type: "cp", value: 120, relativeValue: 120 }, timestamp: 4 },
      { score: { type: "cp", value: 300, relativeValue: 300 }, timestamp: 5 },
    ],
    height: 100,
  },
};

export const Critical: Story = {
  args: {
    entries: [
      { score: { type: "cp", value: 0, relativeValue: 0 }, timestamp: 1 },
      { score: { type: "mate", value: 5, relativeValue: 5 }, timestamp: 2 },
    ],
    height: 100,
  },
};
