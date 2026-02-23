import rootConfig from "../../eslint.config.mjs";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  ...rootConfig,
  {
    ignores: ["dist", "node_modules", "storybook-static", ".turbo"],
  },
  {
    ...reactHooks.configs.flat.recommended,
    files: ["**/*.ts", "**/*.tsx"],
  },
];
