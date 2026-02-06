# チェッカーエンジン仕様書: Scan

## 1. 概要 (Overview)
チェッカー (English Draughts) のエンジンには、**Scan** を採用します。Scan は強力な探索エンジンであり、オープンソースで公開されています。

- **リポジトリ**: [rhalbersma/scan](https://github.com/rhalbersma/scan)
- **ライセンス**: GPLv3
- **プロトコル**: CheckerBoard Protocol / Hub Interface / DXP

## 2. 実装仕様 (Implementation Details)

### 2.1 WebAssembly ビルド
Scan は C++17 で記述されています。Boost ライブラリへの依存がある場合、Emscripten 向けの移植作業（Boost の Wasm ビルドまたは依存排除）が必要になる可能性があります。

### 2.2 エンドゲームデータベース (WLD/MTC)
チェッカーは完全解析されており、エンドゲームデータベース (KingsRow WLD DB 等) を参照することで無敵の強さを発揮しますが、Web版ではデータベースサイズ（数百GB）がネックとなります。
**Web版の方針**: データベースなしの純粋な探索エンジンとして動作させるか、軽量な評価関数のみを使用します。

## 3. CheckerBoard プロトコル (Command Sequence)

CheckerBoard GUI で使用される標準的なプロトコルです。

1.  **起動**:
    *   エンジンは起動後、コマンド入力を待ちます。

2.  **局面設定**:
    *   `App -> Engine`: `setboard [FEN-like string]` (8x8の配置情報)
    *   あるいは `newgame` -> `move ...`

3.  **思考**:
    *   `App -> Engine`: `go` (または `analyze`)
    *   `Engine -> App`: `move [from]-[to]` (例: `move 11-15`)

## 4. ユーザー設定項目 (User Settings)

| 設定名 | 推奨値 | 説明 |
| :--- | :--- | :--- |
| **Hash** | 64 MB | 置換表サイズ。 |
| **Threads** | 1 | スレッド数。 |
| **Search Depth** | 20 | 探索深さ。 |

## 5. 特記事項 (Notes)
- **強制取り (Force Capture)**: チェッカーのルールでは「取れる駒は必ず取らなければならない」という強制ルールがあります。エンジンはこのルールに厳密に従いますが、UI側でもユーザーの着手を制限する必要があります。
- **代替案**: Scan のビルドが困難な場合、**Cake** (KingsRow の作者による別エンジン) や、JavaScript で実装された軽量エンジン (例: **Guillotine** の移植) も検討候補となります。
