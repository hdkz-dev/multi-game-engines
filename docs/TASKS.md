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

- [x] **adapter-stockfish**: UCI 16.1 対応とライフサイクルテスト。
- [x] **adapter-yaneuraou**: USI 7.5.0 対応。
- [x] **プロトコルパーサー**: 詰みスコア変換とインジェクション対策。
- [x] **ユニットテスト**: 計 70 ケースの網羅的検証。
- [ ] **packages/ui**: エンジン状況可視化（検討窓）コンポーネント。
- [ ] **デモ**: チェスと将棋のハイブリッド検討ダッシュボード。

---

## 🔥 フェーズ 3: 第2段階・究極の最適化 (検討中)

- [ ] **Multi-Runtime Bridge**: Node.js Native / WASM 自動切り替え。
- [ ] **eval-data 配信**: 巨大な評価関数ファイルの分割ダウンロードと SRI 管理。
- [ ] **WebNN / WebGPU**: NNUE モデルの演算加速。
