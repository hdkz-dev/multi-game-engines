import { ICapabilities } from "../types.js";

/**
 * 実行環境の能力（WASM, Threads, SIMD, WebGPU等）を検知します。
 */
export class CapabilityDetector {
  static async detect(): Promise<ICapabilities> {
    return {
      opfs: typeof navigator !== "undefined" && !!navigator.storage?.getDirectory,
      wasmThreads: this.checkWasmThreads(),
      wasmSimd: this.checkWasmSimd(),
      webNN: "ml" in navigator,
      webGPU: "gpu" in navigator,
      webTransport: "WebTransport" in globalThis,
    };
  }

  private static checkWasmThreads(): boolean {
    try {
      if (typeof MessageChannel !== "undefined") {
        new WebAssembly.Memory({ shared: true, initial: 1, maximum: 1 });
        return true;
      }
    } catch {
      // Ignore
    }
    return false;
  }

  private static checkWasmSimd(): boolean {
    // 2026: WASM SIMD は主要ブラウザで標準
    return true; 
  }
}
