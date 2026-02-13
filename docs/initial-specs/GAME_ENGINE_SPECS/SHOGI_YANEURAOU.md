# 将棋エンジン仕様書: YaneuraOu (やねうら王)

## 1. 概要 (Overview)

**YaneuraOu (やねうら王)** は、世界最強クラスの将棋エンジンであり、USI (Universal Shogi Interface) プロトコルに準拠しています。本プロジェクトでは、NNUE (Efficient Updatable Neural Network) 評価関数を用いたバージョンを採用し、WebAssembly (Wasm) 化してブラウザ上で動作させます。

- **リポジトリ**: [yaneurao/YaneuraOu](https://github.com/yaneurao/YaneuraOu)
- **ライセンス**: GPLv3
- **プロトコル**: USI

## 2. 実装仕様 (Implementation Details)

### 2.1 WebAssembly ビルド

- **コンパイラ**: Emscripten
- **ターゲット**: `YaneuraOu-by-gcc` (または Wasm 向けに調整された Makefile)
- **NNUE対応**: NNUE評価関数を利用するため、`YANEURAOU_EDITION=YANEURAOU_2018_TNU_ENGINE` 等ではなく、NNUE対応のエディション (例: `YANEURAOU_ENGINE_NNUE`) を選択する必要があります。
- **SIMD**: WebAssembly SIMD を有効 (`-msimd128`) にすることで、NNUE の推論速度が大幅に向上します。

### 2.2 ファイル構成

Wasm 環境で実行するために必要なファイル群です。

| ファイル名         | 説明                                                        |
| :----------------- | :---------------------------------------------------------- |
| `yaneuraou.js`     | Emscripten が生成したグルーコード (Web Worker から読み込む) |
| `yaneuraou.wasm`   | コンパイル済みのエンジン本体                                |
| `nn.eval` (任意名) | NNUE評価関数ファイル (数百MB程度になる場合があるため注意)   |
| `book.db` (任意)   | 定石ファイル (Web版では容量削減のため省略または軽量版推奨)  |

### 2.3 評価関数のロード

ブラウザ環境ではファイルシステムへの直接アクセスが制限されるため、Emscripten の `FS` API を使用して、メモリ上の仮想ファイルシステムに評価関数ファイルを配置する必要があります。

```javascript
// Worker 側での初期化例
FS.writeFile("nn.eval", nnueDataBuffer); // nnueDataBuffer は ArrayBuffer
postMessage("usi"); // エンジン起動
```

## 3. USI コマンドシーケンス (Command Sequence)

基本的な通信フローは以下の通りです。

1.  **初期化**:
    - `App -> Engine`: `usi`
    - `Engine -> App`: `id name YaneuraOu ...`
    - `Engine -> App`: `option name ...` (オプション一覧)
    - `Engine -> App`: `usiok`

2.  **準備**:
    - `App -> Engine`: `setoption name EvalFile value nn.eval` (評価関数指定)
    - `App -> Engine`: `setoption name USI_Hash value 128` (メモリ設定)
    - `App -> Engine`: `isready`
    - `Engine -> App`: `readyok`

3.  **対局**:
    - `App -> Engine`: `usinewgame`
    - `App -> Engine`: `position startpos moves 7g7f 3c3d ...` (局面指定)
    - `App -> Engine`: `go btime 30000 wtime 30000 byoyomi 1000` (思考開始)
    - `Engine -> App`: `info depth 10 score cp 50 ...` (思考過程)
    - `Engine -> App`: `bestmove 2g2f` (指し手決定)

## 4. ユーザー設定項目 (User Settings)

ユーザーが設定可能なパラメータ（推奨値）。

| 設定名 (Option Name) | 推奨値 (Web)  | 説明                                                                 |
| :------------------- | :------------ | :------------------------------------------------------------------- |
| **USI_Hash**         | 64 ~ 256 (MB) | 置換表のサイズ。モバイル端末では少なめに設定。                       |
| **Threads**          | 1 (Default)   | スレッド数。`SharedArrayBuffer` が利用可能な環境では多スレッドも可。 |
| **NetworkDelay**     | 0             | 通信遅延シミュレーション。ローカル実行なので 0。                     |
| **BookFile**         | なし/no_book  | 定石ファイルを使用しない場合は指定。                                 |

## 5. 注意事項 (Notes)

- **メモリ消費**: NNUE評価関数は大きいため、ダウンロードとメモリ展開に時間がかかります。進捗バーの表示などが必須です。
- **ブラウザ互換性**: SIMD 対応ブラウザでない場合、動作が極端に遅くなる可能性があります。フォールバック (非SIMD版 Wasm) の用意を検討してください。
