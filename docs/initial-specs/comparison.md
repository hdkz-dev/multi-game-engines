# ゲームエンジン技術選定比較：Native Plugin vs WebAssembly

## 1. 概要

本ドキュメントでは、iOS/Androidモバイルアプリ（Capacitor環境）およびWebブラウザ環境において、将棋（ヤネウラオ）、チェス（Stockfish）、オセロ（Edax）、囲碁（KataGo）などの思考エンジンを動作させるための技術選定基準をまとめる。

主な比較対象は以下の2つのアーキテクチャである。

1.  **Native Plugin (Capacitor)**: C++エンジンをモバイルネイティブコード（JNI/Objective-C++）でラップし、CapacitorプラグインとしてJSから呼び出す。
2.  **WebAssembly (Wasm)**: C++エンジンをEmscripten等でWasmにコンパイルし、Web Worker上で動作させる。

## 2. 比較マトリクス

| 評価項目             | Native Plugin (Capacitor) | WebAssembly (Wasm) | 備考                                                                                                                  |
| :------------------- | :------------------------ | :----------------- | :-------------------------------------------------------------------------------------------------------------------- |
| **処理性能 (CPU)**   | ◎ **最大**                | ◯ 普通〜良         | NativeはOS/CPU固有の命令セット（AVX2, NEON等）をフル活用可能。WasmはSIMD対応が進んでいるがNativeには劣る。            |
| **処理性能 (GPU)**   | ◎ **最大**                | △ 発展途上         | KataGo等のGPU依存エンジンは、Native (Metal/Vulkan/OpenCL) が圧倒的に有利。WebGPUはまだモバイルで不安定。              |
| **メモリ制限**       | ◎ **OS制限のみ**          | △ **制限あり**     | Wasm (特にiOS Safari) はメモリ使用量に厳しい制限がある（例: 数GBまで）。巨大なハッシュテーブルを使う将棋/囲碁で不利。 |
| **スレッド制御**     | ◎ **自由**                | △ **制限あり**     | WasmはSharedArrayBufferが必要（COOP/COEPヘッダ設定必須）。iOSでは制限がかかる場合がある。                             |
| **UI応答性**         | ◎ **別プロセス/スレッド** | ◯ **Web Worker**   | どちらもメインスレッドをブロックせずに実行可能。Nativeの方が優先度制御が容易。                                        |
| **バッテリー効率**   | ◯ 普通                    | △ やや悪い         | WasmはJIT/VMオーバーヘッドにより、同じ計算量でも電力消費が増える傾向にある。                                          |
| **実装・保守コスト** | △ **高い**                | ◎ **低い**         | NativeはiOS/Androidそれぞれのビルド環境とラッパーコードの管理が必要。Wasmは単一バイナリで済む。                       |
| **Web対応**          | × 不可                    | ◎ **標準**         | Webブラウザ版も提供する場合、Wasm版はそのまま流用可能。                                                               |

## 3. エンジン別詳細分析

### 3.1. Stockfish (Chess)

- **特性**: CPUバウンド。NNUE（ニューラルネットワーク）評価関数を使用。
- **現状**: Wasm版 (`stockfish.js`, `stockfish.wasm`) が非常に成熟しており、GitHub等で容易に入手可能。
- **推奨**: **Wasm**。
  - 最新のWasm版はNNUEに対応しており、モバイル端末でも十分な棋力（Human Superhumanレベル）を発揮する。
  - Native化の恩恵は「解析速度(NPS)の数%〜数十%の向上」程度であり、開発コストに見合うかは要検討。

### 3.2. Edax (Othello)

- **特性**: CPUバウンド。ビットボード演算（ビット演算）を多用。
- **現状**: 公式のWasmビルドは少ないが、コミュニティによるポートが存在。
- **推奨**: **Wasm (基本) / Native (最強設定)**。
  - オセロは完全解析されているゲームであり、Wasmでも一般ユーザーには十分すぎる強さ。
  - ARM NEON命令をフル活用したNative版はさらに高速だが、UI体験への影響は軽微。

### 3.3. KataGo (Go)

- **特性**: **GPUバウンド**。ディープラーニング推論が負荷の99%を占める。
- **現状**: Web版はWebGPU/WebGLバックエンドを使用するが、モバイルブラウザでの動作は非常に重い、または非対応端末が多い。
- **推奨**: **Native Plugin (必須)**。
  - iOSではCoreMLまたはMetal、AndroidではOpenCL/Vulkanバックエンドを使用しないと実用的な速度が出ない。
  - Wasm版はロード時間も長く、バッテリー消費も激しいため、モバイルアプリとしてはNative一択。

### 3.4. YaneuraOu (Shogi)

- **特性**: CPUバウンド。NNUE評価関数、および**巨大な置換表（ハッシュメモリ）**を使用。
- **現状**: Wasm版は「Shogi Playground」などで実績あり。
- **推奨**: **Hybrid / Native**。
  - Wasm版でも対局は可能だが、メモリ制限（iOSでの大容量確保の難しさ）により、長時間の読みや解析モードではNativeが有利。
  - AVX2/NEON最適化の有無がNPSに大きく響くため、強さを売りにおくならNative。

## 4. 総合アーキテクチャ提案

要件である「iOS/Androidでの動作最優先」かつ「処理速度・UI応答性」を満たすため、以下の**ハイブリッド戦略**を提案する。

### 戦略: "Interface-based Strategy Pattern"

プラットフォーム（Web vs Native）およびエンジン（GPU依存度）に応じて、実装を切り替える抽象化レイヤーを設ける。

1.  **共通インターフェース (`IGameEngine`)**:
    - `init()`
    - `loadModel(path)`
    - `go(options)`
    - `stop()`
    - `onInfo(callback)`

2.  **実装の振り分け**:

    | エンジン      | Web環境       | Capacitor環境 (App) | 理由                                                                                   |
    | :------------ | :------------ | :------------------ | :------------------------------------------------------------------------------------- |
    | **Stockfish** | Wasm          | **Wasm**            | Native化のコスパが悪いため、アプリ内でもWasm (Worker) で十分。                         |
    | **Edax**      | Wasm          | **Wasm**            | 同上。                                                                                 |
    | **YaneuraOu** | Wasm          | **Native Plugin**   | メモリ効率とSIMD最適化のため、アプリではNative推奨。ただし初期開発ではWasmで代用も可。 |
    | **KataGo**    | Wasm (WebGPU) | **Native Plugin**   | モバイルWasmは実用的ではないため、Native必須。                                         |

### 結論

- まずは **Stockfish / Edax を Wasm (Web Worker) で実装** し、Capacitorアプリ内でもそれをWebView上で動作させる。これにより開発工数を大幅に削減できる。
- **KataGo / YaneuraOu** を導入するフェーズで、**Capacitor Custom Plugin** の開発を行う。
- これにより、初期リリースを早めつつ、高負荷なゲームにおけるユーザー体験（強さ・速さ）を順次最適化できる。
