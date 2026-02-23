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
  decorators: [
    (story, { id }) => {
      // 2026 Best Practice: ストーリーごとに独立したエンジンインスタンスを管理し、
      // ドキュメント表示時（複数ストーリー同時レンダリング）の競合を防ぐ。
      const engineId = `engine-${id}`;
      if (!globalThis.__engine_cache__) {
        globalThis.__engine_cache__ = new Map();
      }
      if (!globalThis.__engine_cache__.has(engineId)) {
        globalThis.__engine_cache__.set(engineId, new MockEngine());
      }
      const engine = globalThis.__engine_cache__.get(engineId);

      // 注意: Web Components ストーリーではコンポーネントの破棄タイミングを
      // 精密にフックするのが難しいため、グローバルキャッシュ方式を採用。
      // 必要に応じて HMR 時等にクリーンアップ。

      return story({ args: { ...meta.args, engine } });
    },
  ],
};

declare global {
  var __engine_cache__: Map<string, MockEngine>;
}

export default meta;
type Story = StoryObj;

interface StoryArgs {
  engine: IEngine<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>;
  searchOptions: IBaseSearchOptions;
  panelTitle?: string;
  locale?: string;
}

export const Interactive: Story = {
  args: {
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
