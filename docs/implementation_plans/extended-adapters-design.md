# 次世代エンジン・アダプター詳細設計 (Go, Reversi, Mahjong)

## 1. 囲碁エンジン: KataGo (adapter-katago)

### 1.1 プロトコル: GTP (Go Text Protocol)

- **特徴**: コマンドベースの単純なプロトコル。
- **実装課題**: 標準 GTP では思考状況（勝率、探索数）のストリーミングが定義されていないため、KataGo 拡張 GTP（分析モード）を利用。
- **パーサー設計**:
  ```typescript
  interface IGOInfo extends IBaseSearchInfo {
    winrate: number; // 勝率
    visits: number; // 探索数
    ownerMap?: number[]; // 盤面各点の支配率 (Heatmap)
  }
  ```

### 1.2 技術的特異点: マルチリソース・ロード

- **リソース**: WASM バイナリ + Neural Network Weights (.bin.gz)。
- **対応方針**: `EngineLoader.loadResource` を拡張し、依存する全ファイルを一括で OPFS にダウンロード・検証する仕組みを導入。
- **演算加速**: WebGPU (via WGSL) を優先使用。環境が未サポートの場合は WASM SIMD へのフォールバック。

---

## 2. リバーシエンジン: Edax (adapter-edax)

### 2.1 プロトコル: Edax 独自

- **特徴**: 行ベースのテキスト出力。プロトコルが標準化されていない。
- **パーサー設計**:
  - `BaseAdapter` の `searchRaw` において、Edax 独自の `go`, `depth`, `hint` コマンドを生成。
  - 出力中の `Mid:` (中盤評価値) や `Exact:` (終盤完全読み) を正規表現でキャプチャ。

### 2.2 型定義 (Branded Types)

- `type ReversiBoard = Brand<string, "ReversiBoard">;` (64文字の 0, 1, 2 文字列等)
- `type ReversiMove = Brand<string, "ReversiMove">;` (e4, c3 等)

---

## 3. 麻雀エンジン: Mortal (adapter-mortal)

### 3.1 特徴: 非完全情報ゲームの抽象化

- **プロトコル**: 通常 JSON 形式で WebWorker とやり取りされる。
- **検索オプションの拡張**:
  ```typescript
  interface IMahjongOptions extends IBaseSearchOptions {
    hand: Tile[]; // 手牌
    melds: Meld[]; // 鳴き
    discards: Tile[]; // 捨て牌
    dora: Tile[]; // ドラ
    isRiichi: boolean; // 立直状態
  }
  ```

### 3.2 思考状況の配信

- **T_INFO**: 各打牌候補の期待値（EV）や、期待順位の分布をストリーム配信。
- **T_RESULT**: 最適な打牌、またはリーチ/パス/ポン等のアクション。

---

## 4. バックギャモン: GNU Backgammon (adapter-gnubg)

### 4.1 プロトコル: コマンドライン・インターフェース (CLI)

- **特徴**: 歴史的な C 言語ベースの実装であり、テキストコマンドによる対話。
- **実装課題**: WASM 環境における対話型プロンプトのシミュレーション。
- **型定義**:

  ```typescript
  interface IBackgammonInfo extends IBaseSearchInfo {
    equity: number; // 期待値
    winProbability: number; // 勝率
    winGammonProbability: number; // ギャモン勝ち率
    winBackgammonProbability: number; // バックギャモン勝ち率
    moveEquityLoss?: number; // 手の悪手指標
  }

  type BackgammonBoard = Brand<number[], "BackgammonBoard">; // 26要素の配列（バー、ポイント、オフ）

  interface IBackgammonOptions extends IBaseSearchOptions {
    board: BackgammonBoard;
    dice: [number, number]; // サイコロの出目
    cube: number; // ダブリングキューブの値
    matchLength?: number; // マッチポイント（0ならマネーゲーム）
  }
  ```

---

## 5. チェッカー: KingsRow / Scan (adapter-checkers)

### 5.1 プロトコル: 独自テキストプロトコル

- **特徴**: シンプルな指し手と評価値のやり取り。
- **演算加速**: 巨大なデータベース（エンドゲーム・テーブルベース）の効率的なロード。
- **型定義**:

  ```typescript
  interface ICheckersInfo extends IBaseSearchInfo {
    eval: number; // 評価値
    depth: number;
    pv: CheckersMove[];
  }

  type CheckersBoard = Brand<string, "CheckersBoard">; // FEN類似の独自形式
  type CheckersMove = Brand<string, "CheckersMove">; // 記法（例: "11-15"）

  interface ICheckersOptions extends IBaseSearchOptions {
    board: CheckersBoard;
    variant?: "english" | "brazilian" | "pool";
  }
  ```

---

## 6. 中国将棋 (Xiangqi): ElephantEye / Stockfish (adapter-xiangqi)

### 6.1 プロトコル: UCCI (Universal Chinese Chess Interface)

- **特徴**: UCI に極めて近いが、チェス FEN と構造は同一で駒表記のみ異なる Xiangqi FEN を使用。
- **コマンド**: `position fen <fen_string>` を使用して局面を設定。
- **実装課題**: 盤面が 9x10 であり、河（River）や九宮（Palace）の概念を UI 側で表現。
- **型定義**:

  ```typescript
  interface IXiangqiInfo extends IBaseSearchInfo {
    score: IScoreInfo; // cp, mate
    pv: XiangqiMove[];
  }

  type XiangqiFEN = Brand<string, "XiangqiFEN">;
  type XiangqiMove = Brand<string, "XiangqiMove">; // UCCI (例: "h2e2")

  interface IXiangqiOptions extends IBaseSearchOptions {
    fen: XiangqiFEN;
    rule?: "chinese" | "asian"; // ルール変種
  }
  ```

---

## 7. チャンギ (Janggi): Stockfish Janggi (adapter-janggi)

### 7.1 特徴: パスの概念

- **プロトコル**: UCI 拡張。
- **実装課題**: 駒の動きやパス（スキップ）のルールを `Move` 型でどう表現するか。
- **型定義**:

  ```typescript
  interface IJanggiInfo extends IBaseSearchInfo {
    score: IScoreInfo;
    pv: JanggiMove[];
  }

  type JanggiFEN = Brand<string, "JanggiFEN">;
  type JanggiMove = Brand<string, "JanggiMove">; // 座標表記

  interface IJanggiOptions extends IBaseSearchOptions {
    fen: JanggiFEN;
  }
  ```

---

## 8. 五目並べ・連珠 (Gomoku/Renju): Yisin (adapter-gomoku)

### 8.1 プロトコル: 独自テキストベース

- **特徴**: 15x15 のグリッド上の座標指定。
- **型定義**:

  ```typescript
  interface IGomokuInfo extends IBaseSearchInfo {
    evaluation: number; // 評価値
    vcfDepth?: number; // 四追い（VCF）の深さ
    vctDepth?: number; // 三追い（VCT）の深さ
    threats: Array<{ x: number; y: number; type: "four" | "three" }>; // 脅威リスト
  }

  type GomokuBoard = Brand<number[][], "GomokuBoard">;

  interface IGomokuOptions extends IBaseSearchOptions {
    board: GomokuBoard; // 15x15 grid (0: empty, 1: black, 2: white)
    rules: "freestyle" | "standard" | "renju";
  }
  ```

---

## 9. マルチエンジン対応と汎用アダプター (Generic Adapters)

同一ゲームに対する複数エンジンの同時サポートを効率化するため、プロトコル単位の「汎用アダプター」を導入します。

### 9.1 設計方針

- **設定駆動**: `id`, `name`, `binaryUrl`, `sri` を外部から注入可能にする。
- **アンサンブル分析**: 各アダプターからの出力を `IEngine` (Facade) レベルで集計・正規化し、UI には一貫した比較データを提供することでカプセル化を維持。

---

## 10. 共通の洗練（2026 Best Practice）

### 10.1 Zero-Any Policy

全アダプターにおいて、以下の厳格な型定義を強制します。

- `T_OPTIONS`: 各ゲームの初期局面・ルール設定を完全にカバー。
- `T_INFO`: リアルタイム UI（検討窓、ヒートマップ）に必要な情報を網羅。

### 10.2 Proactive Disposal

- 囲碁や麻雀の巨大な NN モデルがメモリを圧迫しないよう、`dispose()` 実行時に `WebGPU` コンテキストの破棄と、WASM インスタンスおよびメモリバッファの確実な解放を徹底。
