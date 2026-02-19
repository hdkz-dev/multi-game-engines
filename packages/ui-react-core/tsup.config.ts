import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    hooks: "src/hooks.ts",
  },
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  splitting: true,
  sourcemap: true,
  minify: false,
  target: "es2022",
  outDir: "dist",
  tsconfig: "tsconfig.build.json",
});
