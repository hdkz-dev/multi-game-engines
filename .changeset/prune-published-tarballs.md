---
"@multi-game-engines/adapter-bridge": patch
"@multi-game-engines/adapter-edax": patch
"@multi-game-engines/adapter-ensemble": patch
"@multi-game-engines/adapter-fairy-stockfish": patch
"@multi-game-engines/adapter-fairy-stockfish-shogi": patch
"@multi-game-engines/adapter-gnubg": patch
"@multi-game-engines/adapter-gtp": patch
"@multi-game-engines/adapter-janggi": patch
"@multi-game-engines/adapter-katago": patch
"@multi-game-engines/adapter-kingsrow": patch
"@multi-game-engines/adapter-mortal": patch
"@multi-game-engines/adapter-poker": patch
"@multi-game-engines/adapter-stockfish": patch
"@multi-game-engines/adapter-uci": patch
"@multi-game-engines/adapter-usi": patch
"@multi-game-engines/adapter-xiangqi": patch
"@multi-game-engines/adapter-yaneuraou": patch
"@multi-game-engines/core": patch
"@multi-game-engines/domain-backgammon": patch
"@multi-game-engines/domain-bridge": patch
"@multi-game-engines/domain-checkers": patch
"@multi-game-engines/domain-chess": patch
"@multi-game-engines/domain-go": patch
"@multi-game-engines/domain-gomoku": patch
"@multi-game-engines/domain-janggi": patch
"@multi-game-engines/domain-mahjong": patch
"@multi-game-engines/domain-poker": patch
"@multi-game-engines/domain-reversi": patch
"@multi-game-engines/domain-shogi": patch
"@multi-game-engines/domain-xiangqi": patch
"@multi-game-engines/i18n-chess": patch
"@multi-game-engines/i18n-common": patch
"@multi-game-engines/i18n-core": patch
"@multi-game-engines/i18n-dashboard": patch
"@multi-game-engines/i18n-engines": patch
"@multi-game-engines/i18n-shogi": patch
"@multi-game-engines/registry": patch
"@multi-game-engines/ui-chess": patch
"@multi-game-engines/ui-chess-elements": patch
"@multi-game-engines/ui-chess-react": patch
"@multi-game-engines/ui-chess-vue": patch
"@multi-game-engines/ui-core": patch
"@multi-game-engines/ui-elements": patch
"@multi-game-engines/ui-react": patch
"@multi-game-engines/ui-react-core": patch
"@multi-game-engines/ui-react-monitor": patch
"@multi-game-engines/ui-shogi": patch
"@multi-game-engines/ui-shogi-elements": patch
"@multi-game-engines/ui-shogi-react": patch
"@multi-game-engines/ui-shogi-vue": patch
"@multi-game-engines/ui-vue": patch
"@multi-game-engines/ui-vue-core": patch
"@multi-game-engines/ui-vue-monitor": patch
---

公開 tarball から不要ファイルを除外しました。

全公開パッケージの package.json に `files` フィールドを設定し、`dist` と `README.md` / `LICENSE` のみを同梱するよう統一しています(`@multi-game-engines/registry` は `data`、`@multi-game-engines/ui-core` は `src/styles/theme.css` を追加で同梱)。

これまで `files` 未設定だった 31 パッケージでは、CI のビルドログ (`.turbo/*.log`)、`tsconfig.tsbuildinfo`、`src/` とテストファイル、各種ビルド設定ファイルが tarball に混入していました。ランタイムの公開 API に変更はありません。ソースマップには `sourcesContent` が埋め込まれているため、`src/` を除外してもソースマップ経由のデバッグは引き続き可能です。
