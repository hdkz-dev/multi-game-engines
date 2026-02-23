import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { EngineMonitorPanel } from "../EngineMonitorPanel.js";
import { MockEngine } from "../mocks/MockEngine.js";
import { within, userEvent, expect, waitFor } from "storybook/test";

const meta: Meta<typeof EngineMonitorPanel> = {
  title: "Organisms/EngineMonitorPanel",
  component: EngineMonitorPanel,
  parameters: {
    layout: "centered",
    // アクセシビリティ設定
    a11y: {
      config: {
        rules: [{ id: "color-contrast", enabled: true }],
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof EngineMonitorPanel>;

/**
 * 基本的な表示と操作のテスト
 */
const InteractivePanel = () => {
  const engine = React.useMemo(() => new MockEngine(), []);

  React.useEffect(() => {
    return () => {
      void engine.dispose();
    };
  }, [engine]);

  return (
    <div style={{ width: "400px", height: "600px" }}>
      <EngineMonitorPanel
        engine={engine}
        searchOptions={{}}
        title="Engine Analysis"
      />
    </div>
  );
};

export const Interactive: Story = {
  render: () => <InteractivePanel />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // 1. 初期状態の確認 (Ready)
    const startButton = canvas.getByRole("button", { name: /START/i });
    await expect(startButton).toBeInTheDocument();
    await expect(canvas.getByText(/Ready/i)).toBeInTheDocument();

    // 2. STARTボタンをクリック
    await userEvent.click(startButton);

    // 3. 探索中状態への遷移を確認
    await waitFor(
      async () => {
        await expect(canvas.getByText(/Searching/i)).toBeInTheDocument();
      },
      { timeout: 2000 },
    );

    const stopButton = canvas.getByRole("button", { name: /STOP/i });
    await expect(stopButton).toBeInTheDocument();

    // 4. 統計情報の更新を待機 (Nodes が 0 以上になるか)
    await waitFor(
      async () => {
        const nodes = canvas.getByText(/[0-9]+(\.[0-9])?[Mk]/);
        await expect(nodes).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // 5. STOPボタンをクリック
    await userEvent.click(stopButton);

    // 6. 再び Ready に戻ることを確認
    await waitFor(async () => {
      await expect(canvas.getByText(/Ready/i)).toBeInTheDocument();
    });
  },
};

/**
 * ダークモード・テーマ検証用
 */
export const DarkTheme: Story = {
  ...Interactive,
  parameters: {
    backgrounds: { default: "dark" },
  },
};
