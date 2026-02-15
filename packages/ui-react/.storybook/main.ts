import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@storybook/addon-a11y", // アクセシビリティ監査を有効化
    "storybook-dark-mode", // ダークモード切り替えを有効化
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  docs: {
    // 2026: Storybook 10 style autodocs
  },
};
export default config;
