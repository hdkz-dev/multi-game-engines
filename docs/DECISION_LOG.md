# 意思決定ログ (DECISION_LOG.md)

本ドキュメントは、プロジェクトの主要な設計判断を記録した ADR (Architecture Decision Records) へのインデックスです。詳細は各ファイルを参照してください。

---

## 🏗️ 基盤設計 (Architecture)

- [ADR-001: モノレポ構成の採用](adr/001-monorepo-structure.md)
- [ADR-002: Async Iterable によるストリーミング通信](adr/002-async-iterable.md)
- [ADR-014: Core と Adapter の物理的な分離](adr/014-mit-license-architecture.md)
- [ADR-031: 厳格な TypeScript モノレポ構成とプロジェクト参照の導入](adr/031-strict-typescript-monorepo.md)
- [ADR-032: 2026年Q1最新技術スタック (Zenith Tier) への移行](adr/032-zenith-tech-stack-2026.md)

## 📦 リソース管理とセキュリティ (Resources & Security)

- [ADR-015: CDN 選択戦略とフォールバック](adr/015-cdn-selection-strategy.md)
- [ADR-019: EngineLoader によるリソース管理の集約（SRI必須化）](adr/019-engine-loader-centralization.md)

## 🔌 インターフェースと通信 (Interfaces & Protocol)

- [ADR-018: アダプターのメタデータと状態の分離](adr/018-adapter-metadata-state-separation.md)
- [ADR-020: 双方向ミドルウェアと中断時の Promise 挙動](adr/020-bidirectional-middleware.md)
- [ADR-021: 思考状況 (info) のリアルタイム配信インターフェース](adr/021-real-time-info-streaming.md)
- [ADR-022: ミドルウェア追加時のキャッシュ整合性](adr/022-facade-cache-invalidation.md)
- [ADR-023: Worker 通信におけるメッセージバッファリング](adr/023-worker-message-buffering.md)
- [ADR-024: ハンドルベースのライフサイクル管理と共有アダプターの保護](adr/024-handle-based-lifecycle.md)
- [ADR-025: Core とアダプターのドメイン情報の分離 (Pure Domain Info)](adr/025-pure-domain-info.md)
- [ADR-026: プロトコル入力検証の「拒否」への格上げ (Refuse by Exception)](adr/026-refuse-by-exception.md)
- [ADR-030: 構造化スコア情報の統一 (Structured Score Information)](adr/030-structured-score-unification.md)

## 🚀 リリースと統合 (Release & Integration)

- [ADR-016: 段階的なリリース戦略](adr/016-two-stage-release.md)
- [ADR-017: ネイティブブリッジの統合方針](adr/017-native-integration.md)

## 🎨 UI と表現層 (UI & Presentation)

- [ADR-027: UI 層のフレームワーク分離と Reactive Core の導入](adr/027-framework-agnostic-ui.md)
- [ADR-028: Storybook 10 への移行と ESM 専用構成の採用](adr/028-storybook-10-esm-transition.md)
- [ADR-029: Zenith Tier 品質標準の定義](adr/029-zenith-tier-quality-standards.md)
- [ADR-033: フレームワーク非依存の盤面コンポーネント](adr/033-framework-agnostic-boards.md)
- [ADR-034: UI パッケージの完全モジュール化と管理ツールの分離](adr/034-ui-modular-split-and-monitor-separation.md)
- [ADR-035: React 19 におけるカスタム要素とプロパティの統合パターン](adr/035-react-19-custom-elements-integration.md)
