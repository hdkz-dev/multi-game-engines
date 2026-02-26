# アーキテクチャと設計原則

> 最終更新: 2026-02-26 (Federated i18n Architecture 完遂)

## 1. プロジェクト概要

疎結合で高性能なゲームエンジン・ブリッジを、最新の Web 標準と最高の型安全性を以て構築する OSS プロジェクト。

### ミッション

- ユーザーにライセンスの懸念を感じさせない究極の隔離環境を実現
- **物理的ドメイン隔離**: ロジックだけでなく、言語リソース（i18n）も独立したパッケージ (`i18n-chess`, `i18n-shogi` 等) に物理分離。
- フレームワーク非依存で、どのような環境でも動作

---

## 2. コアコンセプト

### 2.1 Facade パターンによる API 分離

利用者は `IEngine` インターフェースを通じて操作を行い、エンジンの実体（アダプター）の複雑な内部状態から保護されます。

| インターフェース | 責務                               | 公開先                 |
| ---------------- | ---------------------------------- | ---------------------- |
| `IEngine`        | 探索、ロード、停止、終了のみ       | アプリケーション開発者 |
| `IEngineAdapter` | 通信、ステータス管理、リソース管理 | 内部実装               |

```typescript
// 利用者はシンプルな IEngine のみを使用
const engine = bridge.getEngine<
  StockfishOptions,
  StockfishInfo,
  StockfishResult
>("stockfish");
const task = engine.search({ fen: "..." as FEN, depth: 20 });

for await (const info of task.info) {
  console.log(`Depth: ${info.depth}, Score: ${info.score}`);
}

const result = await task.result;
console.log(`Best move: ${result.bestMove}`);
```

### 2.2 Branded Types による型安全性

`string` 型の混用を防ぐため、`FEN`, `SFEN`, `Move`, `I18nKey` に公称型を適用します。

```typescript
type Brand<T, K> = T & { __brand: K };
type FEN = Brand<string, "FEN">;
type SFEN = Brand<string, "SFEN">;
type Move<T extends string = string> = Brand<string, T>; // 階層化ブランド
type I18nKey = Brand<string, "I18nKey">;

// コンパイル時にエラーを検出
function search(fen: FEN): void {
  /* ... */
}
search("invalid"); // ❌ エラー: string は FEN に代入不可
```

**効果**: チェスの指し手と将棋の指し手を混同することがコンパイル時に不可能。また、アダプター層は UI 層の具体的な言語実装を知ることなく、抽象的な `I18nKey` を通じて型安全にエラーを伝播可能。

### 2.3 ジェネリクスの統一順序

すべての通信層において、以下のジェネリクス順序を厳守します:

1. `T_OPTIONS`: 探索オプション
2. `T_INFO`: 思考状況
3. `T_RESULT`: 最終結果

```typescript
interface IEngineAdapter<
  T_OPTIONS extends IBaseSearchOptions,
  T_INFO extends IBaseSearchInfo,
  T_RESULT extends IBaseSearchResult,
> {
  /* ... */
}
```

### 2.4 ストリーミング I/O

- `AsyncIterable` を使用したリアルタイム思考状況配信
- `for await...of` ループによる直感的なデータ消費
- `AbortSignal` による標準的なキャンセルパターン

```typescript
const task = engine.search({ fen, signal: abortController.signal });

// ユーザーがキャンセルボタンを押したら
abortController.abort();
```

---

## 3. 技術スタック

### 3.1 ストレージ戦略

| 優先度         | 技術      | 用途                | 特徴                       |
| -------------- | --------- | ------------------- | -------------------------- |
| 優先           | OPFS      | WASM バイナリ永続化 | 高速、ファイルシステム API |
| フォールバック | IndexedDB | 同上                | 広いブラウザサポート       |

`CapabilityDetector` による自動切替を実装。

### 3.2 セキュリティ

| 機能                        | 目的                                     |
| --------------------------- | ---------------------------------------- |
| SRI (Subresource Integrity) | 動的アダプターロードにおけるハッシュ検証 |
| COOP/COEP ヘッダー診断      | SharedArrayBuffer 利用のための設定確認   |
| SecurityAdvisor             | 設定状況の可視化と警告                   |

### 3.3 環境検知 (ICapabilities)

```typescript
interface ICapabilities {
  opfs: boolean; // OPFS サポート
  wasmThreads: boolean; // SharedArrayBuffer + Atomics
  wasmSimd: boolean; // WASM SIMD
  webNN: boolean; // WebNN API
  webGPU: boolean; // WebGPU API
  webTransport: boolean; // WebTransport API
}
```

---

## 4. ライセンス戦略

### 4.1 基本方針: 全パッケージ MIT

| パッケージ                      | ライセンス | 内容                                |
| ------------------------------- | ---------- | ----------------------------------- |
| `@multi-game-engines/core`      | MIT        | ブリッジ、ローダー、型定義          |
| `@multi-game-engines/adapter-*` | MIT        | プロトコルハンドラー (バイナリなし) |
| `@multi-game-engines/protocols` | MIT        | UCI/USI 等の共通プロトコル処理      |

### 4.2 疎結合アーキテクチャ

```text
┌─────────────────────────────────────┐
│ adapter-stockfish (MIT)             │
│  └── protocol-handler.ts            │  ← プロトコル処理のみ
└──────────────┬──────────────────────┘
               │ 実行時に動的ロード
               ▼
┌─────────────────────────────────────┐
│ 外部リソース (GPL)                  │
│  └── stockfish.wasm                 │  ← ユーザーが明示的に取得
│      (CDN / 自己ホスト)             │
└─────────────────────────────────────┘
```

**キーポイント**:

- アダプターは **エンジンバイナリを含まない**
- WASM は CDN または自己ホストから実行時にロード
- プロトコル処理 (UCI/USI パーサー) は独自実装

### 4.3 エンジンバイナリの提供方法

| 優先度 | オプション    | 説明                                 | コスト |
| ------ | ------------- | ------------------------------------ | ------ |
| **🥇** | jsDelivr      | `stockfish@17.1.0` を npm 経由で配信 | 無料   |
| **🥈** | unpkg         | フォールバック CDN                   | 無料   |
| 🥉     | Cloudflare R2 | 自前 CDN (将来オプション)            | 無料   |
| 📦     | 自己ホスト    | ユーザーが自サーバーに配置           | 変動   |

### 4.4 推奨 npm パッケージ

| パッケージ             | 理由                                         |
| ---------------------- | -------------------------------------------- |
| **`stockfish@17.1.0`** | SF17.1対応、11年実績、Chess.com協力、GPL-3.0 |

> ⚠️ `@lichess-org/stockfish-web` は AGPL-3.0 のため商用利用に制約あり。

### 4.5 法的根拠

- アダプターはエンジンコードを含まないため GPL 感染しない
- 動的ロードは「別のプログラムを実行」と同等
- 先例: ブラウザ (MIT) が GPL JavaScript を実行可能

> 詳細: [MIT ライセンス化設計提案](../implementation_plans/mit-license-architecture.md)
> CDN戦略: [Stockfish WASM 配信戦略](../implementation_plans/stockfish-wasm-strategy.md)

---

## 5. 関連ドキュメント

- [COMPONENT_DESIGN.md](./COMPONENT_DESIGN.md) - コンポーネント設計詳細
- [../DECISION_LOG.md](../DECISION_LOG.md) - 意思決定記録 (ADR)
- [../ARCHITECTURE.md](../../ARCHITECTURE.md) - アーキテクチャ概要
