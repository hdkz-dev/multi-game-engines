# チェスエンジン仕様書: Stockfish

## 1. 概要 (Overview)
**Stockfish** は、世界最強のオープンソースチェスエンジンです。UCI (Universal Chess Interface) プロトコルに準拠しており、JavaScript/WebAssembly への移植版である `stockfish.js` (または `stockfish.wasm`) が広く利用されています。本プロジェクトでもこれを採用します。

- **リポジトリ**: [official-stockfish/Stockfish](https://github.com/official-stockfish/Stockfish)
- **Wasm版**: [nmrugg/stockfish.js](https://github.com/nmrugg/stockfish.js) (推奨)
- **ライセンス**: GPLv3
- **プロトコル**: UCI

## 2. 実装仕様 (Implementation Details)

### 2.1 WebAssembly ビルド
公式の C++ コードを直接ビルドすることも可能ですが、すでに最適化された `stockfish.js` プロジェクトの成果物を利用するのが効率的です。

- **バージョン**: Stockfish 16+ (NNUE搭載)
- **バリアント**:
    - `stockfish.wasm`: 標準的な WebAssembly 版。
    - `stockfish.js`: asm.js 版 (Wasm 非対応環境へのフォールバック用)。
- **NNUE**: 最近の Stockfish は NNUE ネットワークをバイナリに埋め込んでいる場合と、外部ファイルとして読み込む場合があります。Web版では外部ファイル (`.nnue`) として読み込む構成が一般的です。

### 2.2 ファイル構成

| ファイル名 | 説明 |
| :--- | :--- |
| `stockfish.js` | Web Worker ラッパーおよびローダー |
| `stockfish.wasm` | エンジン本体 |
| `nn-xxxx.nnue` | 評価関数ファイル (バージョンに対応したものが必要) |

## 3. UCI コマンドシーケンス (Command Sequence)

基本的な通信フローは以下の通りです。

1.  **初期化**:
    *   `App -> Engine`: `uci`
    *   `Engine -> App`: `id name Stockfish ...`
    *   `Engine -> App`: `option name ...`
    *   `Engine -> App`: `uciok`

2.  **準備**:
    *   `App -> Engine`: `setoption name Hash value 64`
    *   `App -> Engine`: `setoption name Threads value 1`
    *   `App -> Engine`: `isready`
    *   `Engine -> App`: `readyok`

3.  **対局**:
    *   `App -> Engine`: `ucinewgame`
    *   `App -> Engine`: `position startpos moves e2e4 e7e5 ...`
    *   `App -> Engine`: `go wtime 60000 btime 60000` (または `go depth 20`)
    *   `Engine -> App`: `info depth 10 score cp 30 ...`
    *   `Engine -> App`: `bestmove g1f3`

## 4. ユーザー設定項目 (User Settings)

| 設定名 (Option Name) | 推奨値 (Web) | 説明 |
| :--- | :--- | :--- |
| **Hash** | 32 ~ 128 (MB) | ハッシュテーブルサイズ。 |
| **Threads** | 1 | Web Worker 上でのスレッド数。 |
| **MultiPV** | 1 | 読み筋の数。解析モードでは 2~3 に設定すると複数の候補手が表示される。 |
| **Skill Level** | 20 (Max) | 強さの調整 (0-20)。手加減が必要な場合に使用。 |
| **Move Overhead** | 100 (ms) | 通信ラグなどを考慮したバッファ時間。 |

## 5. 特記事項 (Notes)
- **Multi-Variant Stockfish**: 変則チェス（Fairy Chess）をサポートする必要が出た場合、[Fairy-Stockfish](https://github.com/ianfab/Fairy-Stockfish) への差し替えを検討します。プロトコルはUCI互換です。
- **解析モード**: ユーザーが自分の対局を振り返る機能のために、`go infinite` コマンドで永続的に思考させ、`stop` で停止させる制御が必要になる場合があります。
