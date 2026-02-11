# プロジェクト・バックログ (TASKS.md)

## 🏗️ フェーズ 1: コア・フレームワークの実装 (完了)

- [x] **基本型システム**: Branded Types (FEN, Move) の確立。
- [x] **EngineBridge**: アダプター登録とグローバル管理。
- [x] **EngineFacade**: 排他制御と逐次ミドルウェア適用。
- [x] **CapabilityDetector**: 環境診断。
- [x] **FileStorage**: OPFS / IndexedDB ストレージ。
- [x] **EngineLoader**: SRI 必須化と動的 MIME タイプ対応。
- [x] **WorkerCommunicator**: メッセージバッファリングと例外伝播。

---

## 🚀 フェーズ 2: 第1段階リリース (進行中)

- [x] **adapter-stockfish**: jsDelivr 統合と UCI 16.1 対応。
- [x] **UCI Parser**: インジェクション対策済みパーサー。
- [ ] **adapter-yaneuraou**: 将棋エンジンアダプター。
- [ ] **USI Parser**: 将棋用プロトコル実装。
- [ ] **ユニットテスト**: 現状の 31 ケースを維持・拡張。
- [ ] **packages/ui**: エンジン状況可視化コンポーネント。

---

## 🔥 フェーズ 3: 第2段階・究極の最適化 (検討中)

- [ ] **Multi-Runtime Bridge**: Node.js Native / WASM 自動切り替え。
- [ ] **Custom Emscripten Build**: 最適化バイナリ自前配布。
