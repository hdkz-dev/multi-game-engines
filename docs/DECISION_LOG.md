# 意思決定ログ (DECISION_LOG.md)

本ドキュメントは、プロジェクトの主要な設計判断を記録した ADR (Architecture Decision Records) へのインデックスです。詳細は各ファイルを参照してください。

> **注記 (2026-02-19)**: ADR-003〜013 は、プロジェクト初期の設計検討フェーズにおいて採番されましたが、後続の設計統合（ADR-014〜026 等）により内容が吸収・廃止されたため、現在は欠番となっています。番号の再利用は行わず、履歴として保持します。

---

## 🏗️ 基盤設計 (Architecture)

- [ADR-001: モノレポ構成の採用](./adr/001-monorepo-structure.md) (Accepted - 2026-01-28)
- [ADR-002: Async Iterable によるストリーミング通信](./adr/002-async-iterable.md) (Accepted - 2026-01-29)
- [ADR-014: Core と Adapter の物理的な分離](./adr/014-mit-license-architecture.md) (Accepted - 2026-02-10)
- [ADR-031: 厳格な TypeScript モノレポ構成とプロジェクト参照の導入](./adr/031-strict-typescript-monorepo.md) (Accepted - 2026-02-18)
- [ADR-032: 2026年Q1最新技術スタック (Zenith Tier) への移行](./adr/032-zenith-tech-stack-2026.md) (Accepted - 2026-02-18)
- [ADR-040: Ensemble Adapter Architecture](./adr/040-ensemble-adapter-architecture.md) (Proposed - 2026-02-21)
- [ADR-041: Mobile Native Bridge Architecture](./adr/041-mobile-native-bridge-architecture.md) (Proposed - 2026-02-21)
- [ADR-046: Standardization of Directory Structures and Naming Conventions](./adr/046-structure-standardization.md) (Completed - 2026-02-23)

## 📦 リソース管理とセキュリティ (Resources & Security)

- [ADR-015: CDN 選択戦略とフォールバック](./adr/015-cdn-selection-strategy.md) (Accepted - 2026-02-11)
- [ADR-019: EngineLoader によるリソース管理の集約（SRI必須化）](./adr/019-engine-loader-centralization.md) (Accepted - 2026-02-13)
- [ADR-038: プライバシー保護のためのログ・サニタイズポリシー (Privacy-First Logging)](./adr/038-privacy-first-logging.md) (Accepted - 2026-02-20)
- [ADR-039: OPFS Storage Implementation](./adr/039-opfs-storage-implementation.md) (Completed - 2026-02-21)
- [ADR-043: ResourceInjector Handshake Protocol for Reliable Initialization](./adr/043-resource-injector-handshake.md) (Completed - 2026-02-21)
- [ADR-044: ESLint v9 ピン留めとモノレポ設定の安定化](./adr/044-eslint-v9-pinning.md) (Completed - 2026-02-23)

## 🔌 インターフェースと通信 (Interfaces & Protocol)

- [ADR-018: アダプターのメタデータと状態の分離](./adr/018-adapter-metadata-state-separation.md) (Accepted - 2026-02-12)
- [ADR-020: 双方向ミドルウェアと中断時の Promise 挙動](./adr/020-bidirectional-middleware.md) (Accepted - 2026-02-14)
- [ADR-021: 思考状況 (info) のリアルタイム配信インターフェース](./adr/021-real-time-info-streaming.md) (Accepted - 2026-02-14)
- [ADR-022: ミドルウェア追加時のキャッシュ整合性](./adr/022-facade-cache-invalidation.md) (Accepted - 2026-02-15)
- [ADR-023: Worker 通信におけるメッセージバッファリング](./adr/023-worker-message-buffering.md) (Accepted - 2026-02-15)
- [ADR-024: ハンドルベースのライフサイクル管理と共有アダプターの保護](./adr/024-handle-based-lifecycle.md) (Accepted - 2026-02-16)
- [ADR-025: Core とアダプターのドメイン情報の分離 (Pure Domain Info)](./adr/025-pure-domain-info.md) (Accepted - 2026-02-16)
- [ADR-026: プロトコル入力検証の「拒否」への格上げ (Refuse by Exception)](./adr/026-refuse-by-exception.md) (Accepted - 2026-02-17)
- [ADR-030: 構造化スコア情報の統一 (Structured Score Information)](./adr/030-structured-score-unification.md) (Accepted - 2026-02-18)

## 🚀 リリースと統合 (Release & Integration)

- [ADR-016: 段階的なリリース戦略](./adr/016-two-stage-release.md) (Accepted - 2026-02-11)
- [ADR-017: ネイティブブリッジの統合方針](./adr/017-native-integration.md) (Accepted - 2026-02-12)
- [ADR-045: Absolute Zenith Quality Audit の完遂と整合性同期](./adr/045-absolute-zenith-audit.md) (Completed - 2026-02-23)

## 🎨 UI と表現層 (UI & Presentation)

- [ADR-027: UI 層のフレームワーク分離と Reactive Core の導入](./adr/027-framework-agnostic-ui.md) (Accepted - 2026-02-17)
- [ADR-028: Storybook 10 への移行と ESM 専用構成の採用](./adr/028-storybook-10-esm-transition.md) (Accepted - 2026-02-17)
- [ADR-029: Zenith Tier 品質標準の定義](./adr/029-zenith-tier-quality-standards.md) (Accepted - 2026-02-18)
- [ADR-033: フレームワーク非依存の盤面コンポーネント](./adr/033-framework-agnostic-boards.md) (Accepted - 2026-02-19)
- [ADR-034: UI パッケージの完全モジュール化と管理ツールの分離](./adr/034-ui-modular-split-and-monitor-separation.md) (Accepted - 2026-02-19)
- [ADR-035: React 19 におけるカスタム要素とプロパティの統合パターン](./adr/035-react-19-custom-elements-integration.md) (Accepted - 2026-02-19)
- [ADR-036: Zenith Tier PR 監査とモノレポ全域の厳格な型安全性の再適用](./adr/036-zenith-audit-and-strict-types.md) (Accepted - 2026-02-20)
- [ADR-037: Core とドメイン（Chess/Shogi等）の物理的隔離とライフサイクル堅牢化](./adr/037-core-domain-isolation-and-lifecycle-hardening.md) (Accepted - 2026-02-20)
- [ADR-042: Mobile UI and Monitor Design Standard](./adr/042-mobile-ui-and-monitor-design.md) (Proposed - 2026-02-21)
