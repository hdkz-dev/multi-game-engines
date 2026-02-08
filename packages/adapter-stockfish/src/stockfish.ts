import { IEngineAdapterMetadata } from "@multi-game-engines/core";

export const stockfishMetadata: IEngineAdapterMetadata = {
  id: "stockfish",
  name: "Stockfish via WASM",
  version: "16.1",
  engineLicense: {
    name: "GPL-3.0-only",
    url: "https://stockfishchess.org/",
  },
  adapterLicense: {
    name: "MIT",
    url: "https://opensource.org/licenses/MIT",
  },
};
