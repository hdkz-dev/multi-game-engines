# 2026-10-09 保守再開と公開結果

PR #270は7391dbbで統合。45/45のnpm版とdist.integrityをレジストリで確認し、統合後の全CI・公開処理は成功。PR #272は既存ADRに沿う互換更新へ修正し、メジャー更新は通常グループから分離する。残候補とM1b/M1cは課題台帳で管理する。

## npm publication

| Package                               | Before | Published |
| ------------------------------------- | ------ | --------- |
| @multi-game-engines/adapter-bridge    | 1.0.4  | 1.0.5     |
| @multi-game-engines/adapter-edax      | 1.0.5  | 1.0.6     |
| @multi-game-engines/adapter-ensemble  | 1.0.3  | 1.0.4     |
| @multi-game-engines/adapter-gnubg     | 1.0.5  | 1.0.6     |
| @multi-game-engines/adapter-gtp       | 1.0.5  | 1.0.6     |
| @multi-game-engines/adapter-janggi    | 0.1.6  | 0.1.7     |
| @multi-game-engines/adapter-katago    | 1.0.4  | 1.0.5     |
| @multi-game-engines/adapter-kingsrow  | 1.0.4  | 1.0.5     |
| @multi-game-engines/adapter-mortal    | 1.0.5  | 1.0.6     |
| @multi-game-engines/adapter-poker     | 1.0.4  | 1.0.5     |
| @multi-game-engines/adapter-stockfish | 1.0.5  | 1.0.6     |
| @multi-game-engines/adapter-uci       | 1.0.5  | 1.0.6     |
| @multi-game-engines/adapter-usi       | 1.0.5  | 1.0.6     |
| @multi-game-engines/adapter-xiangqi   | 0.1.6  | 0.1.7     |
| @multi-game-engines/adapter-yaneuraou | 1.0.5  | 1.0.6     |
| @multi-game-engines/core              | 0.2.1  | 0.2.2     |
| @multi-game-engines/domain-backgammon | 0.1.4  | 0.1.5     |
| @multi-game-engines/domain-bridge     | 0.2.4  | 0.2.5     |
| @multi-game-engines/domain-checkers   | 0.1.4  | 0.1.5     |
| @multi-game-engines/domain-chess      | 0.1.4  | 0.1.5     |
| @multi-game-engines/domain-go         | 0.1.4  | 0.1.5     |
| @multi-game-engines/domain-gomoku     | 0.1.6  | 0.1.7     |
| @multi-game-engines/domain-janggi     | 0.1.6  | 0.1.7     |
| @multi-game-engines/domain-mahjong    | 0.1.4  | 0.1.5     |
| @multi-game-engines/domain-poker      | 0.2.4  | 0.2.5     |
| @multi-game-engines/domain-reversi    | 0.1.4  | 0.1.5     |
| @multi-game-engines/domain-shogi      | 0.1.4  | 0.1.5     |
| @multi-game-engines/domain-xiangqi    | 0.1.6  | 0.1.7     |
| @multi-game-engines/registry          | 1.1.3  | 1.1.4     |
| @multi-game-engines/ui-chess-elements | 0.1.5  | 0.1.6     |
| @multi-game-engines/ui-chess-react    | 0.1.5  | 0.1.6     |
| @multi-game-engines/ui-chess-vue      | 0.1.6  | 0.1.7     |
| @multi-game-engines/ui-chess          | 0.1.6  | 0.1.7     |
| @multi-game-engines/ui-core           | 0.1.4  | 0.1.5     |
| @multi-game-engines/ui-elements       | 0.1.7  | 0.1.8     |
| @multi-game-engines/ui-react-core     | 0.1.4  | 0.1.5     |
| @multi-game-engines/ui-react-monitor  | 0.2.2  | 0.2.3     |
| @multi-game-engines/ui-react          | 0.1.7  | 0.1.8     |
| @multi-game-engines/ui-shogi-elements | 0.1.5  | 0.1.6     |
| @multi-game-engines/ui-shogi-react    | 0.1.5  | 0.1.6     |
| @multi-game-engines/ui-shogi-vue      | 0.1.6  | 0.1.7     |
| @multi-game-engines/ui-shogi          | 0.1.6  | 0.1.7     |
| @multi-game-engines/ui-vue-core       | 0.1.5  | 0.1.6     |
| @multi-game-engines/ui-vue-monitor    | 0.2.3  | 0.2.4     |
| @multi-game-engines/ui-vue            | 0.1.7  | 0.1.8     |

## Dependabot

[Official grouping semantics](https://docs.github.com/en/code-security/tutorials/secure-your-dependencies/optimizing-pr-creation-version-updates): routine minor/patch updates are grouped; majors remain individual PRs. No ignore rule is added.
