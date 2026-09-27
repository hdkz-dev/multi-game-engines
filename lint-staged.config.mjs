import { ESLint } from "eslint";

const eslint = new ESLint();

export default {
  "*.{ts,tsx,js,jsx,mjs,vue}": async (files) => {
    const checked = await Promise.all(
      files.map(async (file) => ({
        file,
        ignored: await eslint.isPathIgnored(file),
      })),
    );
    const lintable = checked
      .filter(({ ignored }) => !ignored)
      .map(({ file }) => file);
    const quote = (file) => JSON.stringify(file);
    return [
      `prettier --write ${files.map(quote).join(" ")}`,
      ...(lintable.length
        ? [`eslint --fix --max-warnings 0 ${lintable.map(quote).join(" ")}`]
        : []),
    ];
  },
  "*.{json,md,html,yaml,yml}": "prettier --write",
};
