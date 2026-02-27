# Zenith Tier 品質標準 (ZENITH_STANDARD.md)

本ドキュメントは、`multi-game-engines` プロジェクトにおける最高峰の設計・実装・運用基準（Zenith Tier）を定義します。全てのパッケージおよびプルリクエストは、以下の基準を遵守する必要があります。

---

## 🏛️ 1. アーキテクチャ基準 (Architecture)

### 1.1. Zero-Any Architecture

- **基準**: プロダクションコードにおいて `any` 型の使用を 100% 禁止する。
- **実装**: 通信境界（Worker postMessage）においても Zod 等によるランタイム検証を必須とし、受信データに即座に Branded Types を付与する。不可避なキャストは `as unknown as T` ではなく、バリデータ関数を経由させる。

### 1.2. Protocol-First Abstraction

- **基準**: アダプターは特定のエンジン実装に依存せず、プロトコル（UCI, USI, GTP 等）に対して実装される。
- **実装**: `adapter-uci` 等の汎用アダプターを使用し、エンジン名、バイナリ URL、SRI は外部設定（JSON/DI）から注入する。

### 1.3. Side-Effect Free Core

- **基準**: `core` パッケージはグローバルな状態を持たず、純粋な関数とクラスのみで構成される。
- **実装**: `package.json` の `sideEffects: false` を維持し、Tree-shaking を最大化する。

### 1.4. Domain-Driven Modular Isolation (Pay-as-you-go)

- **基準**: 特定のゲーム（チェス、将棋、囲碁等）に依存するロジックや型定義は、必ずサブパス（例: `/chess`, `/shogi`）に隔離し、トップレベルのエントリポイントから直接エクスポートしてはならない。
- **実装**: アプリケーションが `import ... from "@multi-game-engines/ui-react/shogi"` と記述した際、チェスや碁のコードが 1 バイトもバンドルに含まれないことを物理的に保証する。

### 1.5. Uniform Directory Structure (Predictable Refactoring)

- **基準**: モノレポ全域でファイル配置と命名規則を完全に統一する (ADR-046)。
- **実装**:
  - **UI**: コンポーネントは `src/components/`、スタイルは `src/styles/` に集約。`src/index.ts` は詳細を隠蔽。
  - **Adapters**: `{Name}Adapter.ts` と `{Name}Parser.ts` の命名規則を厳守。
  - **Tests**: `__tests__` フォルダを対象コードの直下に配置（Colocation）。
  - **Distribution**: `exports` によるエントリポイント制御を必須とし、不要な `main` フィールドを排除。

### 1.6. Federated i18n Quality (Zero-Any i18n)

- **基準**: 多言語化リソースはドメインごとに物理パッケージとして隔離し、動的アクセスにおいても 100% の型安全性を維持する。
- **実装**:
  - **物理分離**: `i18n-chess`, `i18n-shogi` 等の専用パッケージに翻訳データを封じ込める。
  - **DeepRecord**: 再帰的な Record 型を使用し、i18n キーへのアクセス時に `any` キャストや `unknown` の直接レンダリングを構造的に排除する。
  - **Branded Keys**: `I18nKey` ブランド型を介した抽象化により、アダプター層と具体的な言語実装を型安全に分離する。

---

## ⚡ 2. 性能基準 (Performance)

### 2.1. Main-Thread Protection

- **基準**: エンジンの演算および高負荷なプロトコル解析は全て Web Worker で実行し、メインスレッドの Total Blocking Time (TBT) を 50ms 未満に保つ。
- **実装**: `ui-core` のスロットリング（RAF 同期）を必須とし、UI の再描画を 60/120fps に固定する。

### 2.2. Zero-Latency Experience

- **基準**: ユーザーが操作を開始する前に必要なリソースを準備する。
- **実装**: `speculative-preloading` 指針に基づき、ホバー時やアプリ起動時に WASM/重みファイルをバックグラウンドで取得する。

### 2.3. Multi-Resource Optimization

- **基準**: 巨大なリソース（NN重みファイル等）は OPFS を活用し、メモリ消費を最小限に抑える。
- **実装**: メモリ展開を避け、ReadableStream によるチャンク単位の処理を優先する。

---

## 🛠️ 3. 開発体験基準 (Developer Experience)

### 3.1. Self-Healing Documentation

- **基準**: コードの変更とドキュメント（TECHNICAL_SPECS.md, API リファレンス）の乖離を許容しない。
- **実装**: TypeDoc による API リファレンス自動生成を行い、コードとドキュメントの同期を維持する。

### 3.2. Hermetic Development

- **基準**: `pnpm install` 後、ネットワークなしでもビルドとテストが可能であること（キャッシュ活用）。
- **実装**: Turborepo のリモートキャッシュとローカルキャッシュを厳格に管理する。

---

## 💎 4. 品質・アクセシビリティ基準 (QA & A11y)

### 4.1. Continuous Benchmarking

- **基準**: 全ての PR で NPS (Nodes Per Second) の退行（Regression）をチェックする。
- **実装**: CodSpeed 等を用いたパフォーマンス・リグレッション・テストの実施。

### 4.2. Inclusive Board UI (WCAG 2.2 AAA)

- **基準**: 視覚障害者がスクリーンリーダーと点字ディスプレイのみで対局・分析を行えること。
- **実装**: 全てのマスの座標、駒の種類、評価値の変化をリアルタイムに音声/テキスト化し、フォーカス管理を徹底する。

---

## 🛡️ 5. セキュリティ基準 (Security)

### 5.1. Immutable Trust Chain

- **基準**: 全ての外部バイナリは SRI (Subresource Integrity) によるハッシュ検証を必須とする。
- **実装**: `__unsafeNoSRI` の使用は、ローカル開発環境または AI による検証済みの一時的なプロトタイプに限定する。

### 5.2. Secure Context Isolation

- **基準**: Cross-Origin Isolation (COOP/COEP) を前提とした設計。
- **実装**: `SharedArrayBuffer` の利用を安全にカプセル化し、未サポート環境ではセキュアに機能をダウングレード（フォールバック）させる。

### 5.3. Refuse by Exception (厳格な入力拒否)

- **基準**: プロトコルインジェクションやパストラバーサル等のリスクに対し、不完全なサニタイズ（置換）を行わず、不正な入力を即座に「拒否」する。
- **実装**: ADR-026 に基づき、不正な制御文字やパスを検知した場合、`EngineError` (SECURITY_ERROR) をスローし、`remediation` フィールドで正当な形式を提示する。
