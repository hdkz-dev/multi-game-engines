# ADR-043: ResourceInjector Handshake Protocol for Reliable Initialization

## 1. コンテキスト (Context)

Core パッケージの `ResourceInjector` は、Worker 内で外部リソース（WASM等）を動的に注入するために `MG_INJECT_RESOURCES` メッセージを使用しています。
これまではホスト側から一方的にメッセージを送信していましたが、モックエンジン等の軽量な Worker 実装において、リソースの注入完了をホスト側が検知できず、初期化プロセス（UCI/USI ハンドシェイク）がタイムアウトする問題が発生しました。

## 2. 検討されたオプション (Options)

- **オプション A: 固定時間の待機 (Thread.sleep 等)**: 信頼性が低く、パフォーマンスを低下させるため却下。
- **オプション B: 状態ポーリング**: メッセージチャネルを占有し、複雑さが増すため却下。
- **オプション C: ハンドシェイクプロトコルの導入**: Worker がリソース適用を完了した際に `MG_RESOURCES_READY` を返信し、ホスト側がそれを待機する。

## 3. 判断 (Decision)

**オプション C** を採用し、以下のプロトコルを標準化しました。

1. ホストは Worker 作成直後に `MG_INJECT_RESOURCES` を送信する。
2. Worker 内の `ResourceInjector` はリソースを受信・適用後、直ちに `{ type: "MG_RESOURCES_READY" }` を `postMessage` で返信する。
3. ホスト側の `EngineLoader` / `Communicator` は、この返信を受信するまで後続のエンジンコマンド（`uci`, `isready` 等）の送信を保留する。

## 4. 影響 (Consequences)

- **利点**:
  - リソース注入の完了が保証され、モック環境や低速なネットワーク環境での E2E テストの信頼性が大幅に向上した。
  - レースコンディションによる「Message expectation timed out」エラーが解消された。
- **注意点**:
  - 全てのカスタムアダプター/モックエンジンは、この `MG_RESOURCES_READY` 応答を正しく実装する必要がある。
  - `ResourceInjector.staticListen()` を使用している場合は自動的に機能するが、手動実装の場合は明示的な対応が必要。

## 5. ステータス (Status)

- 2026-02-21: 承認及び適用完了。Dashboard (React/Vue) の E2E テストにて実証済み。
