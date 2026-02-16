// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from "eslint-plugin-storybook";

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/storybook-static/**",
      "**/.next/**",
      "**/*.config.ts",
      "**/*.config.mjs",
    ],
  },
  {
    languageOptions: {
      parserOptions: {
        project: true,
      },
    },
  },
  ...storybook.configs["flat/recommended"],
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "storybook/no-renderer-packages": "off", // 2026: Override recommended to allow @storybook/react types
    },
  },
);
