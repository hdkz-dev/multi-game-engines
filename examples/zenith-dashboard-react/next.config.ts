import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: [
    "@multi-game-engines/core",
    "@multi-game-engines/ui-core",
    "@multi-game-engines/ui-react",
    "@multi-game-engines/i18n-common", "@multi-game-engines/i18n-dashboard",
    "@multi-game-engines/adapter-uci",
    "@multi-game-engines/adapter-usi",
    "@multi-game-engines/adapter-stockfish",
    "@multi-game-engines/adapter-yaneuraou",
    "@multi-game-engines/adapter-katago",
  ],
  reactCompiler: true,
};

export default nextConfig;
