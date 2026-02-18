# プロジェクト・バックログ (TASKS.md)

## 🏗️ フェーズ 1: コア・フレームワークの実装 (完了)

- [x] **基本型システム**: Branded Types (FEN, Move) の確立。
- [x] **EngineBridge**: アダプター登録とライフサイクル管理 (`dispose`)。
- [x] **EngineFacade**: 排他制御と永続リスナー (`onInfo`)。
- [x] **CapabilityDetector**: SIMD/Threads 検出の検証。
- [x] **FileStorage**: OPFS / IndexedDB ストレージの完全実装。
- [x] **EngineLoader**: SRI 必須化と 30s タイムアウト。
- [x] **WorkerCommunicator**: バッファリングと例外伝播。

---

## 🚀 フェーズ 2: 第1段階リリース (進行中)

- [x] **SECURITY.md**: 非公開報告機能を活用したセキュリティポリシーの策定。
- [x] **adapter-stockfish**: UCI 16.1 対応とライフサイクルテスト。
- [x] **adapter-yaneuraou**: USI 7.5.0 対応。
- [x] **adapter-katago**: GTP プロトコル対応（囲碁エンジン基盤）。
- [x] **プロトコルパーサー**: 詰みスコア変換、インジェクション対策、および `startpos` キーワード対応。
- [x] **ユニットテスト**: 計 121 ケースの網羅的検証。
- [x] **品質保証 & 監査**: PR #1〜#24 を通じた超深層監査の完遂。全 41 スレッド、計 45 指摘事項をすべて解消（Zenith Tier）。
- [x] **ゼロ・エニーの完遂**: プロジェクト全域における `any` / `as any` の完全排除。
- [x] **パース・バリデーションの強化**: `UCIParser`, `USIParser`, `parseFEN`, `parseSFEN` におけるインデックス境界チェックと詳細エラーメッセージの実装完了。
- [x] **UI 基盤アーキテクチャ**: `ui-core` (Logic) と `ui-react` (Presentation) の分離実装。
- [x] **マルチフレームワーク UI**: `ui-vue` (Vue 3) および `ui-elements` (Web Components) の Zenith Tier 実装。
- [x] **多言語対応 (i18n)**: 言語リソースの `packages/i18n` への分離と、全 UI アダプターへの注入。
- [x] **契約駆動 UI**: Zod によるエンジン出力のランタイムバリデーション。
- [x] **楽観的 UI**: `CommandDispatcher` による状態同期の安定化。
- [x] **デザイントークン統一**: CSS Variables によるフレームワーク横断的なテーマ管理。
- [x] **セキュリティポリシー刷新**: SRI 必須化と「Refuse by Exception」の明文化。
- [x] **厳格な型安全性の追求 (Zenith Tier)**: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, および `Project References` の全パッケージ適用。
- [x] **最新技術トレンドの追従 (Modernization)**:
  - [x] Vue 3.5+ `onWatcherCleanup` による副作用管理の最新化。
  - [x] モノレポ全域における `sideEffects` 最適化による Tree-shaking 効率の最大化。
- [x] **WASM対応の高度化**: Blob URL 環境下での WASM/NNUE 相対パス解決ロジックの実装（依存性注入パターンの適用）。
- [x] **UIコンポーネント拡充**: 評価値の時系列グラフの実装。
- [x] **UIコンポーネント拡充**: 思考ログの永続化表示。
  - [x] `requestAnimationFrame` による状態更新のスロットリング実装とユニットテストによる検証 (Performance/Reliability)。
  - [x] ネイティブ HTML `<table>` 要素による完全なセマンティクスとアクセシビリティの確保 (A11y Best Practice)。
  - [x] ユーザー操作を妨げない「スマート・オートスクロール」ロジックの実装 (UX Improvement).
- [x] **Node.js 24 & Turborepo 統合**: モノレポ全体のビルドパイプライン高速化と最新ランタイム環境の確立。
- [x] **デモ**: チェスと将棋のハイブリッド検討ダッシュボード。
  - [x] **Board UI**: 汎用的なボードコンポーネント (`<chess-board>`, `<shogi-board>`) の Web Components 実装。
  - [x] **Real-time Integration**: エンジンの探索状況とボード表示の同期（最善手のハイライト等）。
- [ ] **API リファレンス**: TypeDoc と TSDoc による、全パッケージの技術ドキュメント自動生成。

---

## 🛠️ 技術的負債・個別課題 (Pending Issues)

- [ ] **adapter-edax**: ダミー SRI ハッシュ (`sha256-dummy`) を本番用バイナリのハッシュ値へ置換。
- [ ] **テレメトリ拡張**: UI 上のインタラクション（クリック、ホバー等）の計測ポイント拡充。
- [ ] **UI Logic オフロード (Future)**: 超高頻度 `info` 出力時のメインスレッド保護のため、`ui-core` のロジックを UI Worker へ委譲するアーキテクチャの検討。

---

## 🔥 フェーズ 3: 第2段階・究極の最適化 (検討中)

- [ ] **Multi-Runtime Bridge**: 同一アダプターで WASM と OS Native バイナリを自動切替。
- [ ] **Cloud Engine Relay**: 低スペック端末向けに外部 GPU サーバーへ演算を委託。
- [ ] **Engine Registry**: SRI ハッシュとバージョンを中央管理し、URL 指定を不要にする。
- [ ] **巨大 eval-data 配信**: 数百 MB 超の評価関数ファイルを分割ダウンロード・キャッシュ管理。
- [ ] **WebNN / WebGPU**: NNUE や CNN モデルのハードウェア加速の汎用化。
