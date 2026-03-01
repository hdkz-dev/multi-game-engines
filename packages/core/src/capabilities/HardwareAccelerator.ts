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
    const g = globalThis as unknown as {
      navigator: { ml?: { createContext: () => Promise<unknown> } };
    };
    if (!g.navigator.ml) return false;
    try {
      // 2026: 実際にコンテキストを作成できるか検証
      const context = await g.navigator.ml.createContext();
      return !!context;
    } catch {
      return false;
    }
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
