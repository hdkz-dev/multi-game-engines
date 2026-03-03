import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  external: ["@multi-game-engines/core", "@multi-game-engines/i18n-core"],
  target: "es2022",
  sourcemap: true,
  tsconfig: "tsconfig.build.json",
});
