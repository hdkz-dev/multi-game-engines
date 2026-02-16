import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  minify: true,
  clean: true,
  banner: {
    js: '"use client";',
  },
  external: ["react", "react-dom"],
  injectStyle: false, // CSS は別途書き出す
  tsconfig: "tsconfig.build.json",
});
