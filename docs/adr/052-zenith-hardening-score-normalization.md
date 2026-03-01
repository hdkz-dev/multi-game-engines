# ADR-052: Zenith Hardening & Standardized Score Normalization

## 状態

Proposed (提案中)

## コンテキスト

`multi-game-engines` ライブラリにおいて、将棋（cp）、チェス（cp/mate）、リバーシ（diff）、囲碁（winrate）など、各エンジンが返す評価値の単位がバラバラであり、UI 層（ダッシュボード等）での統一的な視覚化（評価バー、グラフ等）が困難です。
また、外部プロジェクト（`multi-board-games` 等）からの要求により、巨大な NNUE 評価関数や定跡データの安全性（SRI）と、デバイスのメモリ制約に合わせた自動最適化が求められています。

## 意思決定

以下の設計変更を導入します：

1.  **評価値の標準化 (`NormalizedScore`)**:
    - すべてのエンジンアダプターが返す `IBaseSearchInfo` の `score` を拡張し、生の `raw` 値に加えて、単位 (`unit`) と正規化された値 (`normalized`) を提供します。
    - `normalized` は `-1.0` (負け確) 〜 `1.0` (勝ち確) の範囲にシグモイド関数や線形変換を用いてマップされた `Branded number` です。
2.  **PV (Principal Variation) の構造化**:
    - `IBaseSearchInfo` の `pv` を `Move[]` (Branded Types の配列) としてパースします。これにより、フロントエンド側で文字列を再パースすることなく、盤面ハイライト等の UI 連携が可能になります。
3.  **環境適応型リソース管理 (`Resource Guard`)**:
    - `navigator.deviceMemory` (RAM) や `navigator.hardwareConcurrency` (CPU) を参照し、`Hash` サイズや `Threads` 数を自動的に抑制する `ResourceGovernor` を導入します。
    - 特に iOS/Mobile 環境での Jetsam (OOM) によるキルを防止します。
4.  **セキュリティ・ハードニングの徹底**:
    - 全アダプターのコマンド生成パスに `ProtocolValidator.assertNoInjection` を強制適用し、サニタイズではなく「拒否」による防御を全数監査します。
    - SRI 検証を WASM だけでなく、NNUE や定跡ファイルを含む全アセットに強制し、改ざんを物理的に防ぎます。

## 影響

- **開発者体験 (DX)**: 異なるゲームドメインでも、同一の UI ロジックで評価値を表示できるようになります。
- **堅牢性**: 低スペック端末や隔離環境下でのクラッシュリスクが劇的に低減します。
- **安全性**: プロトコルを介した攻撃ベクトルが物理的に遮断されます。
- **互換性**: 既存の `raw` スコアも保持されるため、後方互換性は維持されます。
