# @multi-game-engines/adapter-poker

## 1.0.2

### Patch Changes

- [#224](https://github.com/hdkz-dev/multi-game-engines/pull/224) [`f7fa5e1`](https://github.com/hdkz-dev/multi-game-engines/commit/f7fa5e1ee20b8d7fb99cccd81816c4d8795f4ce2) Thanks [@hdkz-dev](https://github.com/hdkz-dev)! - Ship the MIT license text with these packages.

  All 53 published packages declare `"license": "MIT"` and list `LICENSE` in
  their `files`, but 13 of them had no `LICENSE` file to include, so the
  published tarballs carried the declaration without the license text itself.
  The file is now present and byte-identical to the repository root license
  across every published package.

  No code or runtime behaviour changes.

- Updated dependencies [[`f7fa5e1`](https://github.com/hdkz-dev/multi-game-engines/commit/f7fa5e1ee20b8d7fb99cccd81816c4d8795f4ce2)]:
  - @multi-game-engines/domain-poker@0.2.2
  - @multi-game-engines/i18n-common@0.1.4

## 1.0.1

### Patch Changes

- [#221](https://github.com/hdkz-dev/multi-game-engines/pull/221) [`31525da`](https://github.com/hdkz-dev/multi-game-engines/commit/31525da38b3ea8f2b581edc784731d97076ce60a) Thanks [@hdkz-dev](https://github.com/hdkz-dev)! - 公開 tarball から不要ファイルを除外しました。

  全公開パッケージの package.json に `files` フィールドを設定し、`dist` と `README.md` / `LICENSE` のみを同梱するよう統一しています(`@multi-game-engines/registry` は `data`、`@multi-game-engines/ui-core` は `src/styles/theme.css` を追加で同梱)。

  これまで `files` 未設定だった 31 パッケージでは、CI のビルドログ (`.turbo/*.log`)、`tsconfig.tsbuildinfo`、`src/` とテストファイル、各種ビルド設定ファイルが tarball に混入していました。ランタイムの公開 API に変更はありません。ソースマップには `sourcesContent` が埋め込まれているため、`src/` を除外してもソースマップ経由のデバッグは引き続き可能です。

- Updated dependencies [[`ad3f836`](https://github.com/hdkz-dev/multi-game-engines/commit/ad3f83668b8e1bf8219e72351220557cdaa44e06), [`31525da`](https://github.com/hdkz-dev/multi-game-engines/commit/31525da38b3ea8f2b581edc784731d97076ce60a)]:
  - @multi-game-engines/core@0.2.1
  - @multi-game-engines/domain-poker@0.2.1
  - @multi-game-engines/i18n-common@0.1.3

## 1.0.0

### Minor Changes

- [`9643217`](https://github.com/hdkz-dev/multi-game-engines/commit/9643217e368b1ba38ab70202f925ef0244ff7125) Thanks [@hdkz-dev](https://github.com/hdkz-dev)! - Add Incomplete Information game support: Texas Hold'em Poker and Contract Bridge
  - **domain-poker**: `PokerCard`, `PokerAction`, `PokerStreet`, `IPokerSearchOptions/Info/Result` branded types, factory/parser helpers (`createPokerCard`, `createPokerAction`, `parsePokerAction`, `pokerActionAsMove`)
  - **domain-bridge**: `BridgeCard`, `BridgeBid`, `BridgePlay`, `BridgePhase`, `BridgeSeat`, `IBridgeSearchOptions/Info/Result` branded types, factory helpers (`createBridgeCard`, `createBridgeBid`, `createBridgePlay`, `bridgeChoiceAsMove`)
  - **adapter-poker**: `PokerAdapter` + `PokerJSONParser` — JSON protocol for GTO solvers, supports browser (WASM Worker) and native binary modes (Multi-Runtime Bridge)
  - **adapter-bridge**: `BridgeAdapter` + `BridgeJSONParser` — JSON protocol for GIB-compatible engines, handles both auction and play phases
  - **i18n-common**: New engine error i18n keys (`loaderRequired`, `missingSources`, `missingMainEntryPoint`, `nativeBinaryRequired`, `loadFailed`)

### Patch Changes

- Updated dependencies [[`9643217`](https://github.com/hdkz-dev/multi-game-engines/commit/9643217e368b1ba38ab70202f925ef0244ff7125), [`d0b16c4`](https://github.com/hdkz-dev/multi-game-engines/commit/d0b16c4178ba32f485810ea3312126efb66c5c8d), [`c70ee30`](https://github.com/hdkz-dev/multi-game-engines/commit/c70ee30b229ef39fc860385014e709b86a4e56fd), [`665899e`](https://github.com/hdkz-dev/multi-game-engines/commit/665899e8cc68aa7674df19a2c9a7947f87f5b0db)]:
  - @multi-game-engines/domain-poker@0.2.0
  - @multi-game-engines/i18n-common@0.1.2
  - @multi-game-engines/core@0.2.0
