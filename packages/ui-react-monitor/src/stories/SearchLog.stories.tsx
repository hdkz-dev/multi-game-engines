import type { Meta, StoryObj } from "@storybook/react-vite";
import { SearchLog } from "../components/SearchLog.js";
import { EngineUIProvider } from "@multi-game-engines/ui-react-core";
import { commonLocales } from "@multi-game-engines/i18n-common";
import { createMove } from "@multi-game-engines/core";

const meta: Meta<typeof SearchLog> = {
  title: "Atoms/SearchLog",
  component: SearchLog,
  decorators: [
    (Story) => (
      <EngineUIProvider localeData={commonLocales.en!}>
        <div className="p-4 bg-gray-100 min-h-[500px]">
          <Story />
        </div>
      </EngineUIProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof SearchLog>;

export const Default: Story = {
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
      {
        id: "2",
        depth: 12,
        score: { type: "cp", value: 45, relativeValue: 45 },
        time: 1200,
        nodes: 50000,
        nps: 4000,
        multipv: 1,
        pv: [createMove("e2e4"), createMove("e7e5"), createMove("g1f3")],
        timestamp: Date.now(),
      },
    ],
  },
};

export const Empty: Story = {
  args: {
    log: [],
  },
};
