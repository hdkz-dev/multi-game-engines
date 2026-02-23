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

let activeMockEngine: MockEngine | null = null;

const getMockEngine = () => {
  if (activeMockEngine) {
    void activeMockEngine.dispose();
  }
  activeMockEngine = new MockEngine();
  return activeMockEngine;
};

interface StoryArgs {
  engine: IEngine<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>;
  searchOptions: IBaseSearchOptions;
  panelTitle?: string;
  locale?: string;
}

export const Interactive: Story = {
  args: {
    // args will be populated in render to avoid static initialization
    searchOptions: { fen: "startpos" },
    panelTitle: "Stockfish 16.1 (Web Component)",
  },
  render: (args: unknown) => {
    const a = args as StoryArgs;
    // Ensure we have a fresh engine for the story, cleaning up previous one
    const engine = a.engine || getMockEngine();

    return html`
      <div style="max-width: 400px; height: 600px;">
        <engine-monitor
          .engine="${engine}"
          .searchOptions="${a.searchOptions}"
          .panelTitle="${a.panelTitle}"
        ></engine-monitor>
      </div>
    `;
  },
};

export const English: Story = {
  args: {
    searchOptions: { fen: "startpos" },
    locale: "en",
  },
  render: (args: unknown) => {
    const a = args as StoryArgs;
    const engine = a.engine || getMockEngine();
    return html`
      <div style="max-width: 400px; height: 600px;">
        <engine-monitor
          .engine="${engine}"
          .searchOptions="${a.searchOptions}"
          .locale="${a.locale}"
        ></engine-monitor>
      </div>
    `;
  },
};
