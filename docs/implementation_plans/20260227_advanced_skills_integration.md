# Implementation Plan: Advanced Development Skills Integration

この計画は、`awesome-claude-skills` で紹介されているような高度な開発スキルを `multi-game-engines` プロジェクトに統合し、開発効率、品質、セキュリティを極大化するためのものです。

## 1. 目的

- 複数エンジンの並列検証・開発を加速させる。
- アーキテクチャ原則（Facade, Type Safety）の自動的な遵守。
- セキュリティ監査（SRI, WASM 隔離）の自律化。

## 2. 統合対象のスキルと施策

### 2.1 Playwright Browser Automation (品質保証)

- **現状**: 基本的な E2E スクリプトは存在するが、網羅性が不足。
- **施策**:
  - `packages/ui-*-monitor` に対する網羅的な E2E テストの追加。
  - 各エンジンアダプター（Stockfish, KataGo 等）の WASM ロード成功/エラーハンドリングの検証自動化。
  - `/playwright-cli` スキルを活用した、視覚的退行テストの導入。

### 2.2 Jules (非同期タスク委託)

- **現状**: 手動での実行のみ。
- **施策**:
  - 重いリファクタリング（例：全パッケージの TSDoc 整備）を `/jules` に委託する標準プロセスの確立。
  - `docs/AI_WORKFLOW.md` への手順追加。

### 2.3 Changelog & Release Automation (リリース管理)

- **現状**: Changesets を導入済み。
- **施策**:
  - `CHANGELOG.md` の生成をコミットメッセージからより詳細に（ADR へのリンク等を含めて）自動生成するスクリプトの作成。
  - GitHub Actions での自動プレリリースの構築。

### 2.4 Subagent-Driven Review (品質管理)

- **現状**: 単一エージェント（私）による実装が主。
- **施策**:
  - `code_reviewer` エージェントを PR 作成前に必ず呼び出すチェックリストの作成。
  - アーキテクチャ原則を厳格にチェックする `architecture_guard` スキルの定義（`.clinerules` 等への反映）。

### 2.5 Security & SRI Auditor (セキュリティ)

- **現状**: `scripts/` に手動スクリプトが存在。
- **施策**:
  - ビルドプロセスに SRI 再計算とレジストリ (`packages/registry`) の自動更新を組み込む。
  - `security_auditor` エージェントによる WASM メモリ管理の定期的な監査。

## 3. マイルストーン

1. **Phase 1**: 統合計画の策定と `TASKS.md` への反映（本日）。
2. **Phase 2**: Playwright E2E の拡充と自動テストパイプラインの強化。
3. **Phase 3**: セキュリティ監査と SRI 更新の完全自動化。
4. **Phase 4**: ドキュメントとワークフロー（Jules/Subagent）の整備。

## 4. 検証計画

- `npm run ai:check` (lint, typecheck, build, test, e2e) が全パッケージでパスすることを確認。
- `CHANGELOG.md` が適切に更新されることを確認。
