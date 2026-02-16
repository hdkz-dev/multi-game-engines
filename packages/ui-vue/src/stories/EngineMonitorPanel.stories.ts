import type { Meta, StoryObj } from "@storybook/vue3-vite";
import EngineMonitorPanel from "../EngineMonitorPanel.vue";
import EngineUIProvider from "../EngineUIProvider.vue";
import { MockEngine } from "../mocks/MockEngine.js";
import { locales } from "@multi-game-engines/i18n";
import {
  IEngine,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
} from "@multi-game-engines/core";

const meta: Meta<typeof EngineMonitorPanel> = {
  title: "Components/EngineMonitorPanel",
  component: EngineMonitorPanel as unknown as Meta<
    typeof EngineMonitorPanel
  >["component"],
  tags: ["autodocs"],
  decorators: [
    () => ({
      components: { EngineUIProvider },
      template:
        '<div style="max-width: 400px; height: 600px;"><EngineUIProvider :localeData="localeData"><slot /></EngineUIProvider></div>',
      data: () => ({ localeData: locales.ja }),
    }),
  ],
};

export default meta;
type Story = StoryObj<typeof EngineMonitorPanel>;

const mockEngine = new MockEngine();

export const Interactive: Story = {
  args: {
    engine: mockEngine as unknown as IEngine<
      IBaseSearchOptions,
      IBaseSearchInfo,
      IBaseSearchResult
    >,
    searchOptions: { fen: "startpos" } as IBaseSearchOptions,
    title: "Stockfish 16.1",
  },
};

export const ErrorState: Story = {
  args: {
    engine: new MockEngine({ failOnSearch: true }) as unknown as IEngine<
      IBaseSearchOptions,
      IBaseSearchInfo,
      IBaseSearchResult
    >,
    searchOptions: { fen: "startpos" } as IBaseSearchOptions,
  },
};
