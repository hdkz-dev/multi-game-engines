import rootConfig from "../../eslint.config.mjs";
import reactConfig from "@multi-game-engines/eslint-config-react";
import nextPlugin from "@next/eslint-plugin-next";

export default [
  ...rootConfig,
  ...reactConfig,
  {
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "import-x/no-anonymous-default-export": "warn",
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
