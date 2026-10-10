# Maintenance resumption and publication (2026-10-09)

PR #270 merged as 7391dbb. Verified all 45 npm target versions and dist.integrity in the registry; all post-merge CI and publication workflows passed. Revise PR #272 to compatible updates per the existing ADR and separate majors from its routine group. Track remaining candidates and M1b/M1c in the issue register.

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
