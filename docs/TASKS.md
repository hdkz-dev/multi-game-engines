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
- [x] **プロトコルパーサー**: 詰みスコア変換、インジェクション対策、および `startpos` キーワード対応。
- [x] **ユニットテスト**: 計 82 ケースの網羅的検証。
- [x] **品質保証 & 監査**: PR #1〜#13 の全 197 コメントを超深層監査し、ベストプラクティス（Managed Subscriptions, Auto-Revocation, Handle-based Lifecycle）へ昇華。
- [x] **ゼロ・エニーの完遂**: Core, Adapter, Test における `any` の完全排除と `unknown` への移行。
- [x] **PR #18 監査対応**: 再帰的 JSON 検証、テレメトリ統合、テストの疎結合化などの最終洗練。
- [x] **UI 基盤アーキテクチャ**: フレームワーク非依存の `ui-core` と `ui-react` アダプターへの分離。
- [ ] **WASM対応の高度化**: Blob URL 環境下での WASM/NNUE 相対パス解決ロジックの実装（依存性注入パターンの適用）。
- [ ] **UIコンポーネント実装**: 検討窓、評価値グラフ等の具体的な部品化。
- [ ] **デモ**: チェスと将棋のハイブリッド検討ダッシュボード。
- [ ] **API リファレンス**: TypeDoc と TSDoc による、全パッケージの技術ドキュメント自動生成。

---

## 🛠️ 技術的負債・個別課題 (Pending Issues)

- [ ] **adapter-edax**: ダミー SRI ハッシュ (`sha256-dummy`) を本番用バイナリのハッシュ値へ置換。
- [ ] **多言語対応**: `EngineError` の `remediation` 文字列を `locales/` 配下の定義へ移行検討。
- [ ] **テレメトリ拡張**: 長時間稼働時の `DefaultTelemetryMiddleware.startTimes` キャッシュパージ機構の検討。

---

## 🔥 フェーズ 3: 第2段階・究極の最適化 (検討中)

- [ ] **Multi-Runtime Bridge**: 同一アダプターで WASM と OS Native バイナリを自動切替。
- [ ] **Cloud Engine Relay**: 低スペック端末向けに外部 GPU サーバーへ演算を委託。
- [ ] **Engine Registry**: SRI ハッシュとバージョンを中央管理し、URL 指定を不要にする。
- [ ] **巨大 eval-data 配信**: 数百 MB 超の評価関数ファイルを分割ダウンロード・キャッシュ管理。
- [ ] **WebNN / WebGPU**: NNUE や CNN モデルのハードウェア加速の汎用化。
