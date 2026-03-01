import { ISecurityStatus, ICapabilities } from "../types.js";

/**
 * 2026 Zenith Tier: 実行環境のセキュリティおよび能力を診断します。
 * 特に WASM Threads に必要な COOP/COEP ヘッダーの状態を検証します。
 */
export class EnvironmentDiagnostics {
  /**
   * 統合された環境レポートを取得します。
   */
  static async getReport(): Promise<{
    browser: string;
    capabilities: ICapabilities;
    security: ISecurityStatus;
  }> {
    const { EnvironmentDetector } =
      await import("../capabilities/EnvironmentDetector.js");
    return {
      browser:
        typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      capabilities: await EnvironmentDetector.detect(),
      security: this.getSecurityStatus(),
    };
  }

  /**
   * 高精度タイマーが利用可能かチェックします。
   */
  static hasHighResTimer(): boolean {
    return (
      typeof performance !== "undefined" &&
      typeof performance.now === "function"
    );
  }

  /**
   * 現在の環境のセキュリティ状態を取得します。
   */
  static getSecurityStatus(): ISecurityStatus {
    const isCrossOriginIsolated =
      typeof crossOriginIsolated !== "undefined" ? crossOriginIsolated : false;

    const missingHeaders: string[] = [];
    if (!isCrossOriginIsolated) {
      // 厳密な判定はサーバーサイドで行う必要があるが、クライアント側でも推測可能
      missingHeaders.push("Cross-Origin-Opener-Policy: same-origin");
      missingHeaders.push("Cross-Origin-Embedder-Policy: require-corp");
    }

    return {
      sriEnabled: true, // Core 側で強制
      coopCoepEnabled: isCrossOriginIsolated,
      sriSupported:
        typeof document !== "undefined" &&
        typeof document.createElement === "function"
          ? "integrity" in document.createElement("script")
          : false,
      canUseThreads:
        isCrossOriginIsolated && typeof SharedArrayBuffer !== "undefined",
      isCrossOriginIsolated,
      missingHeaders: missingHeaders.length > 0 ? missingHeaders : undefined,
    };
  }

  /**
   * 環境の能力が不足している場合に警告を出力します。
   */
  static warnIfSuboptimal(): void {
    const status = this.getSecurityStatus();
    if (!status.isCrossOriginIsolated) {
      console.warn(
        "[Zenith Tier] Environment is not cross-origin isolated. WASM Threads will be disabled. " +
          "Ensure your server sends COOP and COEP headers: ",
        status.missingHeaders,
      );
    }
  }
}
