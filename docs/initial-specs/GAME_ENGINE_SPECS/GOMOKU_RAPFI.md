# 五目並べエンジン仕様書: Rapfi (Renju Solver)

## 1. 概要 (Overview)
五目並べ（連珠）のエンジンには、**Rapfi** (または互換性のある Piskvork プロトコル準拠エンジン) を採用します。Rapfi は強力な探索能力を持ち、連珠ルール（黒番の禁じ手）に完全対応しています。

- **エンジン候補**: Rapfi, Yixin (Closed), SlowRenju (OSS)
- **推奨**: **Rapfi** (オープンソース版があれば) または **SlowRenju** (完全OSS)
    - ※ Rapfi の最新版はクローズドな場合があるため、Wasm化には **SlowRenju** や **Piskvork** のサンプルAIをベースにした最適化版、あるいは **YaneuraOu の Gomoku 拡張** が現実的な選択肢となります。ここでは標準的なプロトコル仕様として Piskvork プロトコルを定義します。
- **プロトコル**: Piskvork Protocol (Gomoku AI の標準)

## 2. 実装仕様 (Implementation Details)

### 2.1 WebAssembly ビルド
Piskvork プロトコル準拠のエンジン（C++製）を Emscripten でビルドします。

- **ターゲット**: エンジンの `main` ループ（`pipe` 入力を待つ部分）を Web Worker のメッセージハンドラに置き換えます。
- **ルール対応**: 連珠 (Renju)、自由打ち (Freestyle)、スタンダード (Standard) のルール切り替えオプションが必要です。

### 2.2 ファイル構成

| ファイル名 | 説明 |
| :--- | :--- |
| `gomoku_engine.js` | Worker ラッパー |
| `gomoku_engine.wasm` | エンジン本体 |
| `config.toml` (任意) | 設定ファイル |

## 3. Piskvork プロトコル (Command Sequence)

Piskvork プロトコルは、五目並べAIコンテスト (Gomocup) で使用される標準プロトコルです。

1.  **初期化**:
    *   `App -> Engine`: `START [size]` (例: `START 15`)
    *   `Engine -> App`: `OK`

2.  **対局情報**:
    *   `App -> Engine`: `INFO timeout_match 180000` (持ち時間 ms)
    *   `App -> Engine`: `INFO time_left 60000` (残り時間)
    *   `App -> Engine`: `INFO rule 1` (0:Simple, 1:Renju)

3.  **着手要求**:
    *   `App -> Engine`: `BOARD`
    *   `App -> Engine`: `7,7,1` (x,y,color - 1:Own, 2:Opp)
    *   `App -> Engine`: `...`
    *   `App -> Engine`: `DONE`
    *   `Engine -> App`: `8,8` (x, y) - エンジンの着手

4.  **単一手入力 (Turn-based)**:
    *   `App -> Engine`: `TURN 8,8` (相手が 8,8 に打った、次は自分の番)
    *   `Engine -> App`: `9,9`

## 4. ユーザー設定項目 (User Settings)

| 設定名 | 推奨値 | 説明 |
| :--- | :--- | :--- |
| **Threads** | 1 | 探索スレッド数。 |
| **Hash** | 128 MB | 置換表サイズ。 |
| **Rule** | Renju (連珠) | ルール設定。Standard (禁じ手なし) も選択可能にする。 |
| **Level/Time** | 5s / move | 思考時間制限。 |

## 5. 注意事項 (Notes)
- **座標系**: Piskvork プロトコルは 0-indexed または 1-indexed の実装揺れがあるため、採用するエンジンの仕様を厳密に確認してください（通常は 0,0 が左上）。
- **禁じ手判定**: エンジン側で禁じ手を打たないロジックは当然含まれますが、UI側でも禁じ手ガイドを表示するために、エンジンの `FORBIDDEN` コマンド（もしあれば）や、別途判定ライブラリ (`renju-logic` 等) の併用が望ましいです。
