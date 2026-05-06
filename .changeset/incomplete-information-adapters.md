---
"@multi-game-engines/domain-poker": minor
"@multi-game-engines/domain-bridge": minor
"@multi-game-engines/adapter-poker": minor
"@multi-game-engines/adapter-bridge": minor
"@multi-game-engines/i18n-common": patch
---

Add Incomplete Information game support: Texas Hold'em Poker and Contract Bridge

- **domain-poker**: `PokerCard`, `PokerAction`, `PokerStreet`, `IPokerSearchOptions/Info/Result` branded types, factory/parser helpers (`createPokerCard`, `createPokerAction`, `parsePokerAction`, `pokerActionAsMove`)
- **domain-bridge**: `BridgeCard`, `BridgeBid`, `BridgePlay`, `BridgePhase`, `BridgeSeat`, `IBridgeSearchOptions/Info/Result` branded types, factory helpers (`createBridgeCard`, `createBridgeBid`, `createBridgePlay`, `bridgeChoiceAsMove`)
- **adapter-poker**: `PokerAdapter` + `PokerJSONParser` — JSON protocol for GTO solvers, supports browser (WASM Worker) and native binary modes (Multi-Runtime Bridge)
- **adapter-bridge**: `BridgeAdapter` + `BridgeJSONParser` — JSON protocol for GIB-compatible engines, handles both auction and play phases
- **i18n-common**: New engine error i18n keys (`loaderRequired`, `missingSources`, `missingMainEntryPoint`, `nativeBinaryRequired`, `loadFailed`)
