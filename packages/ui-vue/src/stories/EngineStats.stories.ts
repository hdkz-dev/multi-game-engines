import type { Meta, StoryObj } from "@storybook/vue3-vite";
import EngineStats from "../EngineStats.vue";
import EngineUIProvider from "../EngineUIProvider.vue";
import { locales } from "@multi-game-engines/i18n";

const meta: Meta<typeof EngineStats> = {
  title: "Components/EngineStats",
  component: EngineStats,
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
type Story = StoryObj<typeof EngineStats>;

export const Default: Story = {
  args: {
    stats: {
      depth: 24,
      seldepth: 32,
      nodes: 1250000,
      nps: 850000,
      time: 1500,
    },
  },
};

export const Zero: Story = {
  args: {
    stats: {
      depth: 0,
      nodes: 0,
      nps: 0,
      time: 0,
    },
  },
};
