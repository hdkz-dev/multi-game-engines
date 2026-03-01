import { ICapabilities } from "../types.js";

/**
 * 2026 Zenith Tier: ハードウェアアクセラレーション（WebNN / WebGPU）の管理と診断を行うユーティリティ。
 */
export class HardwareAccelerator {
  /**
   * WebGPU が利用可能かチェックします。
   */
  public static async checkWebGPU(): Promise<boolean> {
    const g = globalThis as unknown as {
      navigator: { gpu?: { requestAdapter: () => Promise<unknown> } };
    };
    if (!g.navigator.gpu) return false;
    try {
      const adapter = await g.navigator.gpu.requestAdapter();
      return !!adapter;
    } catch {
      return false;
    }
  }

  /**
   * WebNN が利用可能かチェックします。
   */
  public static async checkWebNN(): Promise<boolean> {
    const g = globalThis as unknown as { navigator: { ml?: unknown } };
    // 2026: WebNN API は navigator.ml 下に配置される想定
    return !!g.navigator.ml;
  }

  /**
   * 現在の環境で利用可能な最速のアクセラレーション手法を取得します。
   */
  public static async getBestAcceleration(): Promise<
    ICapabilities["acceleration"]
  > {
    if (await this.checkWebNN()) return "webnn";
    if (await this.checkWebGPU()) return "webgpu";
    // SIMD チェックは EnvironmentDetector に依存
    return "none";
  }
}
