# [実装計画書] Core パッケージの完全実装

> 作成日: 2026-02-06
> ステータス: 計画中

## 1. 目的と概要

設計・準備フェーズが完了し、プロジェクトは「世界最高水準」の型安全性と設計に達しています。
本計画は、`@multi-game-engines/core` パッケージの残りのコンポーネントを実装し、
フェーズ 2 (Stockfish アダプター開発) への移行を可能にすることを目的とします。

### 現状の成果物

- ✅ `types.ts`: 全インターフェースと Branded Types の定義完了
- ✅ `protocols/types.ts`: プロトコルパーサーインターフェースの定義完了
- ⬜ `EngineBridge`: 未実装
- ⬜ `BaseAdapter`: 未実装
- ⬜ `CapabilityDetector`: 未実装
- ⬜ `FileStorage`: 未実装

## 2. 実装スコープと優先順位

### 2.1 必須コンポーネント (Phase 1 完了に必要)

| 優先度 | コンポーネント       | 責務                                                     | 推定工数 |
| ------ | -------------------- | -------------------------------------------------------- | -------- |
| P0     | `EngineBridge`       | アダプター管理、ミドルウェアチェーン、IEngineBridge 実装 | 4h       |
| P0     | `BaseAdapter`        | IEngineAdapter の共通ロジック抽象クラス                  | 3h       |
| P0     | `CapabilityDetector` | 実行環境の機能検知 (OPFS, WebNN 等)                      | 2h       |
| P0     | `FileStorage`        | OPFS/IndexedDB 抽象化層                                  | 4h       |

### 2.2 ユーティリティ (推奨)

| 優先度 | コンポーネント         | 責務                                        | 推定工数 |
| ------ | ---------------------- | ------------------------------------------- | -------- |
| P1     | `SecurityAdvisor`      | COOP/COEP ヘッダー診断、SRI 検証ヘルパー    | 2h       |
| P1     | `WorkerCommunicator`   | WebWorker 通信ラッパー (PostMessage 抽象化) | 2h       |
| P2     | `ResourceOrchestrator` | グローバルスレッド数管理                    | 1h       |

## 3. 詳細設計

### 3.1 EngineBridge

**目的**: エンジンアダプターのライフサイクル管理とミドルウェアパイプラインの提供

**ファイル**: `packages/core/src/bridge/EngineBridge.ts`

```typescript
// === 設計骨子 ===
import {
  IEngineBridge,
  IEngineAdapter,
  IEngine,
  IMiddleware,
  ICapabilities,
  ISecurityStatus,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
} from "../types";

export class EngineBridge implements IEngineBridge {
  private adapters = new Map<
    string,
    IEngineAdapter<unknown, unknown, unknown>
  >();
  private middlewares: IMiddleware<unknown, unknown>[] = [];

  registerAdapter<T_OPTIONS, T_INFO, T_RESULT>(
    adapter: IEngineAdapter<T_OPTIONS, T_INFO, T_RESULT>,
  ): void {
    /* ... */
  }

  getEngine<T_OPTIONS, T_INFO, T_RESULT>(
    id: string,
  ): IEngine<T_OPTIONS, T_INFO, T_RESULT> {
    /* Facade でラップして返す */
  }

  use<T_INFO, T_RESULT>(middleware: IMiddleware<T_INFO, T_RESULT>): void {
    /* ミドルウェアチェーンに追加 */
  }

  async checkCapabilities(): Promise<ICapabilities> {
    /* CapabilityDetector に委譲 */
  }

  getSecurityStatus(): ISecurityStatus {
    /* 診断結果を返す */
  }
}
```

**主要な責務**:

1. アダプターのレジストリ管理
2. `IEngine` Facade の生成・返却
3. ミドルウェアチェーンの構築と実行
4. `CapabilityDetector` / `SecurityAdvisor` との連携

### 3.2 BaseAdapter (抽象クラス)

**目的**: すべてのエンジンアダプターが共有する共通ロジックの提供

**ファイル**: `packages/core/src/adapters/BaseAdapter.ts`

```typescript
// === 設計骨子 ===
export abstract class BaseAdapter<
  T_OPTIONS extends IBaseSearchOptions = IBaseSearchOptions,
  T_INFO extends IBaseSearchInfo = IBaseSearchInfo,
  T_RESULT extends IBaseSearchResult = IBaseSearchResult
> implements IEngineAdapter<T_OPTIONS, T_INFO, T_RESULT> {
  abstract readonly id: string;
  abstract readonly name: string;
  abstract readonly version: string;
  abstract readonly engineLicense: ILicenseInfo;
  abstract readonly adapterLicense: ILicenseInfo;

  protected _status: EngineStatus = 'idle';
  protected _progress: ILoadProgress = { phase: 'not-started', percentage: 0, ... };

  // --- 状態管理 ---
  get status() { return this._status; }
  get progress() { return this._progress; }

  // --- コールバック管理 ---
  private statusListeners = new Set<(s: EngineStatus) => void>();
  onStatusChange(cb: (status: EngineStatus) => void): void { /* ... */ }
  protected emitStatusChange(status: EngineStatus): void { /* ... */ }

  // --- ライフサイクル (サブクラスがオーバーライド) ---
  abstract load(): Promise<void>;
  abstract search(options: T_OPTIONS): ISearchTask<T_INFO, T_RESULT>;
  abstract dispose(): Promise<void>;

  // --- 共通ヘルパー (オプショナル) ---
  async prefetch?(): Promise<void> { /* デフォルトは no-op */ }
}
```

**主要な責務**:

1. `EngineStatus` と `ILoadProgress` の状態管理
2. イベントリスナーの登録・解除・発火
3. サブクラスが実装すべき抽象メソッドの定義
4. 共通のエラーハンドリングやリトライロジック (将来)

### 3.3 CapabilityDetector

**目的**: 実行環境の機能を診断し、最適なストラテジーを選択可能にする

**ファイル**: `packages/core/src/capabilities/CapabilityDetector.ts`

```typescript
// === 設計骨子 ===
export class CapabilityDetector {
  async detect(): Promise<ICapabilities> {
    return {
      opfs: await this.checkOPFS(),
      wasmThreads: this.checkWasmThreads(),
      wasmSimd: this.checkWasmSimd(),
      webNN: this.checkWebNN(),
      webGPU: await this.checkWebGPU(),
      webTransport: this.checkWebTransport(),
    };
  }

  private async checkOPFS(): Promise<boolean> {
    if (typeof navigator === "undefined") return false;
    try {
      const root = await navigator.storage?.getDirectory?.();
      return root !== undefined;
    } catch {
      return false;
    }
  }

  private checkWasmThreads(): boolean {
    return (
      typeof SharedArrayBuffer !== "undefined" && typeof Atomics !== "undefined"
    );
  }

  private checkWasmSimd(): boolean {
    // Feature detection via WebAssembly.validate
    // ...
  }

  // ... 他の検出メソッド
}
```

### 3.4 FileStorage

**目的**: WASM バイナリや評価関数ファイルの永続化・キャッシュ

**ファイル**: `packages/core/src/storage/FileStorage.ts`

```typescript
// === 設計骨子 ===
export interface IFileStorage {
  get(key: string): Promise<ArrayBuffer | null>;
  set(key: string, data: ArrayBuffer): Promise<void>;
  delete(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
  clear(): Promise<void>;
}

export class OPFSStorage implements IFileStorage {
  private root: FileSystemDirectoryHandle | null = null;
  // ...
}

export class IndexedDBStorage implements IFileStorage {
  private dbName = "multi-game-engines";
  private storeName = "files";
  // ...
}

export async function createFileStorage(
  capabilities: ICapabilities,
): Promise<IFileStorage> {
  if (capabilities.opfs) {
    return new OPFSStorage();
  }
  return new IndexedDBStorage();
}
```

**主要な責務**:

1. OPFS 優先、IndexedDB フォールバックの自動切替
2. SRI ハッシュとの照合 (オプショナル)
3. 容量管理 (LRU キャッシュ等、将来)

## 4. ディレクトリ構造 (実装後)

```text
packages/core/src/
├── index.ts              # 公開 API
├── types.ts              # 既存: 全インターフェース
├── protocols/
│   ├── index.ts
│   └── types.ts          # 既存: IProtocolParser
├── bridge/
│   ├── index.ts
│   ├── EngineBridge.ts   # 新規
│   └── EngineFacade.ts   # 新規: IEngine 実装
├── adapters/
│   ├── index.ts
│   └── BaseAdapter.ts    # 新規
├── capabilities/
│   ├── index.ts
│   ├── CapabilityDetector.ts  # 新規
│   └── SecurityAdvisor.ts     # 新規 (P1)
├── storage/
│   ├── index.ts
│   ├── FileStorage.ts    # 新規
│   ├── OPFSStorage.ts    # 新規
│   └── IndexedDBStorage.ts  # 新規
└── workers/
    ├── index.ts
    └── WorkerCommunicator.ts  # 新規 (P1)
```

## 5. 実装順序とマイルストーン

### Sprint 1: 基盤コンポーネント (推定: 1 日)

1. **CapabilityDetector** (2h)
   - [x] 設計完了
   - [ ] 実装
   - [ ] ユニットテスト

2. **FileStorage** (4h)
   - [x] インターフェース設計完了
   - [ ] `IFileStorage` インターフェース
   - [ ] `OPFSStorage` 実装
   - [ ] `IndexedDBStorage` 実装
   - [ ] ファクトリ関数 `createFileStorage`
   - [ ] ユニットテスト

### Sprint 2: コアロジック (推定: 1 日)

1. **BaseAdapter** (3h)
   - [x] 設計完了
   - [ ] 抽象クラス実装
   - [ ] 状態管理・イベント発火
   - [ ] ユニットテスト

2. **EngineBridge** (4h)
   - [x] 設計完了
   - [ ] アダプターレジストリ
   - [ ] `EngineFacade` (IEngine の実装)
   - [ ] ミドルウェアチェーン
   - [ ] ユニットテスト

### Sprint 3: ユーティリティと統合 (推定: 0.5 日)

1. **SecurityAdvisor** (2h)
   - [ ] COOP/COEP ヘッダー診断
   - [ ] SRI 検証ヘルパー

2. **WorkerCommunicator** (2h)
   - [ ] PostMessage 抽象化
   - [ ] 型安全なリクエスト/レスポンス

3. **統合テスト** (1h)
   - [ ] EngineBridge + BaseAdapter の結合テスト

## 6. テスト計画

### 6.1 ユニットテスト

| コンポーネント     | テスト項目                                                  |
| ------------------ | ----------------------------------------------------------- |
| CapabilityDetector | OPFS/WebNN の検出、モック環境でのフォールバック             |
| FileStorage        | CRUD 操作、大容量ファイル (10MB+)、エラー時のフォールバック |
| BaseAdapter        | 状態遷移、イベント発火、異常系 (ロード失敗)                 |
| EngineBridge       | アダプター登録・取得、ミドルウェア実行順序                  |

### 6.2 モック戦略

- **OPFS**: `navigator.storage.getDirectory` をモック
- **WebWorker**: `jest.mock` または `vitest` の `vi.mock`
- **AbortSignal**: タイムアウトシナリオのテスト

### 6.3 E2E テスト (Phase 2 で実施)

- Stockfish WASM のロードと探索完了
- 複数エンジンの並行動作

## 7. 影響範囲

### 7.1 破壊的変更

- なし (新規実装のため)

### 7.2 パフォーマンス考慮事項

- OPFS は IndexedDB より高速だが、ブラウザサポートに依存
- ミドルウェアチェーンは同期 → 非同期の混在を許容 (オーバーヘッド最小化)

### 7.3 セキュリティ考慮事項

- SRI 検証は必須機能として組み込み
- COOP/COEP ヘッダーの欠如時は警告をログ出力

## 8. 対応履歴

| 日付       | 内容                        |
| ---------- | --------------------------- |
| 2026-02-06 | 計画書作成・レビュー開始    |
| (予定)     | Sprint 1 開始               |
| (予定)     | Sprint 2 完了、Phase 1 終了 |

## 9. 次のステップ

1. ✅ 本計画書のレビュー・承認
2. ⬜ TypeScript ビルド環境の最終確認 (`tsconfig.json`, `vitest`/`jest` 設定)
3. ⬜ Sprint 1 開始: `CapabilityDetector` の実装

---

> **注記**: 本計画は ADR (Architecture Decision Records) で確定した設計原則に従っています。
> 実装中に発見された課題は `DECISION_LOG.md` に追記してください。
