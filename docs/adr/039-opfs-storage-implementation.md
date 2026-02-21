# ADR 039: OPFS Storage Implementation for High Performance Binary Caching

## ステータス

提案中 (Proposing)

## コンテキスト

現在、`multi-game-engines` ではエンジンの WASM バイナリや評価関数データ（NNUE 等）をキャッシュするために `IFileStorage` インターフェースを定義していますが、`OPFSStorage` 実装はスタブの状態です。
2026年現在、Origin Private File System (OPFS) は主要なブラウザで広くサポートされており、従来の IndexedDB に比べてバイナリデータの読み書きにおいて大幅なパフォーマンス向上が期待できます。特に数百MBに及ぶ評価関数データのキャッシュにおいて、OPFS の利用はクリティカルです。

## 意思決定

`OPFSStorage` クラスを `FileSystemHandle` API を用いて本番実装します。

1. **非意義性 API の採用**: メインスレッドおよび Worker の両方から利用可能にするため、非同期の `navigator.storage.getDirectory()` および `getFileHandle()` を使用します。
2. **ディレクトリ構造**: `/cache` ディレクトリをルートに作成し、エンジン ID やリソースハッシュをキーとしたフラットなファイル構造を採用します。
3. **ストリーミング書き込み**: `createWritable()` を使用し、大きなバイナリデータの書き込み時にメモリ負荷を最小限に抑えます（将来的な Web 拡張を見据えて Chunk 処理を考慮）。
4. **例外ハンドリング**: OPFS が利用不可能な環境（クォータ不足、セキュリティ制限等）では、上位の `createFileStorage` により `IndexedDBStorage` へ自動フォールバックされる設計を維持します。
5. **一貫性**: `IFileStorage` インターフェースを遵守し、`get`, `set`, `delete`, `has`, `clear` を実装します。

## 影響

- **パフォーマンス**: 大容量バイナリのロード時間が改善され、ブラウザのメモリプレッシャーが軽減されます。
- **堅牢性**: OPFS 特有のエラー（ロック競合など）に対する適切なリトライまたはエラー通知が必要になります。
- **デバッグ**: ブラウザの DevTools (Application タブ) でのファイル確認が可能になります。

## コンプライアンス

- **SRI**: キャッシュから読み出されたデータに対しても、必ず上位層で SRI ハッシュの再検証を行うことを必須とします。
- **セキュリティ**: 同一オリジンポリシーに従い、ドメイン間でのファイル漏洩がないことを保証します。
