import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import storybook from "eslint-plugin-storybook";

export default [
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/storybook-static/**",
      "**/.next/**",
      "**/*.config.ts",
      "**/*.config.mjs",
      "**/*.config.js",
      "**/next-env.d.ts",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { "argsIgnorePattern": "^_" },
      ],
    },
  },
  // Storybook 用の設定を個別に定義（互換性エラーを避けるため、configs を直接展開）
  {
    files: ["**/*.stories.@(ts|tsx|js|jsx|mjs|cjs)"],
    plugins: {
      storybook,
    },
    rules: {
      "storybook/no-renderer-packages": "off",
    },
  },
];
