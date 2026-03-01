import { ICapabilities, ISecurityStatus } from "../types.js";
import { SecurityAdvisor } from "./SecurityAdvisor.js";

/**
 * 実行環境の能力、メモリ、CPU、およびセキュリティ状態を検知するユーティリティ。
 */
export class EnvironmentDetector {
  /**
   * 現在の環境能力を検知します。
   */
  public static async detect(): Promise<ICapabilities> {
    // 2026: Capabilities detection for WASM threads/simd
    // Node.js/Bun 環境でも正常に動作するように globalThis を使用
    const g = globalThis as unknown as {
      process?: { arch?: string; platform?: string };
      navigator?: {
        hardwareConcurrency?: number;
        deviceMemory?: number;
        storage?: { getDirectory?: () => unknown };
      };
    };

    const caps: ICapabilities = {
      wasmThreads: this.checkWasmThreads(),
      wasmSimd: this.checkWasmSimd(),
      threads: !!(
        g.navigator?.hardwareConcurrency && g.navigator.hardwareConcurrency > 1
      ),
      simd: !!(
        g.process?.arch?.includes("x64") || g.process?.arch?.includes("arm64")
      ),
      opfs: !!g.navigator?.storage?.getDirectory,
    };

    return caps;
  }

  /**
   * 2026 Zenith Standard: セキュリティ状態とアドバイスの取得
   */
  public static async getSecurityStatus(): Promise<ISecurityStatus> {
    return await SecurityAdvisor.getStatus();
  }

  /**
   * 推奨される最大メモリ使用量 (bytes) を算出します。
   * モバイル (Jetsam) 対策として、RAM の一定割合に制限します。
   */
  public static getRecommendedMaxMemory(): number {
    const g = globalThis as unknown as {
      navigator?: { deviceMemory?: number };
    };
    // navigator.deviceMemory は GB 単位。不明な場合は安全な 2GB と仮定。
    const ramGB = g.navigator?.deviceMemory || 2;
    // RAM の 1/4 〜 1/2 を上限とする (max 1GB for safe buffer)
    const limitGB = Math.min(1, ramGB / 2);
    return limitGB * 1024 * 1024 * 1024;
  }

  /**
   * 推奨されるスレッド数を算出します。
   */
  public static getRecommendedThreads(): number {
    const g = globalThis as unknown as {
      navigator?: { hardwareConcurrency?: number };
    };
    const cores = g.navigator?.hardwareConcurrency || 1;
    // ブラウザのUIスレッド等を考慮し、コア数 - 1 or 2
    return Math.max(1, cores > 4 ? cores - 2 : cores - 1);
  }

  /**
   * 実行環境の種類。
   */
  public static getRuntime(): "browser" | "node" | "bun" | "unknown" {
    const g = globalThis as unknown as {
      process?: { versions?: { node?: string; bun?: string } };
      window?: unknown;
    };
    if (g.process?.versions?.bun) return "bun";
    if (g.process?.versions?.node) return "node";
    if (g.window) return "browser";
    return "unknown";
  }

  private static checkWasmThreads(): boolean {
    try {
      if (typeof WebAssembly === "undefined") return false;
      if (typeof SharedArrayBuffer === "undefined") return false;

      // 2026: 実際に共有メモリが作成可能かチェック（COOP/COEP が未設定だとここで失敗する可能性がある）
      new WebAssembly.Memory({ initial: 1, maximum: 1, shared: true });
      return true;
    } catch {
      return false;
    }
  }

  private static checkWasmSimd(): boolean {
    try {
      if (typeof WebAssembly === "undefined") return false;
      // 2026: Physical SIMD detection using a minimal SIMD bytecode (v128.const)
      // This ensures the browser's Wasm engine actually supports the SIMD section.
      return WebAssembly.validate(
        new Uint8Array([
          0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0, 3, 2, 1, 0, 10, 9, 1,
          7, 0, 65, 0, 253, 15, 1, 11,
        ]),
      );
    } catch {
      return false;
    }
  }
}
