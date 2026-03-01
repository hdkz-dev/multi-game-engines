# Multi-Game Engines Bridge

2026年の Web 標準（OPFS, WebNN, WebGPU）をフル活用した、次世代のゲームエンジン・ブリッジライブラリ。

---

## 🌟 特徴 / Features

- **Facade & Adapter Pattern**: エンジンごとの通信詳細を隠蔽し、統一された API でチェスや将棋の AI を操作可能。
- **Unified Score Normalization**: 異種ゲームの評価値を `-1.0 〜 1.0` に統合。UI での汎用表示を実現。
- **Zenith Robustness & High Coverage**: `core` パッケージで **98.41%** のラインカバレッジを達成。ミドルウェア絶縁、循環参照保護、パケット分割耐性を完備。
- **Universal Storage & Flow Control**: Web (OPFS) / Node.js (Local FS) の自動切替と AbortSignal 制御。
- **AI Ensemble 開発**: Gemini, CodeRabbit, DeepSource, Snyk 等の AI ツールが相互に監査を行う自律的品質保証。
- **Modern Security**: SRI 必須化、分割検証 (Segmented SRI)、および「Refuse by Exception」ポリシー。
- **Telemetry & Observability**: パフォーマンス計測やエラー追跡を統一的に行うミドルウェア基盤。
- **High Performance Storage**: OPFS を活用したバイナリの高速永続化キャッシュ。
- **Universal & Federated UI Architecture**:
  - **ui-core**: フレームワーク非依存のビジネスロジック、状態管理、および正規化レイヤー。
  - **i18n Swarm**: 物理的に分離された多言語リソースパッケージ (`i18n-chess`, `i18n-shogi` 等) による極小バンドルサイズ。
  - **ui-react / ui-vue**: 基盤、監視ツール、ゲームUIをモジュール化したフレームワーク専用スイート。
  - **ui-elements**: Lit ベースの Web Components (Ready)。

## 🤖 AI 開発ワークフロー / AI Workflow

本プロジェクトは AI エージェントとの共創を前提として設計されています。詳細は [docs/AI_WORKFLOW.md](./docs/AI_WORKFLOW.md) を参照してください。

- **実装担当**: Gemini CLI (Jules)
- **論理監査**: CodeRabbit
- **静的解析**: DeepSource
- **セキュリティ**: Snyk
- **可視化**: Mermaid.js によるアーキテクチャ自動図解

## 📦 サポート状況 / Support Status

- **Chess**: Stockfish 16.1 (WASM) - **Ready**
- **Shogi**: やねうら王 7.5.0 (WASM) - **Ready**
- **Go**: KataGo (GTP) - **Ready**
- **Xiangqi**: Universal Chinese Chess Interface (UCCI) - **Ready**
- **Janggi**: Universal Janggi Chess Interface (UJCI) - **Ready**
- **Reversi**: Edax 4.4 (Board/Move Protocol) - **Ready**
- **Gomoku**: Renju Solvers (Custom Protocol) - **Ready**
- **Mahjong**: Mortal (JSON Protocol) - **Ready**

## 🚀 クイックスタート / Quick Start

```typescript
import { EngineBridge } from "@multi-game-engines/core";
import { StockfishAdapter } from "@multi-game-engines/adapter-stockfish";
import { createFEN } from "@multi-game-engines/domain-chess";

const bridge = new EngineBridge();
// registerAdapter は非同期メソッドです
await bridge.registerAdapter(new StockfishAdapter());

// アダプターをインポートしていれば、EngineRegistry により型推論が自動的に働きます
const engine = await bridge.getEngine("stockfish");
await engine.load();

// 思考状況の購読 (アダプター固有の型が適用されます)
engine.onInfo((info) => {
  console.log(`Depth: ${info.depth}, Score: ${info.score}`);
});

// 探索の実行 (startpos キーワードもサポート)
const fen = createFEN(
  "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
);
const result = await engine.search({ fen });
console.log(`Best Move: ${result.bestMove}`);
```

## 📖 ドキュメント案内 / Documentation

### Japanese (Primary)

- [設計思想 (ARCHITECTURE.md)](docs/ARCHITECTURE.md)
- [技術仕様 (TECHNICAL_SPECS.md)](docs/TECHNICAL_SPECS.md)
- [管理ルール (PROJECT_MANAGEMENT.md)](docs/PROJECT_MANAGEMENT.md)
- [セキュリティポリシー (SECURITY.md)](SECURITY.md)
- [進行状況 (TASKS.md)](docs/TASKS.md) | [PROGRESS.md](docs/PROGRESS.md)
- [意思決定記録 (DECISION_LOG.md)](docs/DECISION_LOG.md)

### English (Global)

- [Architecture & Design](docs/en/ARCHITECTURE.md)
- [Technical Specifications](docs/en/TECHNICAL_SPECS.md)
- [Contributing Guide](CONTRIBUTING.md) (Bilingual)
- [Security Policy](SECURITY.md)

## 🛡️ セキュリティ / Security

脆弱性の報告については [SECURITY.md](SECURITY.md) をご覧ください。  
Please refer to [SECURITY.md](SECURITY.md) for reporting vulnerabilities.

## 🤝 貢献 / Contributing

詳細は [CONTRIBUTING.md](CONTRIBUTING.md) をご覧ください。
本プロジェクトでは **Husky** と **lint-staged** による厳格なコミット前チェックを導入しており、品質基準を満たさないコードの混入を未然に防いでいます。

## 📄 ライセンス / License

- **Core**: MIT License
- **Adapters**: 各エンジンのライセンスに準拠（例: Stockfish は GPL-3.0-only）
