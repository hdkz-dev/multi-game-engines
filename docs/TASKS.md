# プロジェクト・バックログ (TASKS.md)

本ドキュメントは、プロジェクトの現在進行中のタスクおよび将来の計画を管理します。

---

## 🏗️ フェーズ 1: コア・フレームワークの実装 (Week 1-2)

> **ステータス**: 完了  
> **目的**: 全エンジンの共通基盤となる `@multi-game-engines/core` の完成。

### 1-1: 基本型システムとインターフェース

- [x] `types.ts`: プロジェクト全体のコア型定義 (IEngineAdapterMetadata/State 分離完了)
- [x] `protocols/types.ts`: エンジン通信プロトコルインターフェース
- [x] `index.ts`: 公開 API の整理

### 1-2: コアロジック実装

- [x] **EngineBridge**: アダプター管理とミドルウェアチェーン
- [x] **BaseAdapter**: アダプター共通基盤
- [x] **EngineFacade**: `IEngine` インターフェースの具象化
- [x] **CapabilityDetector**: 環境診断 (OPFS, SIMD, Threads)

### 1-3: インフラとストレージ

- [x] **FileStorage**: OPFS/IndexedDB 抽象化
- [x] **SRI Validator**: サブリソース整合性チェック
- [x] **WorkerCommunicator**: 型安全な通信ラッパー
- [x] **EngineLoader**: リソース管理とキャッシュの集約

---

## 🚀 フェーズ 2: 第1段階リリース (Stage 1)

> **ステータス**: 進行中  
> **目的**: 既存の npm パッケージと公開 WASM を利用した早期統合。

### 2-1: 業界標準エンジン・アダプター

- [x] **adapter-stockfish**: jsDelivr/unpkg 経由のロード実装
- [ ] **adapter-yaneuraou**: 公式 WASM または shogi-engine 統合
- [x] **UCI/USI Parser**: 基本プロトコルのパースロジック完成

### 2-2: メンテナンスとエコシステム

- [x] **ユニットテスト**: 主要コンポーネントのテストカバレッジ 100%
- [x] **多言語ドキュメント**: 日英バイリンガル対応 (JP/EN)
- [x] **サンプルアプリ**: `examples/simple-chess` による動作確認
- [x] **CI/CD**: GitHub Actions による自動検証

---

## 🔥 フェーズ 3: 第2段階・究極の最適化 (Stage 2)

> **ステータス**: 検討中  
> **目的**: 自前ビルドによる業界最高速環境の構築。

...（以下、将来計画として維持）...
