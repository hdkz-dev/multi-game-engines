# ADR-042: Mobile UI and Monitor Design Standard

## Status

Proposed

## Context

モバイル端末（スマートフォン、タブレット）は画面サイズが制限されており、タッチ操作や電力消費、発熱が重要な関心事となります。従来のデスクトップ向け UI 部品やモニターをそのまま適用するのではなく、モバイルに最適化した「Zenith Mobile UI」の標準を策定する必要があります。

## Decision

以下の 3 つの軸でモバイル向け UI/モニタリング機能を定義します。

### 1. タッチ最適化コンポーネント

- **Precision Touch Controls**: 小さな画面でも隣接するマスを誤操作しないための、拡大表示機能や確認ジェスチャ。
- **Haptic Feedback**: 読み筋の更新や思考完了時の繊細な振動フィードバック（Taptic Engine 等の活用）。
- **Adaptive Layout**: ポートレート/ランドスケープの切り替え時に、盤面と情報を動的に再構成。

### 2. モバイル・テレメトリ・モニター

- **Energy Monitor**: エンジンの思考によるバッテリー消費率や、端末の予測残り時間の表示。
- **Thermal Status**: 発熱によるサーマルスロットリング検知と、それに応じた自動的なエンジンスレッド制限。
- **Compact Search Info**: 画面を遮らないフローティング表示や、スワイプで呼び出せる詳細情報オーバーレイ。

### 3. モバイル専用インタラクション

- **Bottom Sheet Integration**: 詳細な設定や思考グラフを、親指で操作しやすいボトムシートで掲示。
- **Swipe-to-Move / Voice Input**: 画面上のボタンを最小化するための代替入力手段の実験的導入。

## Consequences

- **Positive**: 外出先でも快適かつ長時間、高性能なエンジン解析を利用可能。
- **Negative**: ネイティブ機能（振動、バッテリー情報取得）への依存が発生。
- **Mitigation**: `@multi-game-engines/core` の `Capability` チェックにより、ウェブ環境では無効化するフォールバックを徹底。
