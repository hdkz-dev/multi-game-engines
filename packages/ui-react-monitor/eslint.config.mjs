import rootConfig from "../../eslint.config.mjs";
import reactConfig from "@multi-game-engines/eslint-config-react";

export default [
  ...rootConfig,
  ...reactConfig,
  // Playwright CT setup files are compiled by Playwright's own Vite build,
  // not included in the main tsconfig. Exclude from ESLint project service.
  {
    ignores: ["playwright/index.tsx", "playwright/index.html"],
  },
];
