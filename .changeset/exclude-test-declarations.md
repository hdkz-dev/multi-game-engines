---
"@multi-game-engines/adapter-bridge": patch
"@multi-game-engines/adapter-edax": patch
"@multi-game-engines/adapter-fairy-stockfish-shogi": patch
"@multi-game-engines/adapter-fairy-stockfish": patch
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
"@multi-game-engines/domain-bridge": patch
"@multi-game-engines/domain-gomoku": patch
"@multi-game-engines/domain-janggi": patch
"@multi-game-engines/domain-poker": patch
"@multi-game-engines/domain-xiangqi": patch
"@multi-game-engines/ui-chess-vue": patch
"@multi-game-engines/ui-elements": patch
"@multi-game-engines/ui-shogi-vue": patch
"@multi-game-engines/ui-vue-core": patch
"@multi-game-engines/ui-vue-monitor": patch
---

公開 tarball からテストの型定義を除外しました。

ビルド時の宣言出力専用に `tsconfig.build.json` を用意し、`__tests__` / `__ct__` およびテスト・スペックファイルを除外しています。これまで `dist/__tests__/*.test.d.ts` とそのソースマップが公開物に含まれていました。

型検査の対象は変わりません。`tsconfig.json` は従来どおりテストを含むため、`tsc --noEmit` によるカバレッジは維持されます。ランタイムの公開 API にも変更はありません。
