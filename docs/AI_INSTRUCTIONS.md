# AI Instructions (究極版)

## プロジェクト・ミッション
世界で最も堅牢、かつ柔軟なゲームエンジン・ブリッジを提供し、オープンソース・エンジンの可能性を最大化する。

## 技術的優先事項 (Technical Priorities)
1. **Abstraction (抽象化)**: Core は `IEngine` のみを知り、実装の詳細には関知しない。
2. **Standardization (標準化)**: 独自の実装よりも Web 標準 API (AbortSignal, AsyncIterable 等) を優先。
3. **Efficiency (効率)**: Zero-copy 通信、WebGPU/WebNN によるハードウェア加速。
4. **Safety (安全性)**: Branded Types による型安全、SRI による整合性検証、Capability Detection による実行環境の保護。
5. **Observability (観測可能性)**: 統合ロギングと Performance API によるテレメトリ。
