# PR 15 監査レポート (2026-02-13)

## 概要
プルリクエスト #15 に対するレビューコメントを詳細に分析しました。合計 33 件の指摘があり、セキュリティ、安定性、型安全性に関する重大な項目が含まれています。

## 重大度：高 (Critical / Major) - 直ちに修正が必要

### 1. セキュリティ：コマンドインジェクション脆弱性
- **対象**: `UCIParser`, `USIParser`, `GTPParser`, `EdaxParser` の `createOptionCommand`
- **内容**: `name` および `value` 引数がサニタイズされずにコマンド文字列に結合されている。改行コード (`
`, ``) を含む入力により、不正なコマンドを実行されるリスクがある。
- **対応**: 全てのパーサーで `[
\0;]` を除去またはバリデーションする処理を追加する。

### 2. セキュリティ：プレースホルダー SRI の残存
- **対象**: `MortalAdapter`, `KataGoAdapter` の `sources` 定義
- **内容**: ダミーの SRI ハッシュ (`sha384-DummyHash...`) と `size: 0` が本番コードに残っている。
- **対応**: 本番用のハッシュ値に置き換えるか、開発中である旨の TODO を明記し、バリデーションを強化する。

### 3. 安定性：メッセージリスナーの登録タイミング (Race Condition)
- **対象**: `StockfishAdapter`, `YaneuraOuAdapter`, `KataGoAdapter`, `EdaxAdapter`, `MortalAdapter` の `searchRaw`
- **内容**: `postMessage` でコマンドを送信した**後**に `onMessage` リスナーを登録している。Worker のレスポンスが極めて速い場合、リスナー登録前にメッセージが到着し、取りこぼす可能性がある。
- **対応**: リスナー登録をコマンド送信の**前**に移動する。

### 4. 安定性：Promise の未解決問題 (Memory Leak)
- **対象**: 各アダプターの `cleanupPendingTask`
- **内容**: `reason` なしで呼び出された場合、`pendingReject` が呼ばれずに `null` にされるため、前回の探索 Promise が永遠に settle しない。
- **対応**: `reason` がない場合でもデフォルトの理由で reject するように修正する。

### 5. 型安全性：`unknown` による型情報の消失
- **対象**: `IEngineAdapter.searchRaw` および各実装の引数型
- **内容**: `string | Uint8Array | unknown` のように `unknown` を含めると、ユニオン型全体が `unknown` に簡約され、型チェックが機能しなくなる。
- **対応**: `unknown` を削除し、`Record<string, unknown>` などの具体的な型を使用する。

### 6. 設計：ジェネリクスの順序不一致
- **対象**: `IMiddleware`
- **内容**: `IMiddleware<T_INFO, T_RESULT, T_OPTIONS>` の順序が、プロジェクト標準の `T_OPTIONS, T_INFO, T_RESULT` と異なっている。
- **対応**: ジェネリクスの順序をプロジェクト全体で統一し、呼び出し元を修正する。

## 重大度：中/低 (Medium / Minor) - 修正推奨

### 7. 安定性：ローダーの存在チェック
- **対象**: 各アダプターの `load` メソッド
- **内容**: `loader` 引数が `undefined` になる可能性があるが、チェックせずに `loadResource` を呼んでいる。
- **対応**: 冒頭で `loader` の存在を確認し、なければ `INTERNAL_ERROR` を投げる。

### 8. データ整合性：SGF サニタイズの誤り
- **対象**: `GTPParser`
- **内容**: SGF 文字列からセミコロン (`;`) を除去しているが、SGF においてセミコロンは必須のデリミタである。除去しすぎている。
- **対応**: セミコロンを除去対象から外す。

### 9. ドキュメント：重複した箇条書き番号
- **対象**: `docs/ARCHITECTURE.md`
- **内容**: 「3.」が重複している。

### 10. テスト：モックのクリーンアップ不足
- **対象**: `katago.test.ts`
- **内容**: `mockLoader` がテスト間でリセットされていない。
- **対応**: `beforeEach` で `vi.clearAllMocks()` 等を実行する。

---
## 実行計画
1. `core/src/types.ts` の `IMiddleware` および `IEngineAdapter` の型修正。
2. 各アダプターの `searchRaw` におけるリスナー登録順序と型、`cleanupPendingTask` の修正。
3. 全てのパーサーにおける `createOptionCommand` のサニタイズ実装。
4. `GTPParser` の SGF サニタイズ修正。
5. ドキュメントの微修正。
6. テストの修正と全件パス確認。
