# プロジェクト進捗状況 (PROGRESS.md)

## 📅 更新日: 2026年2月11日

## 🏆 直近の到達ハイライト
- **コア・フレームワークの完成**: `EngineBridge`, `EngineFacade`, `EngineLoader` を含む統合基盤が完成。
- **Stockfish アダプターの統合**: WASM版 Stockfish 16.1 との UCI 通信、リアルタイム思考配信を実現。
- **ベストプラクティスの確立**: SRI (Subresource Integrity) 必須化、AbortSignal による完全な中断制御、Zero-Any 型安全性を達成。
- **CI/CD パイプラインの正常化**: GitHub Actions による Lint/Build/Test (32ケース) の自動検証が成功。

---

## 📈 現在のフェーズ: フェーズ 2 (Stage 1) - 進行中

### フェーズ 1: コア・フレームワークの実装 (完了)
- [x] **型システム**: Branded Types (FEN, Move) による堅牢な設計。
- [x] **EngineBridge**: アダプター登録、ミドルウェアチェーン、グローバルイベントバブリング。
- [x] **EngineFacade**: `IEngine` インターフェースによる実装隠蔽と排他制御。
- [x] **EngineLoader**: SRI 検証付きリソースロード、OPFS キャッシュ、動的 MIME type 処理。
- [x] **WorkerCommunicator**: タイムアウト、AbortSignal、エラー伝播を備えた型安全通信。
- [x] **ストレージ**: OPFS (Primary) と IndexedDB (Fallback) の自動切り替え。

### フェーズ 2: 第1段階リリース (進行中)
- [x] **Stockfish 統合**: jsDelivr 経由の WASM ロードと UCI プロトコル実装。
- [x] **UCI Parser**: コマンドインジェクション対策済みの堅牢なパースロジック。
- [x] **品質保証**: 主要コンポーネントに対する 100% のテストカバレッジ。
- [ ] **やねうら王統合**: USI プロトコル対応と将棋エンジンアダプターの着手。
- [ ] **UI プロトタイプ**: `packages/ui` での基本コンポーネント作成。

---

## 📝 意思決定の要約 (ADR 抜粋)
- **ADR-019 (EngineLoader)**: セキュリティ担保のため、全てのエンジンリソースに対し SRI ハッシュを必須とする。
- **ADR-020 (AbortSignal)**: 探索中断時は単なる停止だけでなく、呼び出し元の Promise を即座に reject し、標準的な Web API 挙動に合わせる。
- **ADR-021 (Facade Caching)**: ミドルウェアの整合性を保つため、`EngineBridge.use()` 実行時に既存の Facade キャッシュをクリアする。

## 🚀 次のステップ
1. `adapter-yaneuraou` の設計と USI パーサーの実装。
2. 思考状況（info）を可視化するデバッグ用 UI の構築。
