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
"@multi-game-engines/domain-bridge": patch
"@multi-game-engines/domain-gomoku": patch
"@multi-game-engines/domain-janggi": patch
"@multi-game-engines/domain-poker": patch
"@multi-game-engines/domain-xiangqi": patch
"@multi-game-engines/ui-chess": patch
"@multi-game-engines/ui-elements": patch
"@multi-game-engines/ui-shogi": patch
"@multi-game-engines/ui-vue": patch
---

ビルド設定を整理しました(公開物の内容に実質変更はありません)。

- **dist のクリーンビルド**: tsup を CLI 直接呼び出ししている 24 パッケージに `--clean` を追加しました。これまではリネームや削除したファイルの成果物がローカルの `dist` に残り続けていました(CI はクリーンチェックアウトのため公開物には影響していません)。
- **壊れた `types` フィールドの削除**: `@multi-game-engines/ui-chess` と `@multi-game-engines/ui-shogi` の `types: "./dist/index.d.ts"` は存在しないファイルを指していました。これらのパッケージはサブパス export(`./elements` / `./react` / `./vue`)のみを公開しており、ルートエントリは JS も export も持たないため、当該フィールドを削除しました。各サブパスの型解決は従来どおりです。
