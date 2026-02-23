import type { Meta, StoryObj } from "@storybook/vue3";
import EvaluationGraph from "../components/EvaluationGraph.vue";

const meta: Meta<typeof EvaluationGraph> = {
  title: "Atoms/EvaluationGraph",
  component: EvaluationGraph,
  decorators: [
    () => ({
      template: `
        <div class="p-8 max-w-md border border-gray-200 rounded">
          <story />
        </div>
      `,
    }),
  ],
};

export default meta;
type Story = StoryObj<typeof EvaluationGraph>;

export const Default: Story = {
  args: {
    entries: [
      { score: { type: "cp", value: 10, relativeValue: 10 }, timestamp: 1 },
      { score: { type: "cp", value: 50, relativeValue: 50 }, timestamp: 2 },
      { score: { type: "cp", value: -20, relativeValue: -20 }, timestamp: 3 },
      { score: { type: "cp", value: 120, relativeValue: 120 }, timestamp: 4 },
    ],
    height: 100,
  },
};
