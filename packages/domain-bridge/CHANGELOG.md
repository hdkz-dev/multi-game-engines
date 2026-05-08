# @multi-game-engines/domain-bridge

## 0.2.0

### Minor Changes

- [`9643217`](https://github.com/hdkz-dev/multi-game-engines/commit/9643217e368b1ba38ab70202f925ef0244ff7125) Thanks [@hdkz-dev](https://github.com/hdkz-dev)! - Add Incomplete Information game support: Texas Hold'em Poker and Contract Bridge
  - **domain-poker**: `PokerCard`, `PokerAction`, `PokerStreet`, `IPokerSearchOptions/Info/Result` branded types, factory/parser helpers (`createPokerCard`, `createPokerAction`, `parsePokerAction`, `pokerActionAsMove`)
  - **domain-bridge**: `BridgeCard`, `BridgeBid`, `BridgePlay`, `BridgePhase`, `BridgeSeat`, `IBridgeSearchOptions/Info/Result` branded types, factory helpers (`createBridgeCard`, `createBridgeBid`, `createBridgePlay`, `bridgeChoiceAsMove`)
  - **adapter-poker**: `PokerAdapter` + `PokerJSONParser` — JSON protocol for GTO solvers, supports browser (WASM Worker) and native binary modes (Multi-Runtime Bridge)
  - **adapter-bridge**: `BridgeAdapter` + `BridgeJSONParser` — JSON protocol for GIB-compatible engines, handles both auction and play phases
  - **i18n-common**: New engine error i18n keys (`loaderRequired`, `missingSources`, `missingMainEntryPoint`, `nativeBinaryRequired`, `loadFailed`)

### Patch Changes

- Updated dependencies [[`9643217`](https://github.com/hdkz-dev/multi-game-engines/commit/9643217e368b1ba38ab70202f925ef0244ff7125), [`d0b16c4`](https://github.com/hdkz-dev/multi-game-engines/commit/d0b16c4178ba32f485810ea3312126efb66c5c8d), [`c70ee30`](https://github.com/hdkz-dev/multi-game-engines/commit/c70ee30b229ef39fc860385014e709b86a4e56fd), [`665899e`](https://github.com/hdkz-dev/multi-game-engines/commit/665899e8cc68aa7674df19a2c9a7947f87f5b0db)]:
  - @multi-game-engines/i18n-common@0.1.2
  - @multi-game-engines/core@0.2.0
