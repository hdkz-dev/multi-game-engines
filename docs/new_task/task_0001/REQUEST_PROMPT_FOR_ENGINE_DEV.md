# multi-game-engines 開発依頼プロンプト (最新コンテキスト統合版)

このドキュメントは、`multi-board-games` プロジェクトから `multi-game-engines` ライブラリの開発エージェントへ、現在の課題と期待する実装を伝えるための専用プロンプトです。

---

## 📝 依頼の背景と意図（AIへの説明用）

このプロンプトは、以下の 4 つの重要課題を解決するために作成されました：

1. **評価値の正規化**: 将棋（センチポーン）、チェス（ポーン差）、リバーシ（石差）といったバラバラな評価値を `-1.0 ~ 1.0` の範囲に統合し、`multi-board-games` の UI で一括管理できるようにします。
2. **セキュリティの完遂**: コマンドインジェクションを防ぐためのバリデーション（Zenith Tier 基準）をライブラリ全体で徹底します。
3. **読み筋の構造化**: 検討情報を文字列ではなく型定義された指し手配列として受け取り、盤面ハイライト等の UI 連携を容易にします。
4. **アセットの信頼性**: 巨大な NNUE ファイルや定跡データの改ざんを防ぐため、SRI ハッシュ検証を強制します。

---

## 🚀 そのままコピーして使用するプロンプト

> **Role**: Senior Software Engineer / Board Game Protocol Expert
> **Context**: `multi-game-engines` ライブラリのコア機能を 2026 Zenith Tier 基準に強化し、多ゲーム統合のための「思考エンジン基盤」としての信頼性を確立します。
>
> ### 🏆 Zenith Development Mantra (Must Follow)
>
> 1. **Zero-Any Policy**: 全てのコードにおいて `any` を禁止し、Branded Types と Generics を活用して型安全性を完遂せよ。
> 2. **Refuse by Exception**: ユーザー入力（プロトコル文字列、オプション）は `ProtocolValidator.assertNoInjection` で厳格に検証せよ。
> 3. **i18n First**: エラーメッセージを含む全てのユーザー向け文字列は `@multi-game-engines/i18n-*` を介して提供せよ。
>
> ---
>
> ### 🛠️ 優先開発タスク：評価値の正規化とセキュリティ監査
>
> #### 1. 評価値の正規化ロジックの導入
>
> 各ゲームごとに異なる評価値を、UI で一元的に扱えるように正規化します。
>
> - `packages/core/src/types.ts` の `IBaseSearchInfo` を更新し、`score: { raw: number, unit: 'cp' | 'diff' | 'winrate', normalized: number }` を追加してください。
> - `normalized` は `-1.0` (負け確) 〜 `1.0` (勝ち確) の範囲に変換する汎用的な `ScoreNormalizer` ユーティリティを実装してください。
> - `adapter-usi` および `adapter-uci` の各 Parser にて、エンジンから受信した値をこの形式に変換して `search` イベントで発火させてください。
>
> #### 2. セキュリティ・ハードニング (Security Hardening)
>
> プロトコルを介したコマンドインジェクションを物理的に防ぎます。
>
> - `packages/core/src/validators/ProtocolValidator.ts` の `assertNoInjection` が、全アダプターの `load`, `search`, `setOption` メソッドの引数に対して徹底されているか全数監査してください。
> - 動的に生成されるコマンド文字列（例：`position sfen ...`, `go depth ...`）において、結合前に必ずバリデーションが実行される構造にリファクタリングしてください。
>
> #### 3. 読み筋 (PV) の構造化
>
> 文字列ベースの PV (Principal Variation) を、フロントエンドで解析しやすい形式にします。
>
> - `IBaseSearchInfo` の `pv` を `Move[]` (Branded Types) の配列としてパースし、各エンジンのアダプターがこれを返すようにしてください。
>
> #### 4. レジストリの SRI ハッシュ検証の強化
>
> - `packages/registry` にて、WASM だけでなく、NNUE 評価関数や定跡書（.bin）のアセットに対しても SRI (Subresource Integrity) 検証が必須となるようスキーマを厳格化してください。
> - `RemoteRegistry` でアセットを取得する際、ハッシュ値が不一致の場合は即座に `EngineSecurityError` をスローするロジックを確立してください。
>
> ---
>
> ### 📦 成果物の要件
>
> - 全ての修正において、既存の `packages/core` の設計思想（Facade, Pure Core）を維持すること。
> - モノレポ全体の `pnpm run ai:check` (Lint, Typecheck, Build, Test) がパスすること。
> - 修正内容を `docs/DECISION_LOG.md` に簡潔に記録すること。
