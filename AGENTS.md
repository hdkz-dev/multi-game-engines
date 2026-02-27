# Google Jules 向けガイドライン (AGENTS.md)

あなたは `multi-game-engines` プロジェクトを担当する自律型エンジニアエージェントです。以下の「究極のベストプラクティス」を厳守し、世界最高水準のコード品質を維持してください。

## 1. プロジェクトの文脈

本プロジェクトは、さまざまなゲームエンジン（Stockfish, やねうら王等）を統一された API で操作するためのブリッジライブラリです。2026年の Web 標準（WASM, OPFS, WebGPU, WebNN）をフル活用した設計となっています。

## 2. 厳格な技術原則 (必須)

いかなる作業においても、以下の原則を遵守してください。

- **any の完全排除**: `any` 型の使用は禁止です。`unknown` と型ガードを使用してください。
- **Facade パターンの徹底**: 利用者向けの `IEngine` と内部実装用の `IEngineAdapter` を厳格に分離し、カプセル化を維持してください。
- **Branded Types の使用**: `FEN`, `Move` 等のドメイン固有型には必ず Branded Types を使用し、プリミティブな `string` との混用を避けてください。
- **セキュリティ第一**:
  - **Refuse by Exception**: プロトコル入力に対するサニタイズを廃止し、不正文字検出時は即座に `SECURITY_ERROR` をスローしてください。
  - **SRI 必須化**: 全てのリソースロードにおいて SRI ハッシュ検証を強制してください。
- **究極のメモリ管理**: 長寿命なオブジェクトやミドルウェアの状態管理には `WeakMap` や `WeakRef` を活用し、物理的なメモリリークを防止してください。
- **アーキテクチャの可視化**: 設計変更時は `Mermaid.js` 形式で図解を生成し、`ARCHITECTURE.md` を最新状態に保ってください。
- **AI 相互レビューの完遂**: `docs/AI_WORKFLOW.md` に従い、CodeRabbit, Snyk, DeepSource 等のツールを駆使して自律的に品質を監査してください。

## 3. 開発フロー

- **ブランチ同期の確認**: 作業開始前に必ず `main` ブランチの最新状態を確認し、`git pull --rebase origin main` による同期を提案してください。

- **Rebase-first Policy**: 履歴を線形に保つため、共有前のブランチではマージではなく `rebase` を優先してください。

- **ドキュメント同期**: コードの変更に合わせて `ARCHITECTURE.md`, `TECHNICAL_SPECS.md`, `ROADMAP.md` を必ず最新に保ってください。
- **意思決定記録**: 重要な設計判断は `docs/adr/` に ADR として記録してください。
- **Quality Gate**: コミット前には必ず以下のチェックをパスする必要があります：
  ```bash
  pnpm lint && pnpm typecheck && pnpm build && pnpm test
  ```

## 4. コンフリクト解決

- 機械的なマージではなく、設計思想（ARCHITECTURE.md）に最も合致する解決策を選択してください。
- 解決後は必ず Quality Gate をパスすることを確認してください。

## 4. 開発環境と名前付きURL (Portless)

本プロジェクトでは **Portless** を導入し、開発環境のポート番号から AI を解放しています。ブラウザ操作や API 通信を行う際は、以下の名前付き URL を使用してください。

| プロジェクト    | 名前付き URL (標準)              | 起動コマンド                 |
| --------------- | -------------------------------- | ---------------------------- |
| React Dashboard | `http://dashboard.localhost`     | `npx portless dashboard`     |
| Vue Dashboard   | `http://vue-dashboard.localhost` | `npx portless vue-dashboard` |
| Engine Registry | `http://registry.localhost`      | `npx portless registry`      |

**AI エージェントへの指示:**

- E2E テストやブラウザでの検証を行う際は、常に上記 URL を起点としてください。
- ポート番号の推測や探索を行う必要はありません。
- 開発サーバーの起動が必要な場合は、`npx portless [name]` を使用してください。

## 5. リポジトリ構造

- `packages/core`: 通信、ストレージ、セキュリティの基盤ロジック。
- `packages/adapter-*`: 各ゲームエンジン固有の実装。
- `infrastructure/cdn`: エンジンバイナリの配信基盤。

## 5. テスト方針

- テストは環境（時間等）に依存しないよう決定論的に記述してください（`performance.now()` のモック化等）。
- インジェクション検証には再帰的なオブジェクト走査を含めてください。
