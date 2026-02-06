# @multi-game-engines/adapter-stockfish

multi-game-engines エコシステム用の Stockfish アダプターです。

## 概要

このパッケージは Stockfish チェスエンジンとの通信を可能にする**プロトコルハンドラー**です。

### 疎結合アーキテクチャ

```text
┌─────────────────────────────────────┐
│ adapter-stockfish (MIT)             │
│  └── protocol-handler.ts            │  ← このパッケージ
└──────────────┬──────────────────────┘
               │ 実行時に動的ロード
               ▼
┌─────────────────────────────────────┐
│ stockfish.wasm (GPL-3.0)            │
│  (CDN / 自己ホスト)                 │  ← 外部リソース
└─────────────────────────────────────┘
```

**重要**: このアダプターは Stockfish のバイナリ (WASM) を**含みません**。  
エンジンバイナリは実行時に CDN または自己ホストサーバーから動的にロードされます。

## インストール

```bash
npm install @multi-game-engines/adapter-stockfish
```

## 使用例

```typescript
import { StockfishAdapter } from "@multi-game-engines/adapter-stockfish";

// デフォルト CDN からエンジンをロード
const adapter = new StockfishAdapter();

// または自己ホストを指定
const adapter = new StockfishAdapter({
  sources: {
    wasm: { url: "/engines/stockfish.wasm" },
  },
});
```

## ライセンス

### このアダプター

**MIT License** - このパッケージはプロトコル処理コードのみを含み、Stockfish のソースコードやバイナリは含まれていません。

### Stockfish エンジン

Stockfish 本体は **GPL-3.0** でライセンスされています。  
エンジンバイナリを自己ホストする場合は、GPL-3.0 の条項に従う必要があります。

- [Stockfish License](https://github.com/official-stockfish/Stockfish/blob/master/Copying.txt)
