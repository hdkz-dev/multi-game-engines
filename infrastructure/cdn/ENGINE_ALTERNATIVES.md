# ゲームエンジン代替候補調査

> 作成日: 2026-02-06
> 更新日: 2026-02-06

## 📋 概要

本ドキュメントは [docs/initial-specs/GAME_ENGINE_SPECS/](../../docs/initial-specs/GAME_ENGINE_SPECS/) で定義された
推奨エンジンに対する代替候補を調査・整理したものです。

**調査対象:**

- 公開パッケージの有無
- CDN 配信の準備要否
- 各種公開パッケージの更新頻度
- WASM としてのビルド実績

---

## 📦 npm パッケージ総合サマリー

### ✅ 即時利用可能なパッケージ

| パッケージ名           | ゲーム     | バージョン    | 最終更新 | 週間DL | ライセンス | CDN準備 |
| ---------------------- | ---------- | ------------- | -------- | ------ | ---------- | ------- |
| `stockfish`            | チェス     | 17.1.0        | 2024-11  | 7,883  | GPL-3.0    | ✅ 不要 |
| `rapid-draughts`       | チェッカー | 1.0.6         | 2023-01  | 15     | MIT        | ✅ 不要 |
| `connect-four-ai-wasm` | コネクト4  | 1.0.0         | 2025-08  | 3      | MIT        | ✅ 不要 |
| `@mizarjp/yaneuraou.*` | 将棋       | 7.6.3-alpha.0 | 2022     | 11     | GPL-3.0    | ✅ 不要 |
| `@algorithm.ts/gomoku` | 五目並べ   | 4.0.4         | 2024     | 9      | MIT        | ✅ 不要 |
| `draughts`             | チェッカー | 0.2.1         | 2025-08  | 11     | MPL-2.0    | ✅ 不要 |

### ⚠️ CDN 準備が必要なエンジン

| エンジン | ゲーム     | ビルド難易度 | 備考                                          |
| -------- | ---------- | ------------ | --------------------------------------------- |
| Edax     | リバーシ   | 中           | Emscripten ビルド、eval.dat/book.dat 配信必要 |
| Rapfi    | 五目並べ   | 中           | Emscripten ビルド、Piskvork プロトコル        |
| Scan     | チェッカー | 高           | Boost 依存、エンドゲームDB 大容量             |

---

## 🎯 選定基準

| 優先度 | 基準                                          |
| ------ | --------------------------------------------- |
| 🥇     | **WASM 対応済み** - すぐに利用可能            |
| 🥈     | **MIT/Apache ライセンス** - GPL 汚染なし      |
| 🥉     | **アクティブメンテナンス** - 2024年以降に更新 |
| ⭐     | **npm パッケージ公開** - CDN 配信が容易       |

---

## ♟️ チェス (Chess)

### 推奨: Stockfish

| 項目           | 内容                                                                            |
| -------------- | ------------------------------------------------------------------------------- |
| **リポジトリ** | [official-stockfish/Stockfish](https://github.com/official-stockfish/Stockfish) |
| **WASM 版**    | [nmrugg/stockfish.js](https://github.com/nmrugg/stockfish.js)                   |
| **npm**        | `stockfish@17.1.0` (週間 7,883 DL)                                              |
| **ライセンス** | GPL-3.0                                                                         |
| **プロトコル** | UCI                                                                             |

### チェス代替候補

#### 1. Fairy-Stockfish

| 項目           | 内容                                                                                  |
| -------------- | ------------------------------------------------------------------------------------- |
| **リポジトリ** | [fairy-stockfish/Fairy-Stockfish](https://github.com/fairy-stockfish/Fairy-Stockfish) |
| **特徴**       | 変則チェス対応 (Chess960, Crazyhouse, Shogi, Xiangqi 等)                              |
| **WASM**       | ✅ 利用可能 ([fairyground.github.io](https://fairyground.github.io/))                 |
| **ライセンス** | GPL-3.0                                                                               |
| **推奨用途**   | 変則チェスのサポートが必要な場合                                                      |

#### 2. Leela Chess Zero (LC0)

| 項目           | 内容                                                                 |
| -------------- | -------------------------------------------------------------------- |
| **リポジトリ** | [LeelaChessZero/lc0](https://github.com/LeelaChessZero/lc0)          |
| **特徴**       | AlphaZero スタイル、ニューラルネットワークベース                     |
| **WASM**       | ✅ TensorFlow.js 経由 ([lc0-js](https://github.com/nicklash/lc0-js)) |
| **ライセンス** | GPL-3.0                                                              |
| **推奨用途**   | 人間らしい着手スタイルが求められる場合                               |

---

## 🎌 将棋 (Shogi)

### 推奨: YaneuraOu

| 項目           | 内容                                                                 |
| -------------- | -------------------------------------------------------------------- |
| **リポジトリ** | [yaneurao/YaneuraOu](https://github.com/yaneurao/YaneuraOu)          |
| **WASM 版**    | [mizar/YaneuraOu-wasm](https://github.com/mizar/YaneuraOu)           |
| **npm**        | `@mizarjp/yaneuraou.halfkp.noeval@7.6.3-alpha.0` (週間 11 DL)        |
| **ライセンス** | GPL-3.0                                                              |
| **プロトコル** | USI                                                                  |
| **最終更新**   | 2022年 (alpha版)                                                     |
| **備考**       | Lishogi で使用実績あり、複数バリアント公開 (halfkp, k-p, material等) |

### 将棋代替候補

#### 1. Suisho5

| 項目           | 内容                                  |
| -------------- | ------------------------------------- |
| **特徴**       | YaneuraOu ベース + 専用 NNUE 評価関数 |
| **WASM**       | ✅ (YaneuraOu 派生として利用可)       |
| **ライセンス** | GPL-3.0                               |
| **推奨用途**   | 最強クラスの評価関数が必要な場合      |

#### 2. Lesserkai

| 項目           | 内容                                                                       |
| -------------- | -------------------------------------------------------------------------- |
| **リポジトリ** | [johncheetham/lesserkai](https://www.johncheetham.com/projects/lesserkai/) |
| **特徴**       | 軽量 USI エンジン                                                          |
| **WASM**       | ⚠️ 要ビルド                                                                |
| **ライセンス** | OSS                                                                        |
| **推奨用途**   | リソース制限が厳しいモバイル環境                                           |

#### 3. Apery

| 項目           | 内容                                                          |
| -------------- | ------------------------------------------------------------- |
| **リポジトリ** | [HiraokaTakuya/apery](https://github.com/HiraokaTakuya/apery) |
| **特徴**       | 高速探索                                                      |
| **WASM**       | ⚠️ 要ビルド                                                   |
| **ライセンス** | GPL-3.0                                                       |

---

## ⚫ リバーシ / オセロ (Reversi / Othello)

### 推奨: Edax

| 項目           | 内容                                                          |
| -------------- | ------------------------------------------------------------- |
| **リポジトリ** | [abulmo/edax-reversi](https://github.com/abulmo/edax-reversi) |
| **特徴**       | 世界最強クラス、完全読み対応                                  |
| **WASM**       | ⚠️ Emscripten でビルド可能                                    |
| **ライセンス** | GPL                                                           |
| **プロトコル** | NBoard / GGS                                                  |

### リバーシ代替候補

#### 1. uctoth (WASM/C)

| 項目           | 内容                                                           |
| -------------- | -------------------------------------------------------------- |
| **リポジトリ** | [ts1/uctoth](https://github.com/ts1/uctoth)                    |
| **特徴**       | 強化学習＋UCT探索。C言語実装を Emscripten で WASM 化。         |
| **WASM**       | ✅ 利用可能 (`emcc` ビルドスクリプト同梱)                      |
| **ライセンス** | MIT                                                            |
| **備考**       | npm 未公開だが、リポジトリ内の WASM 版がブラウザで即動作可能。 |

#### 2. nstringham/othello-web-app (Rust/WASM) ⭐

| 項目           | 内容                                                                        |
| -------------- | --------------------------------------------------------------------------- |
| **リポジトリ** | [nstringham/othello-web-app](https://github.com/nstringham/othello-web-app) |
| **特徴**       | Rust 2024 edition 製 AI。wasm-pack を使用。                                 |
| **WASM**       | ✅ 利用可能                                                                 |
| **ライセンス** | MIT                                                                         |
| **備考**       | モダンな Rust 実装。`wasm-pack build` で容易にパッケージ化可能。            |

#### 3. Bothello (Rust)

| 項目           | 内容                                                           |
| -------------- | -------------------------------------------------------------- |
| **リポジトリ** | [GitHub: bothello-ai](https://github.com/bothello-ai/bothello) |
| **特徴**       | Rust 製、ビットボード最適化。                                  |
| **WASM**       | ✅ 利用可能                                                    |
| **ライセンス** | MIT                                                            |
| **推奨用途**   | 軽量な Rust 実装を求める場合                                   |

---

## ⚪ 五目並べ / 連珠 (Gomoku / Renju)

### 推奨: Rapfi

| 項目           | 内容                                            |
| -------------- | ----------------------------------------------- |
| **リポジトリ** | [dhbloo/rapfi](https://github.com/dhbloo/rapfi) |
| **特徴**       | 強力な探索、連珠ルール完全対応                  |
| **WASM**       | ⚠️ Emscripten でビルド可能                      |
| **ライセンス** | GPL                                             |
| **プロトコル** | Piskvork                                        |

### 五目並べ代替候補

#### 1. gomoku-wasm (AssemblyScript)

| 項目           | 内容                                                            |
| -------------- | --------------------------------------------------------------- |
| **リポジトリ** | [jolestar/gomoku-wasm](https://github.com/jolestar/gomoku-wasm) |
| **特徴**       | AssemblyScript 製、完全ブラウザ動作                             |
| **WASM**       | ✅ 利用可能                                                     |
| **ライセンス** | MIT                                                             |
| **推奨用途**   | 軽量実装が必要な場合                                            |

#### 2. SlowRenju

| 項目           | 内容                  |
| -------------- | --------------------- |
| **特徴**       | 完全 OSS 連珠エンジン |
| **WASM**       | ⚠️ 要ビルド           |
| **ライセンス** | MIT                   |

---

## 🔴 チェッカー (Checkers / Draughts)

### 推奨: Scan

| 項目           | 内容                                                  |
| -------------- | ----------------------------------------------------- |
| **リポジトリ** | [rhalbersma/scan](https://github.com/rhalbersma/scan) |
| **特徴**       | C++17、強力な探索                                     |
| **WASM**       | ⚠️ Boost 依存解決が必要                               |
| **ライセンス** | GPL-3.0                                               |
| **プロトコル** | CheckerBoard                                          |

### チェッカー代替候補

#### 1. rapid-draughts ⭐ (推奨代替)

| 項目           | 内容                                                              |
| -------------- | ----------------------------------------------------------------- |
| **リポジトリ** | [loks0n/rapid-draughts](https://github.com/loks0n/rapid-draughts) |
| **npm**        | `rapid-draughts@1.0.6` (週間 15 DL)                               |
| **特徴**       | TypeScript 製、ビットボード使用、高速合法手生成                   |
| **WASM**       | ✅ ESM/UMD 両対応、即利用可能                                     |
| **ライセンス** | MIT                                                               |
| **最終更新**   | 2023-01                                                           |
| **推奨用途**   | **第一推奨** - ビルド不要で即利用可                               |

#### 2. draughts.js

| 項目           | 内容                                                                            |
| -------------- | ------------------------------------------------------------------------------- |
| **リポジトリ** | [shubhendusaurabh/draughts.js](https://github.com/shubhendusaurabh/draughts.js) |
| **npm**        | `draughts@0.2.1` (週間 11 DL)                                                   |
| **特徴**       | chess.js ライクな API、FEN/PDN サポート                                         |
| **WASM**       | ✅ Pure JS (WAT なし)                                                           |
| **ライセンス** | MPL-2.0                                                                         |
| **最終更新**   | 2025-08                                                                         |
| **推奨用途**   | chess.js に慣れた開発者向け                                                     |

#### 3. wasm-checkers

| 項目           | 内容                                                                          |
| -------------- | ----------------------------------------------------------------------------- |
| **リポジトリ** | [worstpractice/wasm-checkers](https://github.com/worstpractice/wasm-checkers) |
| **特徴**       | 手書き WAT、教育目的                                                          |
| **WASM**       | ✅ 利用可能                                                                   |
| **ライセンス** | MIT                                                                           |

#### 4. Cake

| 項目           | 内容                                              |
| -------------- | ------------------------------------------------- |
| **特徴**       | KingsRow 作者によるエンジン、エンドゲーム DB 対応 |
| **WASM**       | ⚠️ 要ビルド                                       |
| **ライセンス** | GPL                                               |

---

## 🟡 コネクト4 (Connect 4)

### 推奨: Pascal Pons Solver

| 項目           | 内容                                                          |
| -------------- | ------------------------------------------------------------- |
| **リポジトリ** | [PascalPons/connect4](https://github.com/PascalPons/connect4) |
| **特徴**       | 完全解析済み、MIT ライセンス                                  |
| **WASM**       | ⚠️ 要ビルド (容易)                                            |
| **ライセンス** | MIT                                                           |
| **プロトコル** | Stdio                                                         |

### コネクト4代替候補

#### 1. connect-four-ai-wasm ⭐ (推奨代替)

| 項目           | 内容                                                                            |
| -------------- | ------------------------------------------------------------------------------- |
| **リポジトリ** | [benjaminrall/connect-four-ai](https://github.com/benjaminrall/connect-four-ai) |
| **npm**        | `connect-four-ai-wasm@1.0.0` (週間 3 DL)                                        |
| **特徴**       | Rust 製、完全解析 Negamax + αβ枝刈り、埋め込み Opening Book (深さ8)             |
| **WASM**       | ✅ 即利用可能                                                                   |
| **ライセンス** | MIT                                                                             |
| **最終更新**   | 2025-08 (新規公開)                                                              |
| **推奨用途**   | **第一推奨** - npm install で即利用可、ブラウザ/Node.js 両対応                  |

#### 2. Pascal Pons C++ (自前ビルド)

| 項目           | 内容                                                          |
| -------------- | ------------------------------------------------------------- |
| **リポジトリ** | [PascalPons/connect4](https://github.com/PascalPons/connect4) |
| **特徴**       | オリジナル C++ 実装、詳細なチュートリアル付き                 |
| **WASM**       | ⚠️ Emscripten ビルド必要                                      |
| **ライセンス** | MIT                                                           |
| **推奨用途**   | 学習目的、カスタマイズが必要な場合                            |

---

## 📊 ライセンス別サマリー

### MIT / Apache (GPL 汚染なし) - npm パッケージ公開済み

| ゲーム     | パッケージ             | バージョン | 週間DL | 状態        |
| ---------- | ---------------------- | ---------- | ------ | ----------- |
| チェッカー | `rapid-draughts`       | 1.0.6      | 15     | ✅ 即利用可 |
| チェッカー | `draughts`             | 0.2.1      | 11     | ✅ 即利用可 |
| コネクト4  | `connect-four-ai-wasm` | 1.0.0      | 3      | ✅ 即利用可 |
| 五目並べ   | `@algorithm.ts/gomoku` | 4.0.4      | 9      | ✅ 即利用可 |

### GPL (外部配信必須) - npm パッケージ公開済み

| ゲーム | パッケージ                         | バージョン    | 週間DL | 状態        |
| ------ | ---------------------------------- | ------------- | ------ | ----------- |
| チェス | `stockfish`                        | 17.1.0        | 7,883  | ✅ 即利用可 |
| 将棋   | `@mizarjp/yaneuraou.halfkp.noeval` | 7.6.3-alpha.0 | 11     | ✅ 即利用可 |

### 要ビルド (npm 未公開)

| ゲーム     | エンジン | ビルド難易度 | 備考                              |
| ---------- | -------- | ------------ | --------------------------------- |
| リバーシ   | Edax     | 中           | Emscripten、eval.dat/book.dat必要 |
| 五目並べ   | Rapfi    | 中           | Emscripten、Piskvork プロトコル   |
| チェッカー | Scan     | 高           | Boost 依存、エンドゲームDB        |

---

## 🚀 3段階のリリース・ロードマップ

本プロジェクトは、開発スピードと究極の性能を両立させるため、以下の3段階で各ゲームエンジンを統合します。

### Stage 1: クイックスタート (第1段階リリース)

**目的**: 早期リリースと基本的な動作確認を優先。

- **配信**: 信頼できる既存の npm パッケージまたは公開済み WASM バイナリを jsDelivr/unpkg 等のパブリック CDN 経由で利用。
- **実装**: 各エンジンの既存 API に対するラッパー (Adapter) を作成。

### Stage 2: 究極のパワーと制御 (第2段階・ベストプラクティス)

**目的**: 業界最強の検索性能と完全なライセンス隔離を実現。

- **配信**: 最新ソースコードから本プロジェクト用に最適ビルド（SIMD128, Multithreading 有効）した WASM バイナリを、自前の配信インフラ (`infrastructure/cdn`) から提供。
- **実装**: ビルドパイプラインを自動化し、エンジンを常に最新状態に保つ。

### Stage 3: Hybrid/Native Integration (将来の拡張)

**目的**: モバイルアプリ等におけるネイティブ性能の極限追求。

- **環境**: React Native, Capacitor, Cordova 等のハイブリッドアプリ環境。
- **実装**: ネイティブプラグイン（Native Modules / JSI）を介して、OS ネイティブでビルドされたエンジン（Android NDK / iOS C++）を接続。
- **メリット**: WASM を超える生の CPU 性能（NEON 最適化等）と、バックグラウンド実行の実現。

---

## 📜 結論: 各ゲームの選定マトリクス

| ゲーム       | **Stage 1 (即時利用版)**        | **Stage 2 (自前ビルド版目標)** | **Stage 3 (Native Bridge)** |
| :----------- | :------------------------------ | :----------------------------- | :-------------------------- |
| **Chess**    | `stockfish` (17.1)              | **Stockfish 18+**              | Stockfish Native (NDK/iOS)  |
| **Shogi**    | `@mizarjp/yaneuraou`            | **YaneuraOu 10+**              | YaneuraOu Native (C++)      |
| **Reversi**  | `othello-web-app` (GitHub Repo) | **Edax 4.4**                   | Edax Native Build           |
| **Gomoku**   | `@algorithm.ts/gomoku`          | **Rapfi / Yixin**              | Rapfi Native                |
| **Checkers** | `rapid-draughts`                | **Scan 3.1**                   | Scan Native                 |
| **Connect4** | `connect-four-ai-wasm`          | **Pascal Pons**                | Custom Native Build         |

---

## 🏗️ 統合アーキテクチャ設計

### 1. 透過的アダプター設計 (Facade パターン)

`IEngine` インターフェースにより、Stage 1 (npm), Stage 2 (Custom Binary), Stage 3 (Native Bridge) を透過的に切り替えます。

### 2. ライセンス隔離 (GPL Protection)

GPL エンジンは、その入手経路に関わらず **WebWorker または Native Plugin として分離** して実行し、メインプロジェクト（MIT）に静的にリンクさせないことでライセンスを保護します。

### 3. ビルドインフラ (`/infrastructure/cdn`)

Stage 2 に向けて、リポジトリ内に `docker/` (Emscripten 環境) や `scripts/` (自動ビルド) を整備し、常に最新の業界標準エンジンを供給できる体制を構築します。

---

## 📝 次のアクション

### ✅ 調査完了 (Stage 1 & 2 検討)

- [x] npm パッケージの網羅的調査
- [x] 業界標準エンジンの WASM ビルド可能性の確認
- [x] 2段階リリース戦略の策定

### 🔄 短期タスク (Stage 1 実装)

- [ ] **Adapter 基盤**: `IEngine` / `BaseAdapter` の完成。
- [ ] **Chess/Shogi**: Stockfish / やねうら王のリモートローダー実装。
- [ ] **Native Games**: Gomoku / Checkers 等の npm パッケージ統合。

### 📋 中長期タスク (Stage 2 & 3 移行)

- [ ] **Emscripten Docker**: 共通ビルド環境の構築。
- [ ] **Edax/Scan**: C++ エンジンの自前 WASM コンパイルと高速化検証。
- [ ] **Native Discovery**: React Native / Capacitor 向けネイティブプラグインのプロトタイプ調査。
- [ ] **CDN Setup**: 独自配信サーバー（Cloudflare Pages/R2）の自動デプロイ。
