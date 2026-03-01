import { EnvironmentDetector } from "./EnvironmentDetector.js";

/**
 * 実行環境のリソース制限を動的に調整するガバナー。
 */
export class ResourceGovernor {
  /**
   * 現在の環境に合わせて、推奨されるエンジンのオプション設定を取得します。
   */
  public static async getRecommendedOptions(
    options?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const caps = await EnvironmentDetector.detect();
    const security = await EnvironmentDetector.getSecurityStatus();
    const recommended = { ...options };

    // 1. スレッド数 (Threads)
    const threads = EnvironmentDetector.getRecommendedThreads();
    // 2026: COOP/COEP が無効な場合はシングルスレッドに強制フォールバック
    if (!security.canUseThreads || !caps.wasmThreads) {
      recommended["Threads"] = 1;
      recommended["MultiThreaded"] = false;
    } else {
      recommended["Threads"] = threads;
      recommended["MultiThreaded"] = true;
    }

    // 2. ハッシュサイズ (Hash) - MB 単位
    const maxMemory = EnvironmentDetector.getRecommendedMaxMemory();
    const maxHashMB = Math.floor(maxMemory / (1024 * 1024));
    // モバイル等のメモリ制限を反映。上限 512MB 程度 (UI の滑らかさを優先)。
    recommended["Hash"] = Math.min(512, maxHashMB);

    // 3. その他、環境に応じた最適化
    if (!caps.wasmSimd) {
      recommended["Simd"] = false;
    }

    return recommended;
  }

  /**
   * 2026 Zenith: 省電力モード (LowPowerMode) を適用します。
   */
  public static applyLowPowerMode(
    options: Record<string, unknown>,
  ): Record<string, unknown> {
    return {
      ...options,
      Threads: 1,
      Hash: 16, // 最小限のハッシュ
      Ponder: false, // 思考中にバックグラウンドで動かさない
      SlowMover: 10, // 思考を早めに切り上げる
    };
  }
}
