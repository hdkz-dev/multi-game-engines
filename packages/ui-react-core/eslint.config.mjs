import rootConfig from "../../eslint.config.mjs";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  ...rootConfig,
  {
    files: ["**/*.ts", "**/*.tsx"],
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
];
