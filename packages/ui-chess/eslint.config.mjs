import rootConfig from "../../eslint.config.mjs";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  ...rootConfig,
  {
    ...reactHooks.configs.flat.recommended,
    files: ["src/react.tsx", "src/react/**/*.ts", "src/react/**/*.tsx"],
  },
];
