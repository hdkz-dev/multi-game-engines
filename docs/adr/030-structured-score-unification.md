# ADR-030: 構造化スコア情報の統一 (Structured Score Information)

## ステータス

承認済み (Accepted)

## コンテキスト

これまで、チェス（UCI）と将棋（USI）の思考情報 (`info`) におけるスコア表現は、アダプター層と UI 層で不一致がありました。

- **Core/Adapter 層**: `score` を単一の数値（`number`）とし、詰み（mate）スコアを表現するためにマジックナンバー `MATE_SCORE_FACTOR` (100,000) を乗算して擬似的に表現していた。
- **UI 層 (ui-core)**: `ExtendedSearchInfo` スキーマにおいて `{ cp?: number, mate?: number }` という構造化されたオブジェクトを期待していた。

この不一致により、example 等で `as any` キャストが頻発し、型安全性が損なわれるとともに、詰みスコアの解釈に暗黙的な知識（マジックナンバー）が必要となっていました。

## 決定

スコア情報を「構造化されたオブジェクト」に統一し、マジックナンバーによる正規化を完全に廃止します。

1. **Core 型の定義**:

   ```typescript
   export interface IScoreInfo {
     cp?: number; // センチポーン値（チェス・将棋）
     mate?: number; // 詰みまでの手数（チェス・将棋）
     points?: number; // 得点差（囲碁・オセロ）
     winrate?: number; // 勝率 0.0-1.0（MCTS系エンジン）
   }
   ```

2. **IBaseSearchInfo の変更**: `scoreValue` / `scoreType` プロパティを削除し、`score?: IScoreInfo` に統合。
3. **パーサーの責務**: `UCIParser` および `USIParser` は、プロトコルから得られた値を計算（乗算）することなく、そのまま `cp` または `mate` フィールドに格納して出力する。
4. **UI 側の対応**: `SearchStateTransformer` および `EvaluationPresenter` は、この構造化データを直接受け取り、表示（`+1.23` や `M5`）を決定する。

## 影響

- **型安全性**: `as any` キャストが不要となり、コンパイル時に不整合を検知可能になる。
- **可読性**: スコアが「評価値」なのか「手番詰み」なのかが明示的になる。
- **保守性**: マジックナンバーの定義を各パッケージで共有する必要がなくなる。
- **破壊的変更**: `IBaseSearchInfo.score` を単純な `number` として扱っていたコードは修正が必要。

## 検証

- 各アダプターのテストで、正/負の評価値および詰みが正しくパースされることを確認。
- `@multi-game-engines/ui-core` の Zod スキーマ検証を追加し、境界でのデータ整合性を保証。
- example (Vue, React) における `as any` キャストの完全な削除を達成。
