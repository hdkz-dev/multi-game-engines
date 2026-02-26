# ADR-050: Advanced Development Skills Integration

## Status

Proposed (2026-02-27)

## Context

プロジェクトの規模拡大に伴い、複数の AI エージェント（Jules, Subagents 等）や高度な自動化ツール（Playwright, Changesets）をワークフローに深く統合し、開発の並列性と品質を維持する必要がある。`awesome-claude-skills` で紹介されているベストプラクティスをプロジェクト固有の要件に合わせて適用する。

## Decision

以下の 5 つの柱を中心に、高度な開発スキルを統合する：

1.  **Playwright Browser Automation**: E2E テストの対象を全パッケージのコア機能（並列探索、ロケール切り替え等）に拡大し、自動検証を強化する。
2.  **Jules (Async Engineering)**: 大規模なリファクタリングやカバレッジ向上タスクを非同期エージェントに委託するワークフローを確立する。
3.  **Release Automation**: Changesets を利用し、コミット履歴から詳細なチェンジログを自動生成する。
4.  **Subagent-Driven Review**: 専門エージェント（Code Reviewer, Architecture Guard）による厳格なレビュープロセスを導入する。
5.  **Security & SRI Integration**: ビルドプロセスに SRI（Subresource Integrity）の自動再計算とレジストリ同期を組み込み、セキュリティを自動担保する。

## Consequences

- **Pros**: 開発スピードの向上、品質の安定、セキュリティリスクの低減。
- **Cons**: 初期設定の手間、CI/CD の実行時間の増加。
- **Risks**: エージェントによる誤った修正。これに対しては人間による最終レビュー（リードエンジニア）を必須とする。
