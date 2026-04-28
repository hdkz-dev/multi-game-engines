import rootConfig from "../../eslint.config.mjs";

export default [
  ...rootConfig,
  // Playwright CT setup files are compiled by Playwright's own Vite build,
  // not included in the main tsconfig. Exclude from ESLint project service.
  {
    ignores: [
      "playwright/index.ts",
      "playwright/index.html",
      "playwright/.cache/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
];
