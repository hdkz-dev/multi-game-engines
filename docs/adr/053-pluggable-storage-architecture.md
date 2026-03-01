# ADR-053: Pluggable Storage Architecture

## 状態

Proposed (提案中)

## コンテキスト

`multi-game-engines` は、Webブラウザ、Node.js/Bun CLI、および Cordova/Capacitor 等のハイブリッドアプリ環境での動作を想定しています。
デフォルトでは OPFS や IndexedDB を使用しますが、ハイブリッドアプリ環境では「ネイティブのファイルシステム領域」にバイナリを保存したいという要求があります。
しかし、ライブラリコアが特定のネイティブプラグインに依存することは、ポータビリティを損なうため避けるべきです。

## 意思決定

ストレージ層を完全に「プラグイン可能（Pluggable）」にします。

1.  **`IFileStorage` インターフェースの活用**: 既存のストレージ抽象化インターフェースを維持します。
2.  **`EngineBridge` への注入**: `EngineBridge` のコンストラクタで `IEngineBridgeOptions` を受け取り、その中の `storage` プロパティを通じて外部から `IFileStorage` インスタンスを注入可能にします。
3.  **優先順位の確立**:
    - 外部から `storage` が注入された場合は、それを最優先で使用します。
    - 注入されない場合は、`createFileStorage` による環境自動検知（OPFS -> IDB -> NodeFS -> Memory）を実行します。

## 影響

- **柔軟性**: Cordova/Capacitor 利用者は、独自のラッパークラスを作成して注入するだけで、ライブラリ本体に手を加えることなくネイティブ領域を利用できます。
- **テスタビリティ**: テスト環境において、物理ファイルシステムを汚染しない `MemoryStorage` や `MockStorage` を容易に注入できるようになります。
- **疎結合**: コアライブラリは、実行環境の具体的なストレージAPI（Filesystemプラグイン等）の詳細を知る必要がなくなります。
