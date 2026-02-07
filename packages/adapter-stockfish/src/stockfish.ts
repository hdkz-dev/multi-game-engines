import { IEngineAdapterInfo } from "@multi-game-engines/core";

export const stockfishInfo: IEngineAdapterInfo = {
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
  status: "idle",
  progress: {
    phase: "not-started",
    percentage: 0,
    i18n: {
      key: "engine.status.idle",
      defaultMessage: "Engine is idle",
    },
  },
};
