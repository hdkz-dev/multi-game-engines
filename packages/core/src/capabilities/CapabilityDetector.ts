import { ICapabilities } from "../types";

interface IGlobalCapabilities {
  navigator?: {
    storage?: {
      getDirectory?: unknown;
    };
    ml?: unknown;
    gpu?: unknown;
  };
  SharedArrayBuffer?: unknown;
  WebTransport?: unknown;
}

/**
 * 実行環境の最新 API サポート状況を診断するクラス。
 */
export class CapabilityDetector {
  /**
   * ブラウザや Node.js 環境の能力を検出し、ICapabilities オブジェクトを返します。
   */
  static async detect(): Promise<ICapabilities> {
    const g = globalThis as unknown as IGlobalCapabilities;

    const results = {
      opfs: !!(g.navigator?.storage?.getDirectory),
      wasmThreads: typeof g.SharedArrayBuffer !== "undefined",
      wasmSimd: await this.checkWasmSimd(),
      webNN: !!(g.navigator?.ml),
      webGPU: !!(g.navigator?.gpu),
      webTransport: typeof g.WebTransport !== "undefined",
    };

    return {
      ...results,
      details: results,
    };
  }

  /**
   * WASM SIMD のサポート状況を実際に小さなバイナリをロードして確認します。
   */
  private static async checkWasmSimd(): Promise<boolean> {
    try {
      // SIMD 命令を含む最小限の WASM バイナリ (v128.load)
      const bytes = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 4, 1, 96, 0, 0, 3, 2, 1, 0, 10, 9, 1, 7, 0, 65, 0, 253, 3, 0, 11]);
      return WebAssembly.validate(bytes);
    } catch {
      return false;
    }
  }
}
