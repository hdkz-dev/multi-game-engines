import rootConfig from "../../eslint.config.mjs";
import reactConfig from "@multi-game-engines/eslint-config-react";

export default [
  ...rootConfig,
  {
    ignores: ["dist", "node_modules", "storybook-static", ".turbo"],
  },
  ...reactConfig,
];
