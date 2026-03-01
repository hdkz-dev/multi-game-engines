# 外部エンジン統合におけるリスク管理と対策プロンプト集

`multi-game-engines` を統合する際に発生しうる「運用・UX・開発効率」面の懸念事項と、それらを解決するための具体的な対策、および開発 AI への指示プロンプトをまとめました。

---

## 🛰️ リスク 1: ネットワーク不安定時のレジリエンス (Offline/Cache)

**【課題】**
巨大なエンジンアセット（WASM/NNUE）の取得に失敗したり、対局中に切断が発生すると AI が沈黙し、ユーザー体験が著しく低下する。

**【対策案】**

- `Cache Storage API` を活用したアセットの完全永続化。
- ローディング進捗の詳細な通知と、タイムアウト時のエラーハンドリング。

### 🤖 依頼用プロンプト：[Prompt R1] オフライン・キャッシュ戦略の実装

> **Goal**: 巨大なエンジンアセットの可用性を高めるため、`Cache Storage API` による永続化と高度なロード管理を実装してください。
>
> **Requirements**:
>
> 1. `AssetLoader`: Fetch した WASM/NNUE ファイルを `Cache Storage` に保存し、2回目以降はオフラインでも起動可能にすること。
> 2. `Progress API`: ロード中のバイト数、合計サイズ、パーセンテージを `IEngineAdapter` の `on('progress', ...)` イベントで正確に通知すること。
> 3. `Resilient Loading`: ネットワークエラー時に自動リトライ（指数バックオフ）を実行し、最終的に失敗した場合は詳細な `NetworkError` を i18n 準拠で返すこと。
> 4. `multi-board-games` 側の Service Worker と干渉しないよう、独自のキャッシュストレージ名（例：`mge-assets-v1`）を使用せよ。

---

## 🌡️ リスク 2: 端末負荷と熱安定性 (Thermal/Battery)

**【課題】**
強力な思考エンジンは CPU を酷使するため、スマホの発熱、バッテリー急減、サーマルスロットリングによる速度低下を招く。

**【対策案】**

- スレッド数やハッシュサイズの動的制限。
- エンジン側の「沈黙」時間や探索優先度の制御。

### 🤖 依頼用プロンプト：[Prompt R2] リソース制限とパフォーマンス制御

> **Goal**: 実行環境の負荷を制御し、端末の熱暴走やバッテリー消費を抑制するための設定オプションを拡充してください。
>
> **Requirements**:
>
> 1. `ResourceConstraint`: 実行環境の `navigator.hardwareConcurrency` を参照し、デフォルトで使用するスレッド数を「コア数 - 1 or 2」に自動制限するロジックの実装。
> 2. `LowPowerMode`: 解析精度を犠牲にしてでも消費電力を抑える `powerSaving: boolean` オプションの導入。有効時は `Hash` サイズの縮小や、一定秒数以上の思考を強制停止させること。
> 3. `Thread Priority`: Web Worker の `priority` （対応ブラウザのみ）を適切に設定し、UI スレッドへの影響を最小化すること。

---

## 🧪 リスク 3: CI/CD パフォーマンスの低下 (Testing Efficiency)

**【課題】**
テストごとに巨大なアセットをダウンロード・インスタンス化すると、CI（GitHub Actions 等）の実行時間が肥大化する。

**【対策案】**

- 思考ロジックを持たない超軽量な「モックアダプター」の導入。

### 🤖 依頼用プロンプト：[Prompt R3] CI 用ダミーアダプターの提供

> **Goal**: CI 環境や開発中の UI 構築を高速化するため、外部アセットを必要とせずに即座に回答を返す「MockAdapter」をパッケージに含めてください。
>
> **Requirements**:
>
> 1. `MockAdapter`: `IEngineAdapter` インターフェースを完全に満たしつつ、WASM ロードをスキップして即時に `ready` になること。
> 2. `FixedResponse`: `search` 命令に対して、ランダムまたは事前に定義された「合法手」を即座に返すこと。
> 3. `Zero Dependency`: 外部ネットワークアクセスを一切行わず、すべての動作が最小限の JS ファイル内で完結すること。
> 4. `Usage`: テストコードや開発環境で `EngineRegistry.get('mock-chess')` のように簡単に呼び出せるようにすること。

---

## 🛡️ リスク 4: ブラウザのセキュリティ制約と副作用 (COOP/COEP)

**【課題】**
マルチスレッド (SharedArrayBuffer) を有効化するために隔離ヘッダーを設定すると、広告や一部の外部アセットが読み込めなくなる可能性がある。

**【対策案】**

- シングルスレッドモードへのシームレスなフォールバック。
- セキュリティ要件のドキュメント化。

### 🤖 依頼用プロンプト：[Prompt R4] クロスオリジン隔離の互換性強化

> **Goal**: `SharedArrayBuffer` が利用不可能な環境（ヘッダー未設定、一部ブラウザ等）でも、ライブラリがクラッシュせずに動作し続けるための防御的実装を行ってください。
>
> **Requirements**:
>
> 1. `Isolate Check`: インスタンス化前に `typeof SharedArrayBuffer !== 'undefined'` を確認し、使用不可の場合は自動的にエンジンのシングルスレッド版（またはスレッド数 1）を選択すること。
> 2. `Environment Reporting`: `IEngine.getInfo()` にて、現在の実行モード（isolated/multi-thread vs shared/single-thread）を報告できる機能。
> 3. `Integration Manual`: 統合プロジェクト（multi-board-games）のホスティング環境（Cloudflare 等）で設定すべき HTTP ヘッダーの具体例をドキュメントとして提供せよ。
