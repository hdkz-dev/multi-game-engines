# 実装計画書: 汎用プロトコルアダプター基盤の構築

## 1. 目的

特定のエンジン名に依存しない、プロトコル（UCI, USI, GTP, UCCI）ベースの「汎用アダプター」を実装します。これにより、バイナリの URL と SRI を指定するだけで、新しいエンジンをコード変更なしに追加できる柔軟な基盤を確立します。

## 2. 設計方針

### 2.1. プロトコルアダプターの分離

既存の `adapter-stockfish` や `adapter-yaneuraou` からプロトコル依存部分を抽出し、以下の汎用パッケージを新規作成します。

- **`@multi-game-engines/adapter-uci`**: チェス汎用。
- **`@multi-game-engines/adapter-usi`**: 将棋汎用。
- **`@multi-game-engines/adapter-gtp`**: 囲碁汎用。
- **`@multi-game-engines/adapter-json`**: JSON RPC ベースエンジン（麻雀等）汎用。

### 2.2. 動的コンフィギュレーション

アダプター生成時に、以下のパラメータを外部から注入可能にします。

```typescript
interface IGenericAdapterConfig {
  id: string;
  name: string;
  version: string;
  sources: {
    main: IEngineSourceConfig; // JSローダー
    wasm?: IEngineSourceConfig; // WASM本体
    eval?: IEngineSourceConfig; // 評価関数/重み
  };
  options?: Record<string, unknown>; // デフォルトオプション
  /** 2026 Zenith Tier: エンジン固有の能力・制限の定義 */
  capabilities?: {
    multiPV?: boolean;
    ponder?: boolean;
    uciLimitStrength?: boolean;
    [key: string]: boolean | undefined;
  };
}
```

### 2.3. オプション抽象化とマッピング戦略

特定のエンジン（Stockfish等）に依存しない汎用性を維持するため、以下のオプション管理フローを導入します。

1. **標準オプションのパススルー**: `Hash`, `Threads`, `MultiPV` 等のプロトコル標準オプションは、アダプターが型安全に透過。
2. **エンジン固有オプションのマッピング**:
   - `adapter-uci` 等がオプション名と値を受け取った際、内部の `OptionMap` を参照。
   - 独自の `engineProfile` インターフェースを通じて、エンジン毎のコマンド変換（例: `Contempt` -> `setoption name Contempt value ...`）を適用。
3. **拡張ポイント (Extension Points)**:
   - 将来的に Lc0 (CNN系) や別ゲームのエンジンを追加する際、プロトコルを拡張せずに済むよう、プラグイン式の「プロトコル・ミドルウェア」をアダプター層に登録可能にします。

## 3. 実装ステップ

### ステップ 1: `core` の拡張 (Foundation)

- `IEngineBridge.registerAdapter` の引数を拡張し、コンフィギュレーションベースの登録をサポート。
- `EngineLoader` において、マルチソース（WASM + Weights）の依存解決ロジックを一般化。

### ステップ 2: 汎用 UCI アダプターの実装

- `adapter-stockfish` のロジックを `adapter-uci` へ移動。
- Stockfish 固有のコマンド（`setoption name Hash ...` 等）を抽象化し、プロトコル標準の範囲内で動作を保証。

### ステップ 3: 局面解析器の統合

- `ui-core` の FEN/SFEN パーサーをアダプター内で標準利用し、プロトコル出力の検証（Validation）を強化。

### ステップ 4: 既存アダプターの移行

- `adapter-stockfish` を、`adapter-uci` を内部で使用する薄いラッパー（またはエイリアス）にリファクタリング。

## 4. 検証計画

- **パリティ検証**: 既存の Stockfish と新 UCI アダプターで、探索結果やパフォーマンスに差異がないことを確認。
- **新規エンジン試験**: 外部の UCI 互換エンジン（Lc0 等）の WASM 版を、設定のみでロード・実行できるかテスト。
