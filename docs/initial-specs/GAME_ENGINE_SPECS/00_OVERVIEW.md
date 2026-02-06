# ゲームエンジン仕様書概要 (Game Engine Specifications Overview)

本ドキュメント群は、Webアプリケーション内で動作する高度なゲームAI（L4: Game Engine）の実装・統合に必要な技術仕様をまとめたものです。
各ゲームにおいて「絶対的強さ」を持つ専用エンジンを採用し、WebAssembly (Wasm) + Web Worker 技術を用いてブラウザ上で安全かつ高速に動作させることを目的とします。

## 1. 採用エンジン一覧

| ゲーム (Game) | エンジン (Engine) | プロトコル (Protocol) | ライセンス (License) | 特記事項 |
| :--- | :--- | :--- | :--- | :--- |
| **将棋 (Shogi)** | **YaneuraOu (やねうら王)** | USI (Universal Shogi Interface) | GPLv3 | 世界最強クラスの将棋エンジン。NNUE評価関数を使用。 |
| **チェス (Chess)** | **Stockfish** | UCI (Universal Chess Interface) | GPLv3 | 圧倒的な強さを誇るチェスエンジン。Wasm化実績豊富。 |
| **リバーシ (Reversi)** | **Edax (4.4)** | GGS / NBoard / GTP-like | GPL | リバーシ解析のデファクトスタンダード。ビットボード最適化。 |
| **五目並べ (Gomoku)** | **Rapfi / Yixin (Clone)** | Piskvork Protocol | GPL / MIT | 連珠ルールに対応した強力な探索エンジン。 |
| **チェッカー (Checkers)** | **Scan / Cake** | CheckerBoard Protocol | GPL | エンドゲームDBと連携可能な高精度エンジン。 |
| **コネクト4 (Connect 4)** | **Pascal Pons' Solver** | Standard I/O | MIT | 完全解析済みの強力なソルバー。 |

## 2. 共通アーキテクチャ (Architecture)

### 2.1 Web Worker 隔離パターン (Isolation Pattern)
メインスレッドのUI描画を阻害せず、かつGPL汚染のリスクを最小限に抑えるため、すべてのゲームエンジンは **Web Worker** 内で動作させます。

- **Main Thread**: UIイベント処理、盤面描画。
- **Web Worker**: エンジンのロード、思考ルーチンの実行、USI/UCIコマンドの送受信。
- **Communication**: `postMessage` を使用し、文字列ベースのプロトコル (USI, UCI等) で通信します。

### 2.2 WebAssembly (Wasm) 化
C++等で記述されたエンジンを Emscripten 等を用いて WebAssembly にコンパイルします。
- **SIMD**: 可能であれば SIMD 対応ビルドを使用し、高速化を図ります（ブラウザ互換性に注意）。
- **Multi-threading**: `SharedArrayBuffer` を利用したマルチスレッド対応を検討しますが、まずはシングルスレッド版の安定動作を優先します。
- **File System**: 評価関数ファイルや定石ファイルは、Emscripten の `FS` (Virtual File System) を介して読み込みます。大きなファイルは `IndexedDB` へのキャッシュ推奨。

## 3. ドキュメント構成

各エンジンの詳細仕様は以下のファイルに記載されています。

- **[SHOGI_YANEURAOU.md](./SHOGI_YANEURAOU.md)**: やねうら王 (将棋)
- **[CHESS_STOCKFISH.md](./CHESS_STOCKFISH.md)**: Stockfish (チェス)
- **[REVERSI_EDAX.md](./REVERSI_EDAX.md)**: Edax (リバーシ)
- **[GOMOKU_RAPFI.md](./GOMOKU_RAPFI.md)**: Rapfi (五目並べ)
- **[CHECKERS_SCAN.md](./CHECKERS_SCAN.md)**: Scan (チェッカー)
- **[CONNECT4_SOLVER.md](./CONNECT4_SOLVER.md)**: Solver (コネクト4)

## 4. 開発者向け共通ガイドライン

1.  **プロトコル準拠**: 各エンジンの標準プロトコル (USI, UCI) を遵守し、独自のコマンド拡張は避けること。
2.  **エラーハンドリング**: エンジンがクラッシュした場合や、不正な手が返された場合の再起動・フォールバック処理を実装すること。
3.  **リソース管理**: モバイルデバイスでのバッテリー消費やメモリ圧迫を防ぐため、思考時間やノード数に適切な制限を設けること。
