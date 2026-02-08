# コンポーネント設計詳細

> 最終更新: 2026-02-06

## 1. Core パッケージ構成

```text
packages/core/src/
├── index.ts              # 公開 API
├── types.ts              # 全インターフェース、Branded Types
├── protocols/
│   └── types.ts          # IProtocolParser
├── bridge/
│   ├── EngineBridge.ts   # IEngineBridge 実装
│   └── EngineFacade.ts   # IEngine 実装
├── adapters/
│   └── BaseAdapter.ts    # 抽象クラス
├── capabilities/
│   ├── CapabilityDetector.ts
│   └── SecurityAdvisor.ts
├── storage/
│   ├── FileStorage.ts    # IFileStorage
│   ├── OPFSStorage.ts
│   └── IndexedDBStorage.ts
└── workers/
    └── WorkerCommunicator.ts
```

---

## 2. EngineBridge

**ファイル**: `packages/core/src/bridge/EngineBridge.ts`

### EngineBridge の責務

1. アダプターのレジストリ管理 (`Map<string, IEngineAdapter>`)
2. IEngine Facade の生成・返却
3. ミドルウェアチェーンの構築と実行
4. CapabilityDetector / SecurityAdvisor との連携

### EngineBridge のインターフェース

```typescript
interface IEngineBridge {
  registerAdapter<T_OPTIONS, T_INFO, T_RESULT>(
    adapter: IEngineAdapter<T_OPTIONS, T_INFO, T_RESULT>,
  ): void;

  getEngine<T_OPTIONS, T_INFO, T_RESULT>(
    id: string,
  ): IEngine<T_OPTIONS, T_INFO, T_RESULT>;

  use<T_INFO, T_RESULT>(middleware: IMiddleware<T_INFO, T_RESULT>): void;

  checkCapabilities(): Promise<ICapabilities>;
  getSecurityStatus(): ISecurityStatus;
}
```

### EngineBridge の使用例

```typescript
const bridge = new EngineBridge();

// アダプター登録
bridge.registerAdapter(new StockfishAdapter());
bridge.registerAdapter(new YaneuraouAdapter());

// ミドルウェア追加
bridge.use({
  onInfo: (info, ctx) => {
    console.log(`[${ctx.engineId}] Depth: ${info.depth}`);
    return info;
  },
});

// エンジン取得
const stockfish = bridge.getEngine("stockfish");
```

---

## 3. BaseAdapter

**ファイル**: `packages/core/src/adapters/BaseAdapter.ts`

### BaseAdapter の責務

1. `EngineStatus` と `ILoadProgress` の状態管理
2. イベントリスナーの登録・解除・発火
3. サブクラスが実装すべき抽象メソッドの定義
4. 共通のエラーハンドリングやリトライロジック (将来)

### 状態定義

```typescript
type EngineStatus =
  | "idle" // 初期状態
  | "loading" // ロード中 (バイナリ取得、初期化)
  | "ready" // 実行可能状態
  | "busy" // 探索・計算中
  | "error" // 致命的エラー
  | "terminated"; // quit() 呼び出し後、完全に破棄された状態 (再利用不可)

interface ILoadProgress {
  phase: "not-started" | "downloading" | "initializing" | "ready" | "error";
  percentage: number;
  i18n: {
    key: string;
    params?: Record<string, string | number>;
    defaultMessage: string;
  };
  error?: Error;
}
```

> **注意**: `terminated` 状態のアダプターはガベージコレクションの対象となり得ます。再びエンジンを使用する場合は `EngineBridge.getEngine()` で新しいインスタンスを取得する必要があります。

### クラス設計

```typescript
abstract class BaseAdapter<
  T_OPTIONS extends IBaseSearchOptions,
  T_INFO extends IBaseSearchInfo,
  T_RESULT extends IBaseSearchResult,
> implements IEngineAdapter<T_OPTIONS, T_INFO, T_RESULT> {
  // サブクラスが定義 (IEngineAdapterMetadata の実装)
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly version: string;
  abstract readonly engineLicense: ILicenseInfo;
  abstract readonly adapterLicense: ILicenseInfo;
  abstract readonly sources?: Record<string, IEngineSourceConfig>;

  // 状態管理
  protected _status: EngineStatus = "idle";
  protected _progress: ILoadProgress = {
    phase: "not-started",
    percentage: 0,
    i18n: { key: "progress.idle", defaultMessage: "Initializing..." },
  };

  // ライフサイクル (サブクラスがオーバーライド)
  abstract prefetch?(): Promise<void>;
  abstract load(): Promise<void>;
  abstract search(options: T_OPTIONS): ISearchTask<T_INFO, T_RESULT>;
  abstract dispose(): Promise<void>;

  // 状態取得
  get status(): EngineStatus {
    return this._status;
  }
  get progress(): ILoadProgress {
    return this._progress;
  }

  // イベント登録・発火
  abstract onStatusChange(callback: (status: EngineStatus) => void): void;
  abstract onProgress(callback: (progress: ILoadProgress) => void): void;

  protected emitStatusChange(status: EngineStatus): void {
    this._status = status;
    /* ... */
  }
  protected emitProgress(progress: ILoadProgress): void {
    this._progress = progress;
    /* ... */
  }
}
```

---

## 4. CapabilityDetector

**ファイル**: `packages/core/src/capabilities/CapabilityDetector.ts`

### CapabilityDetector の責務

実行環境の機能を診断し、最適なストラテジーを選択可能にする。

### 検出メソッド

| 機能         | 検出方法                                                          |
| ------------ | ----------------------------------------------------------------- |
| OPFS         | `navigator.storage?.getDirectory?.()`                             |
| WASM Threads | `typeof SharedArrayBuffer !== 'undefined' && crossOriginIsolated` |
| WASM SIMD    | `WebAssembly.validate(simd_bytecode)`                             |
| WebNN        | `navigator.ml?.createContext`                                     |
| WebGPU       | `navigator.gpu?.requestAdapter()`                                 |
| WebTransport | `typeof WebTransport !== 'undefined'`                             |

### CapabilityDetector の使用例

```typescript
const detector = new CapabilityDetector();
const capabilities = await detector.detect();

if (capabilities.wasmThreads) {
  // マルチスレッド WASM を使用
} else {
  // シングルスレッド版にフォールバック
}
```

---

## 5. FileStorage

**ファイル**: `packages/core/src/storage/FileStorage.ts`

### FileStorage の責務

WASM バイナリや評価関数ファイルの永続化・キャッシュ。

### FileStorage のインターフェース

```typescript
interface IFileStorage {
  get(key: string): Promise<ArrayBuffer | null>;
  set(key: string, data: ArrayBuffer): Promise<void>;
  delete(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
  clear(): Promise<void>;
}
```

### 実装クラス

| クラス             | 優先度         | 特徴                       |
| ------------------ | -------------- | -------------------------- |
| `OPFSStorage`      | 優先           | 高速、ファイルシステム API |
| `IndexedDBStorage` | フォールバック | 広いブラウザサポート       |

### ファクトリ関数

```typescript
async function createFileStorage(
  capabilities: ICapabilities,
): Promise<IFileStorage> {
  if (capabilities.opfs) {
    return new OPFSStorage();
  }
  return new IndexedDBStorage();
}
```

---

## 6. ミドルウェア (IMiddleware)

### フック

| フック      | タイミング     | 用途                 |
| ----------- | -------------- | -------------------- |
| `onCommand` | コマンド送信前 | ロギング、変換       |
| `onInfo`    | 思考状況受信時 | 解析、フィルタリング |
| `onResult`  | 最終結果受信時 | 後処理、記録         |

### ミドルウェアのインターフェース

```typescript
interface IMiddleware<T_INFO = unknown, T_RESULT = unknown> {
  onCommand?(
    command: string | Uint8Array,
    context: IMiddlewareContext,
  ): string | Uint8Array | Promise<string | Uint8Array>;

  onInfo?(info: T_INFO, context: IMiddlewareContext): T_INFO | Promise<T_INFO>;

  onResult?(
    result: T_RESULT,
    context: IMiddlewareContext,
  ): T_RESULT | Promise<T_RESULT>;
}

interface IMiddlewareContext {
  engineId: string;
  adapterName: string;
  timestamp: number;
}
```

### ミドルウェアの使用例

```typescript
// ロギングミドルウェア
bridge.use({
  onCommand: (cmd, ctx) => {
    console.log(`[${ctx.timestamp}] Sending: ${cmd}`);
    return cmd;
  },
  onInfo: (info, ctx) => {
    console.log(`[${ctx.engineId}] Info: depth=${info.depth}`);
    return info;
  },
});

// 解析ミドルウェア
bridge.use({
  onResult: async (result, ctx) => {
    await analytics.track("search_complete", {
      engine: ctx.engineId,
      bestMove: result.bestMove,
    });
    return result;
  },
});
```

---

## 7. 関連ドキュメント

- [ARCHITECTURE_KNOWLEDGE.md](./ARCHITECTURE_KNOWLEDGE.md) - 設計原則
- [../implementation_plans/core-package-implementation.md](../implementation_plans/core-package-implementation.md) - 実装計画書
- [../DECISION_LOG.md](../DECISION_LOG.md) - 意思決定記録
