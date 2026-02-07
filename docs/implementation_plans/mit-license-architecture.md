# [設計提案] 全パッケージ MIT ライセンス化のための疎結合アーキテクチャ

> 作成日: 2026-02-06
> ステータス: 検討中

## 1. 目的

**全てのパッケージ (`core` および全ての `adapter-*`) を MIT ライセンスで提供する**ための設計を提案します。

### 背景

- 現在の設計では、GPL エンジン (Stockfish 等) のアダプターは GPL 感染を懸念していた
- しかし、**アダプターがエンジンのコードを含まない**設計にすれば、アダプター自体は MIT で提供可能
- これにより、ユーザーにライセンスの懸念を完全に感じさせない環境を実現

---

## 2. 基本原則: 「プロトコルハンドラー」としてのアダプター

### 2.1 現在の懸念

```text
┌─────────────────────────────────────┐
│ adapter-stockfish (GPL?)            │
│  ├── stockfish.wasm (GPLコード)     │  ← エンジンを含む = GPL感染
│  └── protocol-handler.ts            │
└─────────────────────────────────────┘
```

### 2.2 新しい設計: 疎結合アーキテクチャ

```text
┌─────────────────────────────────────┐
│ adapter-stockfish (MIT)             │
│  └── protocol-handler.ts            │  ← プロトコル処理のみ = MIT
│      ├── UCI パーサー               │
│      ├── 設定定義                   │
│      └── ローダー設定               │
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

- アダプターは**純粋な TypeScript/JavaScript コード**のみ
- エンジンバイナリ (WASM 等) は**一切含まない**
- アダプターは「エンジンと通信する方法」を知っているが、エンジン自体は含まない
- ブラウザが GPL の JavaScript ライブラリを実行できるのと同じ原理

---

## 3. アダプターの責務 (MIT 範囲)

### 3.1 アダプターが行うこと

| 責務           | 例                                          |
| -------------- | ------------------------------------------- |
| プロトコル解析 | UCI/USI コマンドのパース・生成              |
| 型定義         | `StockfishOptions`, `StockfishInfo` 等      |
| ローダー設定   | WASM の URL、ハッシュ、サイズ等のメタデータ |
| 通信管理       | WebWorker 経由のメッセージング              |
| 状態管理       | ロード進捗、エンジン状態                    |

### 3.2 アダプターが行わないこと

| 責務                          | 理由                 |
| ----------------------------- | -------------------- |
| ❌ WASM バイナリのバンドル    | GPL 感染を避けるため |
| ❌ エンジンソースコードの包含 | 同上                 |
| ❌ エンジン固有の改変コード   | 同上                 |

---

## 4. エンジンバイナリの提供方法 (2段階戦略)

開発スピードと究極の性能を両立するため、バイナリの供給を以下の2段階で計画します。

### Stage 1: クイックスタート (既存リソースの活用)

**目的**: 早期リリースと基本的な動作確認。

- **提供方法**: 信頼できる既存の npm パッケージ (例: `stockfish`) または公開済み WASM バイナリを jsDelivr/unpkg 等のパブリック CDN 経由で利用。
- **アダプターの設計**: アダプターは npm パッケージを `dependency` に持たず、実行時にパブリック CDN からロードするか、ユーザーが配布したファイルを読み込む。

### Stage 2: 究極のパワーと制御 (自前ビルド・配布)

**目的**: 業界最強の検索性能と完全なライセンス・セキュリティ管理。

- **提供方法**: 本プロジェクト用に最適ビルド（SIMD128, Multithreading 等）した WASM バイナリを、自前の配信インフラ (`infrastructure/cdn`) から提供。
- **メリット**: SRI ハッシュの完全管理、Coop/Coep ヘッダーの最適制御、最新エンジンソースの迅速な反映。

### Stage 3: Hybrid/Native Integration (将来の拡張)

**目的**: スマホアプリ等におけるネイティブ性能の提供。

- **提供方法**: React Native / Capacitor 等のプラグイン経由で、OS ネイティブのバイナリ（C++）を実行。
- **メリット**: WASM を超える生の CPU パワーを活用。また、ネイティブプロセスとして実行が完全に分離されるため、ライセンス隔離がさらに物理的に強固となる。

### 4.1 提供プロバイダー一覧

| オプション       | 説明                               | ライセンス責任     |
| ---------------- | ---------------------------------- | ------------------ |
| **CDN 参照**     | 公式 CDN から動的ロード            | CDN 運営者         |
| **自己ホスト**   | ユーザーが自サーバーに配置         | ユーザー           |
| **別パッケージ** | `@engine-binaries/stockfish` (GPL) | バイナリパッケージ |

### 4.2 推奨構成

```typescript
// adapter-stockfish/src/config.ts (MIT)
export const STOCKFISH_CONFIG = {
  name: "Stockfish",
  version: "16.1",
  license: "GPL-3.0",

  // デフォルトのバイナリソース (ユーザーがオーバーライド可能)
  defaultSources: {
    wasm: {
      url: "https://cdn.example.com/stockfish/16.1/stockfish.wasm",
      sri: "sha384-xxxx...",
      size: 5_000_000,
    },
    worker: {
      url: "https://cdn.example.com/stockfish/16.1/stockfish.worker.js",
      sri: "sha384-yyyy...",
    },
  },
};
```

```typescript
// ユーザーのアプリケーション
import { StockfishAdapter } from "@multi-game-engines/adapter-stockfish";

const adapter = new StockfishAdapter({
  // デフォルト CDN を使用
});

// または自己ホストを指定
const adapter = new StockfishAdapter({
  sources: {
    wasm: { url: "/engines/stockfish.wasm" },
  },
});
```

---

## 5. ライセンス表示の仕組み

### 5.1 アダプター内のメタデータ

```typescript
// adapter-stockfish/src/index.ts (MIT)
export class StockfishAdapter extends BaseAdapter<...> {
  readonly id = 'stockfish';
  readonly name = 'Stockfish';
  readonly version = '16.1';

  // エンジンのライセンス (アダプターのライセンスではない)
  readonly engineLicense = 'GPL-3.0';
  readonly engineLicenseUrl = 'https://github.com/official-stockfish/Stockfish/blob/master/Copying.txt';

  // アダプター自体のライセンス
  static readonly adapterLicense = 'MIT';
}
```

### 5.2 IEngineBridge のライセンス情報取得

```typescript
export interface IEngineAdapterMetadata {
  readonly id: string;
  readonly name: string;
  readonly version: string;
  readonly engineLicense: ILicenseInfo;
  readonly adapterLicense: ILicenseInfo;
  readonly sources?: Record<string, IEngineSourceConfig>;
}

// ユーザーはライセンス情報を取得してUIに表示可能
const metadata = bridge.getEngineMetadata("stockfish"); // 内部的に IEngineAdapterMetadata を返す
console.log(`Engine: ${metadata.name} (${metadata.engineLicense.name})`);
console.log(`Adapter: ${metadata.adapterLicense.name}`);
```

---

## 6. 法的根拠

### 6.1 GPL 感染が発生しない理由

1. **アダプターはエンジンコードを含まない**
   - プロトコルパーサーは独自実装 (UCI/USI 仕様に基づく)
   - WASM バイナリは実行時にのみロード

2. **動的リンク vs 静的リンク**
   - アダプターとエンジンは静的にリンクされない
   - 実行時の動的ロードは「別のプログラムを実行」と同等

3. **先例**
   - Web ブラウザ (MIT/Apache) が GPL JavaScript を実行
   - パッケージマネージャー (MIT) が GPL パッケージを管理
   - IDE (MIT) が GPL コンパイラを呼び出す

### 6.2 ユーザーへの影響

| シナリオ                   | ライセンス義務                                                 |
| -------------------------- | -------------------------------------------------------------- |
| Core + Adapter のみ使用    | MIT 条項のみ                                                   |
| エンジン WASM を自己ホスト | エンジンの GPL 条項 (ソース公開等)                             |
| CDN エンジンを利用         | 一般的にはユーザー義務が限定的だが、提供形態・管轄により要確認 |

---

## 7. 実装変更点

### 7.1 Core パッケージ

| 変更                          | 内容                                 |
| ----------------------------- | ------------------------------------ |
| `IEngineAdapterMetadata` 追加 | エンジンとアダプターのライセンス情報 |
| `IEngineSourceConfig` 追加    | WASM/Worker の URL と SRI            |
| ローダー拡張                  | 外部 URL からの動的ロード対応        |

### 7.2 アダプターパッケージ

| 変更                 | 内容                                |
| -------------------- | ----------------------------------- |
| バイナリ除去         | WASM ファイルを含めない             |
| 設定外出し           | デフォルト CDN URL を設定ファイルに |
| ライセンスメタデータ | エンジンライセンス情報を明示        |

### 7.3 新規: バイナリパッケージ (オプション)

```text
@engine-binaries/stockfish (GPL-3.0)
├── stockfish.wasm
├── stockfish.worker.js
└── index.js (URL エクスポート)
```

このパッケージは **オプション** であり、自己ホストや CDN を使う場合は不要。

---

## 8. ディレクトリ構造の変更

```text
packages/
├── core/                        # MIT
│   └── src/
│       ├── types.ts
│       ├── loader/
│       │   ├── RemoteLoader.ts     # 外部 URL からロード
│       │   └── SRIValidator.ts     # ハッシュ検証
│       └── ...
├── adapter-stockfish/           # MIT (バイナリなし)
│   ├── package.json             # "license": "MIT"
│   └── src/
│       ├── index.ts
│       ├── config.ts            # デフォルト CDN URL
│       ├── parser/
│       │   └── UCIParser.ts     # UCI プロトコル解析
│       └── types.ts             # Stockfish 固有の型
├── adapter-yaneuraou/           # MIT (バイナリなし)
│   └── ...
└── protocols/                   # MIT (共通プロトコル)
    └── src/
        ├── uci/                 # UCI プロトコル共通
        └── usi/                 # USI プロトコル共通
```

---

## 9. メリットとトレードオフ

### 9.1 メリット

| メリット                   | 説明                                   |
| -------------------------- | -------------------------------------- |
| ✅ 完全な MIT エコシステム | ユーザーがライセンスを気にする必要なし |
| ✅ 法的リスクの排除        | GPL 感染の懸念が完全に消滅             |
| ✅ 柔軟なデプロイ          | CDN, 自己ホスト, バンドルを選択可能    |
| ✅ アップデート容易        | バイナリ更新がアダプター更新と独立     |

### 9.2 トレードオフ

| トレードオフ               | 対策                                 |
| -------------------------- | ------------------------------------ |
| 初回ロードが遅くなる可能性 | キャッシュ (OPFS/IndexedDB) で軽減   |
| ネットワーク必須           | オフライン対応はキャッシュで実現     |
| CDN 依存                   | 複数ソース設定、自己ホストオプション |

---

## 10. 次のステップ

1. ✅ 本設計提案のレビュー・承認
2. ⬜ `IEngineSourceConfig`, `IEngineAdapterMetadata` の型定義追加 (完了済み)
3. ⬜ `RemoteLoader` の実装
4. ⬜ アダプターテンプレートの更新
5. ⬜ ドキュメント更新 (ARCHITECTURE.md, ナレッジベース)

---

## 11. 結論

**アダプターをプロトコルハンドラーとして設計し、エンジンバイナリを含めないことで、
全てのパッケージを MIT ライセンスで提供できます。**

これにより:

- ユーザーはライセンスを一切気にせずライブラリを使用可能
- GPL エンジンの利用は実行時の動的ロードで実現
- 法的にクリーンな MIT エコシステムを構築
