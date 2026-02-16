import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: [
    "@multi-game-engines/core",
    "@multi-game-engines/ui-core",
    "@multi-game-engines/ui-react",
    "@multi-game-engines/i18n",
  ],
  reactCompiler: true,
};

export default nextConfig;
