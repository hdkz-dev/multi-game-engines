# 実装計画: Phase 3 Swarm & Zenith Consolidation Plan

## 背景

本プロジェクトは Phase 3 に突入しており、高性能なゲームエンジンの統合と、複数のエンジンを高度に協調させる Swarm 思想の導入を目標としています。
`antigravity-swarm` のオーケストレーション技術と、Zenith Tier の最高品質基準（セキュリティ・型安全・パフォーマンス）を融合させ、ブラウザ上で究極の探索体験を実現します。

## 目標

1. **Swarm式協調の深化**: Ensemble Adapter の高度化（戦略の多様化と信頼性向上）。
2. **実バイナリの統合**: 主要エンジンの実 WASM バイナリの配備と SRI ハッシュによる完全なセキュリティ保証。
3. **大容量データ管理**: 数百 MB 規模の評価関数データ（NNUE 等）の分割ダウンロードと OPFS キャッシュ基盤の確立。
4. **ハイブリッド実行**: Node.js/Desktop 環境におけるネイティブバイナリと WASM の自動ハイブリッド切り替え（Multi-Runtime Bridge）。
5. **ハードウェア加速**: WebNN および WebGPU を用いた次世代エンジンのサポート。

## 詳細方針

### 1. Swarm 統合 (Ensemble Adapter)

- **多様な合議戦略**: `MajorityVote` に加え、`BestScore` (評価値ベース), `WeightedAverage` (重み付き平均) を実装。
- **専門性管理**: エンジンごとの「得意局面（手番、駒数等）」に応じた動的な重み付け（Expertise-based Weighting）。
- **非同期ストリーミング**: 複数のエンジンからストリームされる `info` (PV等) を、UI 層で視覚的に比較・統合するための正規化レイヤーの強化。

### 3. Mobile Native Bridge (ADR-041)

- [ ] **Bridge Adapter**: `@multi-game-engines/adapter-mobile-bridge` の初期実装。
- [ ] **Capacitor Plugin Prototype**: iOS/Android 向けネイティブプラグインのサンプル実装。
- [ ] **Native Integration**: ネイティブ側スレッドと `IEngine` ライフサイクルの同期検証。

### 4. Zenith Mobile UI & Monitors (ADR-042)

- [ ] **Mobile Elements**: `@multi-game-engines/ui-mobile-elements` パッケージの新設。
- [ ] **Energy Monitor**: モバイル固有のテレメトリ（バッテリー・温度）の表示機能。
- [ ] **Touch Optimization**: モバイル環境での操作性向上とハプティクス対応。

### 5. Zenith Loader & OPFS (大容量データ配信)

- **分割検証アルゴリズム**: 大容量ファイルをチャンクごとにフェッチし、それぞれの SRI を検証。
- **OPFS 永続化**: ダウンロード済みのバイナリを `OPFSStorage` に保存し、次回起動時を 0ms に。
- **動的プロキシ**: Cloudflare Workers を活用したバイナリ配信と、ユーザーに近いエッジでの整合性チェック。

### 6. Multi-Runtime Bridge

- **環境自動検知**: `CapabilityDetector` を拡張し、`process.versions.node` や `Bun` の存在を検知。
- **ネイティブフォールバック**:
  - ブラウザ環境: WASM Worker を使用。
  - Desktop/Node 環境: `child_process` 経由で OS ネイティブバイナリを実行。
- **透明なインターフェース**: 利用者は実行環境を意識せず、単一の `IEngine` API で最高性能を享受。

### 4. ハードウェア加速 (WebNN/WebGPU)

- **抽象化レイヤー**: `core` パッケージに `IAccelerator` 定義を追加。
- **エンジンの対応**: `adapter-katago` (GPU必須) 等において、WebNN バックエンドを優先的に試行するロジックの実装。

## マイルストーン

### Phase 3.1: Swarm & Security (1-2週)

- [ ] Ensemble Adapter の追加戦略 (`BestScore`, `Weighted`) 実装。
- [ ] 主要アダプター (Stockfish, Edax) の実 SRI ハッシュ確定と CI への組み込み。
- [ ] 英語版ドキュメントの同期。

### Phase 3.2: High Performance (2-3週)

- [ ] `ZenithLoader` 実装 (chunked fetch + OPFS)。
- [ ] `MultiRuntimeBridge` のプロトタイプ。
- [ ] WebNN 能力検出の強化。

### Phase 3.3: Variant Extension (3-4週)

- [ ] 中国将棋 (Xiangqi), チャンギ (Janggi) のアダプター実装。
- [ ] 麻雀 (Mortal) のドメインロジック統合。

## 成功指標

- 全 20 パッケージの `pnpm test` および `typecheck` が 100% 通過すること。
- 大容量データの 2 回目以降のロード時間が OPFS キャッシュにより 100ms 未満になること。
- 全てのバイナリリソースに有効な SRI ハッシュが付与されていること。
