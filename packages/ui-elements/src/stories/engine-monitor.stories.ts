import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import {
  IEngine,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
} from "@multi-game-engines/core";
import { MockEngine } from "../mocks/MockEngine.js";
import "../engine-monitor.ts";

const meta: Meta = {
  title: "Components/EngineMonitor",
  component: "engine-monitor",
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj;

const mockEngine = new MockEngine();

interface StoryArgs {
  engine: IEngine<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>;
  searchOptions: IBaseSearchOptions;
  panelTitle?: string;
  locale?: string;
}

export const Interactive: Story = {
  args: {
    engine: mockEngine,
    searchOptions: { fen: "startpos" },
    panelTitle: "Stockfish 16.1 (Web Component)",
  },
  render: (args: unknown) => {
    const a = args as StoryArgs;
    return html`
      <div style="max-width: 400px; height: 600px;">
        <engine-monitor
          .engine="${a.engine}"
          .searchOptions="${a.searchOptions}"
          .panelTitle="${a.panelTitle}"
        ></engine-monitor>
      </div>
    `;
  },
};

export const English: Story = {
  args: {
    engine: mockEngine,
    searchOptions: { fen: "startpos" },
    locale: "en",
  },
  render: (args: unknown) => {
    const a = args as StoryArgs;
    return html`
      <div style="max-width: 400px; height: 600px;">
        <engine-monitor
          .engine="${a.engine}"
          .searchOptions="${a.searchOptions}"
          .locale="${a.locale}"
        ></engine-monitor>
      </div>
    `;
  },
};
