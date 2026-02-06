# L4 エンジン疎結合化・外部プロジェクト移行計画

## 概要
ライセンス上の理由、および再利用性を高めるため、L4 エンジン（Stockfish, ShogiEngine等）を現在の `multi-board-games` プロジェクトから分離し、独立したオープンソースプロジェクトとして再構築します。

## プロジェクト構成の雛形

```text
board-game-engines/
├── .github/workflows/      # 自動ビルド・公開用
├── engines/                # 各ゲームの思考エンジン
│   ├── chess/              # Stockfish (WASM)
│   ├── shogi/              # Shogi68k / LessFish (WASM)
│   ├── checkers/           
│   └── common/             # 共通インターフェース
├── packages/               # npmパッケージとして公開する場合
│   ├── core/               # 通信ブリッジ、型定義
│   └── react-hooks/        # React用フック
├── public/                 # ビルド済みバイナリ/スクリプト配布用
├── scripts/                # WASMコンパイルスクリプト
├── package.json
└── README.md
```

## 新規プロジェクト作成用プロンプト

以下を AI（Cursor, Gemini等）に渡すことで、外部エンジンプロジェクトのベースを生成できます。

---
**Prompt:**
あなたは、ボードゲーム思考エンジンの専門エンジニアです。以下の要件を満たす独立したプロジェクト `board-game-engines` のベース構造を作成してください。

1. **目的**: WebAssembly (WASM) を使用した複数のボードゲームエンジン（将棋、チェス、リバーシ等）を中央管理し、Worker または Web API として提供する。
2. **技術スタック**:
   - TypeScript
   - WebAssembly (Emscripten / Rust)
   - Vite (ビルド/デモ用)
3. **必須機能**:
   - 各エンジンの共通 Worker インターフェース（`EngineMessage` 型定義）。
   - ストリーム形式の回答取得。
   - npm パッケージとしての公開準備（`dist/` への出力）。
4. **構造**:
   - `./engines` 配下に各ゲームごとのディレクトリを作成し、サンプルとしてチェスの Stockfish インターフェースのスケルトンを作成してください。
5. **ライセンス**: GPL-3.0 または MIT (エンジンに依存) を想定。

この構造を、すぐに `npm init` して開発を始められる状態で出力してください。
---

## 連携方法
1. 外部プロジェクトでビルドされた `[game].worker.js` および `.wasm` を CDN (GitHub Pages / JSDelivr等) または npm 経由で取得します。
2. `multi-board-games` 側では、`src/lib/games/[game]/use[Game]AI.ts` の `Worker` インスタンス化パスを、ローカルファイルから外部 URL へ変更します。
