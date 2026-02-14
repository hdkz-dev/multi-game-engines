# AIへの指示事項

## プロジェクトの使命

厳格なライセンス分離を維持しながら、さまざまなゲームエンジンに対して統一された、高度に拡張可能なブリッジを提供すること。

## 技術的優先事項

1. **Abstraction (抽象化)**: Core は `IEngine` インターフェースのみを知るべきであり、実装の詳細（UCI/USI等）には関知しません。
2. **License Isolation (ライセンス分離)**: Core (MIT) と Adapters (GPL等) の境界を厳格に守ります。Core にはエンジン固有のロジックやライセンス制限のあるコードを一切含めないでください。
3. **Type Safety (型安全性)**: ジェネリクスを使用して、エンジン固有の機能へのアクセスを可能にします。`any` 型の使用は禁止です。
4. **Async first (非同期第一)**: エンジンの操作（探索、指し手）は非同期（Promise/AsyncIterable）である必要があります。
5. **WASM & Next-gen API**: WASM (WASI), OPFS, WebGPU 等の最新 Web 標準を積極的に活用します。

## 行動原則 (Operational Principles)

1. **No Unilateral Rule Changes**: プロジェクトの既存の管理ルール（ADR の運用方法、ディレクトリ構造、ドキュメント形式、コーディング規約等）を独断で変更してはいけません。

2. **Proactive Best-Practice Proposals**: 常に最新の技術動向とベストプラクティスを意識してください。既存の慣習よりも優れた手法があると判断した場合は、放置せず、具体的な改善案として積極的に提案してください。

3. **Seek Confirmation**: 改善案の提示や、運用ルールの変更が必要な場合は、必ず理由とメリットを説明し、ユーザーから明示的な承認を得た上で実行してください。

4. **Convention & Evolution**: 既存の慣習を尊重しながらも、承認を得た改善を通じてプロジェクトを常に最新かつ最高品質の状態に保ってください。

## ブランチ同期とコンフリクト解決 (Branch Sync & Conflict Resolution)

1. **Mandatory Sync Check**: どのような作業（コード修正、ドキュメント更新、調査等）を開始する前であっても、必ず `main` ブランチの最新状態を確認してください。未取り込みの変更がある場合は、ユーザーに報告し、同期を提案しなければなりません。

2. **Design-First Resolution**: コンフリクトが発生した場合、単に差分を機械的に統合するのではなく、`ARCHITECTURE.md` に記された設計思想（Facade, Pure Core 等）を唯一の正解基準として解決策を検討・提案してください。

3. **Post-Resolution Verification**: コンフリクト解決後は、必ず自動的に `typecheck` および `test` を実行し、論理的な整合性が維持されていることを物理的に確認してください。

## CLI ツール向け標準コマンド (Standard CLI Commands for AI)

AI エージェントが作業を行う際、以下のコマンドを「品質ゲート」として使用してください。

- **同期確認**: `git fetch origin main && git status`
- **一括検証**: `pnpm run ai:check` (Lint, Typecheck, Build, Test を一括実行)
- **リリース準備**: `pnpm run ai:release` (Changeset の作成)

## エージェント固有の設定ファイル (Agent Config Files)

- **Gemini CLI**: `.gemini/config.yaml`
- **Cursor**: `.cursorrules`
- **Google Jules**: `AGENTS.md`
- **General CLI Agents**: `.clinerules`, `.copilot-instructions`
