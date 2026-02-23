import type { Meta, StoryObj } from "@storybook/vue3-vite";
import ScoreBadge from "../components/ScoreBadge.vue";
import { EngineUIProvider } from "@multi-game-engines/ui-vue-core";
import { locales } from "@multi-game-engines/i18n";

const meta: Meta<typeof ScoreBadge> = {
  title: "Components/ScoreBadge",
  component: ScoreBadge,
  tags: ["autodocs"],
  decorators: [
    () => ({
      components: { EngineUIProvider },
      template:
        '<EngineUIProvider :localeData="localeData"><slot /></EngineUIProvider>',
      data: () => ({ localeData: locales.ja }),
    }),
  ],
};

export default meta;
type Story = StoryObj<typeof ScoreBadge>;

export const Centipawns: Story = {
  args: {
    score: { type: "cp", value: 120, relativeValue: 120 },
  },
};

export const Negative: Story = {
  args: {
    score: { type: "cp", value: -85, relativeValue: -85 },
  },
};

export const Mate: Story = {
  args: {
    score: { type: "mate", value: 5, relativeValue: 5 },
  },
};

export const Inverted: Story = {
  args: {
    score: { type: "cp", value: 150, relativeValue: 150 },
    inverted: true,
  },
};
