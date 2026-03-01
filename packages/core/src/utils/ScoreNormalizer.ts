import { NormalizedScore } from "../types.js";

/**
 * 異なるゲームドメインの評価値を、UI での表示に適した共通のスケール (-1.0 to 1.0) に正規化するユーティリティ。
 */
export class ScoreNormalizer {
  /**
   * 評価値を正規化します。
   *
   * @param raw - 生の数値 (cp, points, diff 等)
   * @param unit - 単位 ('cp', 'points', 'diff', 'winrate')
   * @param domain - ゲームドメイン (chess, shogi, reversi 等)
   * @returns 正規化されたスコア (-1.0 〜 1.0)
   */
  public static normalize(
    raw: number,
    unit: "cp" | "mate" | "points" | "winrate" | "diff" | string,
    domain?: string,
  ): NormalizedScore {
    let normalized = 0;

    // 詰みの特殊処理
    if (unit === "mate") {
      // 詰みの場合は距離に関わらず端に近い値（0.99 or -0.99）を返す
      normalized = raw > 0 ? 0.99 : -0.99;
      return normalized as NormalizedScore;
    }

    // 勝率の場合は既に 0.0 - 1.0 なので -1.0 〜 1.0 にスケーリング
    if (unit === "winrate") {
      normalized = (raw - 0.5) * 2;
      return this.clamp(normalized) as NormalizedScore;
    }

    // ゲームドメインに応じたシグモイド正規化
    switch (domain) {
      case "shogi":
      case "chess":
        // センチポーン (cp) 基準: 600cp (約1ポーン/歩の差) を 0.5 付近にマッピング
        // シグモイド関数: 2 / (1 + exp(-raw / k)) - 1
        // k=600 のとき raw=600 -> 0.46, raw=1200 -> 0.76, raw=2500 -> 0.96
        normalized = this.sigmoid(raw, 600);
        break;

      case "reversi":
        // 石差 (diff) 基準: 最大 64 石。16石差を 0.5 付近にマッピング
        normalized = this.sigmoid(raw, 16);
        break;

      case "go":
        // 囲碁 (points/scoreLead) 基準: 20目差を 0.8 付近にマッピング
        // 囲碁は形勢判断が急激に動くため、k=10 程度で急峻にする
        normalized = this.sigmoid(raw, 10);
        break;

      default:
        // 不明なドメインは標準的なスケーリング (k=1000)
        normalized = this.sigmoid(raw, 1000);
        break;
    }

    return this.clamp(normalized) as NormalizedScore;
  }

  /**
   * シグモイド関数によるスケーリング。
   * @param x 入力値
   * @param k スケール係数 (x=k の時に 0.46 付近、x=2k の時に 0.76 付近)
   */
  private static sigmoid(x: number, k: number): number {
    return 2 / (1 + Math.exp(-x / k)) - 1;
  }

  private static clamp(val: number): number {
    return Math.max(-1, Math.min(1, val));
  }
}
