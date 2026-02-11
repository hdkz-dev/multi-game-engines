import { ICapabilities } from "../types";

/**
 * 実行環境（ブラウザ、Node.js、Worker）の能力を診断するクラス。
 * 2026年最新基準の Web API への対応状況をチェックし、最適な実行戦略を選択可能にします。
 */
export class CapabilityDetector {
  /**
   * 現在の環境の能力を非同期で診断します。
   */
  static async detect(): Promise<ICapabilities> {
    const details: Record<string, string> = {};
    /**
     * ブラウザ、WebWorker、Node.js などの多様な実行環境で共通してグローバルAPI
     * （navigator, WebTransport 等）にアクセスするため、意図的に any を使用。
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = globalThis as any;

    // 1. OPFS (Origin Private File System) - 大容量バイナリの保存に最適
    const opfs = !!g.navigator?.storage?.getDirectory;
    if (!opfs) details.opfs = "Origin Private File System is not supported.";

    // 2. WebAssembly Threads - マルチコア並列処理に必須
    const wasmThreads = typeof g.SharedArrayBuffer !== "undefined";
    if (!wasmThreads) details.wasmThreads = "WebAssembly Threads require SharedArrayBuffer.";

    // 3. WebAssembly SIMD - ベクトル演算加速
    const wasmSimd = await this.checkWasmSimd();
    if (!wasmSimd) details.wasmSimd = "WebAssembly SIMD is not supported.";

    // 4. Web Neural Network API - NNUE 等の推論加速
    const webNN = !!g.navigator?.ml;
    if (!webNN) details.webNN = "Web Neural Network API is not available.";

    // 5. WebGPU - 高度な並列計算加速
    const webGPU = !!g.navigator?.gpu;
    if (!webGPU) details.webGPU = "WebGPU is not supported.";

    // 6. WebTransport - 低遅延通信
    const webTransport = !!g.WebTransport;
    if (!webTransport) details.webTransport = "WebTransport is not supported.";

    return {
      opfs,
      wasmThreads,
      wasmSimd,
      webNN,
      webGPU,
      webTransport,
      // 詳細メッセージがあれば付与
      details: Object.keys(details).length > 0 ? (details as ICapabilities["details"]) : undefined,
    };
  }

  /**
   * WASM SIMD のサポートを、実際に小さなバイナリをバリデートすることで確認します。
   */
  private static async checkWasmSimd(): Promise<boolean> {
    try {
      if (typeof WebAssembly === "undefined" || !WebAssembly.validate) return false;
      
      // v128.load 命令を含む最小の有効な SIMD WASM バイナリ
      const simdBinary = new Uint8Array([
        0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 
        8, 0, 65, 0, 253, 3, 0, 11,
      ]);
      return WebAssembly.validate(simdBinary);
    } catch {
      return false;
    }
  }
}
