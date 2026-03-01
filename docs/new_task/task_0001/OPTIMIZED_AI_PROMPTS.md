# multi-game-engines 開発・統合用 AI プロンプト集 (Optimized for 2026 Zenith Tier)

このドキュメントは、`multi-game-engines` ライブラリの拡張やメンテナンスを AI に依頼する際に、最高品質の成果を得るための最適化されたプロンプト集です。

---

## 🏆 共通：Zenith Tier 開発マントラ

各プロンプトの冒頭に付与、またはシステムプロンプトとして使用してください。

> **Zenith Development Mantra**:
>
> 1. **Zero-Any Policy**: 全てのコードにおいて `any` を禁止し、Branded Types と Generics を活用して型安全性を完遂せよ。
> 2. **Refuse by Exception**: ユーザー入力（プロトコル文字列、オプション）は `ProtocolValidator.assertNoInjection` で厳格に検証せよ。
> 3. **License Isolation**: Core パッケージに特定のエンジン（GPL等）に依存するコードを持ち込むな。
> 4. **i18n First**: エラーメッセージを含む全てのユーザー向け文字列は `@multi-game-engines/i18n-*` を介して提供せよ。

---

## 🤖 [Prompt 1] 新規エンジンアダプターの実装

**目的**: UCI/USI/GTP などのプロトコルを利用した新しいエンジンアダプターパッケージを作成する。

```markdown
### プロンプト：[GameName] エンジンアダプターの実装

**Role**: ボードゲームプロトコルと WebAssembly 統合のシニアエンジニア
**Context**: `multi-game-engines` に [EngineID] ([GameName]) 用のアダプターを追加します。

**Instructions**:

1. `packages/adapter-[EngineID]` を新規作成し、[BaseProtocol]Adapter を継承してください。
2. `packages/domain-[GameName]` の型定義（`Move`, `PositionString`, `SearchOptions` 等）を使用してください。
3. **Task Implementation**:
   - `[EngineID]Adapter` クラス: デフォルト設定（ID, Name, Version）を `deepMerge` で適用。
   - `[EngineID]Parser` クラス（必要に応じて）: `parseInfo` にてエンジンの独自情報を抽出。特に評価値（[GameValue]）を `IBaseSearchInfo.score` (cp/points/winrate) に正規化してください。
4. **Safety & Quality**:
   - 2026 Zenith Tier 基準: `ProtocolValidator.assertNoInjection` を全コマンド生成箇所に適用。
   - `declare module "@multi-game-engines/core"` による `EngineRegistry` への型追加。
5. **Reference**: `packages/adapter-stockfish` または `packages/adapter-yaneuraou` の構造を完全に踏襲してください。
```

---

## 🤖 [Prompt 2] 新規ドメインパッケージの作成

**目的**: 新しいゲーム（例：バックギャモン、マージャン）のための型定義と共通定数を定義する。

```markdown
### プロンプト：[GameName] ドメインパッケージの構築

**Role**: 型設計のスペシャリスト
**Context**: 新しいゲームドメイン `@multi-game-engines/domain-[GameName]` を作成します。

**Requirements**:

1. **Types**:
   - `Move<"[GameName]Move">` および `[PositionFormat]String` (例: SFEN, FEN) を Branded Types として定義。
   - `I[GameName]SearchOptions`, `I[GameName]SearchInfo`, `I[GameName]SearchResult` インターフェースの定義。
2. **Utilities**:
   - 指し手文字列の検証を行う `create[GameName]Move` 関数を実装。
   - 内部で `ProtocolValidator.assertNoInjection` を呼び出し、不正な形式を物理的に拒絶（Refuse by Exception）。
3. **i18n Integration**:
   - `@multi-game-engines/i18n-[GameName]` パッケージと連携するためのキー定義。
4. **Constraint**: `any` の使用は厳禁。関数はすべて `pure` であること。
```

---

## 🤖 [Prompt 3] エンジンレジストリへの追加と SRI 管理

**目的**: `engines.json` への登録とセキュリティハッシュの更新。

```markdown
### プロンプト：エンジンレジストリ登録とセキュリティ監査

**Context**: 新しいエンジン [EngineID] v[Version] をレジストリに追加します。

**Tasks**:

1. `packages/registry/data/engines.json` にエントリを追加してください。
2. `sources` セクションの構成:
   - `main` (JS loader), `wasm`, `eval` (NNUE等) の定義。
   - 各アセットに正確な `sri` ハッシュ値を付与（未確定の場合はプレースホルダーではなく `__unsafeNoSRI: true` と理由を明記）。
3. **Validation**:
   - `packages/registry/__tests__` のバリデーションテストを実行し、スキーマ違反がないか確認してください。
4. **Reference**: `stockfish` エントリの構成を参考にしてください。
```

---

## 🤖 [Prompt 4] UI コンポーネントの実装 (React/Web Components)

**目的**: 盤面表示や思考状況モニタリング用の UI パッケージを作成する。

```markdown
### プロンプト：[GameName] UI コンポーネントの実装

**Context**: `@multi-game-engines/ui-[GameName]-react` を作成します。

**Requirements**:

1. **Web Component 連携**:
   - 下層の `@multi-game-engines/ui-[GameName]-elements` (Lit/Vanilla) を React でラップしてください。
   - `IntrinsicElements` の型拡張を `index.tsx` で行い、Props 経由で型安全に属性を渡せるようにします。
2. **Style**:
   - `ui-core/styles` の Tailwind CSS 変数を使用し、ダークモードとハイコントラスト（A11y）に対応してください。
3. **A11y**:
   - キーボードナビゲーション（矢印キーでの局面移動等）と ARIA 座標読み上げをサポートしてください。
4. **Hook**:
   - `useEngineUI` (from `ui-react-core`) を使用して、言語設定（i18n）を動的に反映。
```

---

## 🤖 [Prompt 5] 全域監査とリファクタリング (Zenith Hardening)

**目的**: 既存コードの品質向上、型安全性の強化、パフォーマンス最適化。

```markdown
### プロンプト：Zenith Tier 品質監査と強化

**Goal**: [PackageName] に対して、深層技術監査を実行し、2026 Zenith Tier 基準へ引き上げてください。

**Audit Items**:

1. **Type Hardening**: `as any` や `any` の残存を徹底排除。`DeepPartial` や `Brand` 型への置き換え。
2. **Security**: 文字列結合によるコマンド生成箇所を `ProtocolValidator` を使用した安全な生成にリファクタリング。
3. **Memory Management**: `dispose()` メソッドにて、全ての `communicator`, `listener`, `Blob URL` が確実に解放されているか確認。
4. **SSR Safety**: `globalThis` や `window` への直接アクセスをガードし、Next.js App Router 環境でもクラッシュしないことを確認。
```
