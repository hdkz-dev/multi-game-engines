# Multi-Game Engines Bridge

2026年の Web 標準（OPFS, WebNN, WebGPU）をフル活用した、次世代のゲームエンジン・ブリッジライブラリ。

---

## 🌟 特徴 / Features

- **Facade & Adapter Pattern**: エンジンごとの通信詳細を隠蔽し、統一された API でチェスや将棋の AI を操作可能。
- **Zero-Any Type Safety**: Branded Types とジェネリクスにより、コンパイル時に多くのミスを未然に防止。
- **Modern Security**: 全リソースへの SRI (Subresource Integrity) 必須化と、COOP/COEP 診断機能の統合。
- **Telemetry & Observability**: パフォーマンス計測やエラー追跡を統一的に行うミドルウェア基盤を提供。
- **High Performance Storage**: OPFS (Origin Private File System) を活用した、バイナリの高速永続化キャッシュ。

## 📦 サポート状況 / Support Status

- **Chess**: Stockfish 16.1 (WASM) - **Ready**
- **Shogi**: やねうら王 7.5.0 (WASM) - **Ready**

## 🚀 クイックスタート / Quick Start

```typescript
import { EngineBridge, StockfishAdapter } from "@multi-game-engines/core";

const bridge = new EngineBridge();
bridge.registerAdapter(new StockfishAdapter());

const engine = bridge.getEngine("stockfish");
await engine.load();

// 思考状況の購読
engine.onInfo((info) => {
  console.log(`Depth: ${info.depth}, Score: ${info.score}`);
});

// 探索の実行
const result = await engine.search({ fen: "startpos" });
console.log(`Best Move: ${result.bestMove}`);
```

## 📖 ドキュメント案内 / Documentation

### Japanese (Primary)

- [設計思想 (ARCHITECTURE.md)](docs/ARCHITECTURE.md)
- [技術仕様 (TECHNICAL_SPECS.md)](docs/TECHNICAL_SPECS.md)
- [管理ルール (PROJECT_MANAGEMENT.md)](docs/PROJECT_MANAGEMENT.md)
- [進行状況 (TASKS.md)](docs/TASKS.md) | [PROGRESS.md](docs/PROGRESS.md)
- [意思決定記録 (DECISION_LOG.md)](docs/DECISION_LOG.md)

### English (Global)

- [Architecture & Design](docs/en/ARCHITECTURE.md)
- [Technical Specifications](docs/en/TECHNICAL_SPECS.md)
- [Contributing Guide](CONTRIBUTING.md) (Bilingual)

## 🤝 貢献 / Contributing

詳細は [CONTRIBUTING.md](CONTRIBUTING.md) をご覧ください。

## 📄 ライセンス / License

- **Core**: MIT License
- **Adapters**: 各エンジンのライセンスに準拠（例: Stockfish は GPL-3.0-only）
