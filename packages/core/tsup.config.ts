import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    "domains/chess/index": "src/domains/chess/index.ts",
    "domains/shogi/index": "src/domains/shogi/index.ts",
    "domains/go/index": "src/domains/go/index.ts",
    "mocks/index": "src/mocks/index.ts",
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
