# プロジェクト・バックログ (TASKS.md)

本ドキュメントは、プロジェクトの現在進行中のタスクおよび将来の計画を管理します。

---

## 🏗️ フェーズ 1: コア・フレームワークの実装 (Week 1-2)

> **ステータス**: 進行中  
> **目的**: 全エンジンの共通基盤となる `@multi-game-engines/core` の完成。

### 1-1: 基本型システムとインターフェース

- [x] `types.ts`: プロジェクト全体のコア型定義 (IEngineAdapterMetadata/State 分離完了)
- [x] `protocols/types.ts`: エンジン通信プロトコルインターフェース
- [ ] `index.ts`: 公開 API の整理

### 1-2: コアロジック実装

- [ ] **EngineBridge**: アダプター管理とミドルウェアチェーン
- [ ] **BaseAdapter**: アダプター共通基盤
- [ ] **EngineFacade**: `IEngine` インターフェースの具象化
- [ ] **CapabilityDetector**: 環境診断 (OPFS, SIMD, Threads)

### 1-3: インフラとストレージ

- [ ] **FileStorage**: OPFS/IndexedDB 抽象化
- [ ] **SRI Validator**: サブリソース整合性チェック
- [ ] **WorkerCommunicator**: 型安全な通信ラッパー

---

## 🚀 フェーズ 2: 第1段階リリース (Stage 1)

> **ステータス**: 計画中  
> **目的**: 既存の npm パッケージと公開 WASM を利用した早期統合。

### 2-1: 業界標準エンジン・アダプター

- [ ] **adapter-stockfish**: jsDelivr/unpkg 経由のロード実装
- [ ] **adapter-yaneuraou**: 既存パッケージ (if exists) または公式 WASM 統合
- [ ] **UCI/USI Parser**: 基本プロトコルのパースロジック完成

### 2-2: ネイティブ・アルゴリズム・アダプター

- [ ] **adapter-gomoku**: `algorithm.ts` 等の既存 JS ロジック統合
- [ ] **adapter-checkers**: `rapid-draughts` 統合
- [ ] **adapter-reversi**: `othello-web-app` 等のロジック統合

---

## 🔥 フェーズ 3: 第2段階・究極の最適化 (Stage 2)

> **ステータス**: 検討中  
> **目的**: 自前ビルドによる業界最高速環境の構築。

### 3-1: ビルドパイプライン

- [ ] **Docker Builder**: Emscripten 環境のコンテナ化
- [ ] **Optimize Build**: SIMD128, Multithreading を有効化した Stockfish 18+ のビルド
- [ ] **Auto-Deploy**: 自前 CDN (Cloudflare R2) への自動配信フロー

### 3-2: 性能検証

- [ ] NPS (Nodes Per Second) ベンチマーク
- [ ] メモリ消費・ロード速度のプロファイリング

---

## 📱 フェーズ 4: モバイル・ネイティブ統合 (Stage 3)

> **ステータス**: 長期目標  
> **目的**: ネイティブプラグイン経由の極限性能提供。

- [ ] **Native Module Interface**: プラグイン通信の標準化
- [ ] **Prototyping**: React Native または Capacitor での Stockfish C++ 呼び出し
- [ ] **Cross-Platform Manager**: 実行環境に応じた最適なアダプターの自動選択

---

## 🛠️ メンテナンスとエコシステム

- [ ] ドキュメントのバイリンガル対応 (JP/EN)
- [ ] サンプルアプリケーション (Showcase) の構築
- [ ] CI/CD パイプライン (lint, test, build) の完成
