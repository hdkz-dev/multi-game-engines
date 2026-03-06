import rootConfig from "../../eslint.config.mjs";
import reactConfig from "@multi-game-engines/eslint-config-react";
import nextPlugin from "@next/eslint-plugin-next";
import jsxA11y from "eslint-plugin-jsx-a11y";
import importPlugin from "eslint-plugin-import";

export default [
  ...rootConfig,
  ...reactConfig,
  {
    plugins: {
      "@next/next": nextPlugin,
      import: importPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      ...jsxA11y.configs.recommended.rules,
      "jsx-a11y/alt-text": [
        "error",
        {
          elements: ["img"],
          img: ["Image"],
        },
      ],
      "import/no-anonymous-default-export": "warn",
      "@next/next/no-img-element": "warn",
      "@next/next/no-html-link-for-pages": "off",
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];
