import { EngineStatus } from "../types.js";

/**
 * 複数エンジンの同時実行を制御するコントローラー。
 * 特にモバイル環境等でメモリを保護するため、アクティブなエンジン数を制限します。
 */
export class EngineConcurrencyController {
  private activeEngines = new Set<string>();
  private maxActive: number;

  constructor(maxActive?: number) {
    // デフォルトは 2 (1つがメイン、1つがバックグラウンド解析用など)
    // deviceMemory が低い場合は 1 に制限
    const g = globalThis as unknown as {
      navigator?: { deviceMemory?: number };
    };
    const ram = g.navigator?.deviceMemory || 4;
    this.maxActive = maxActive || (ram < 4 ? 1 : 2);
  }

  /**
   * エンジンがアクティブ（busy）になる許可を求めます。
   * 上限に達している場合は、古いエンジンを停止（サスペンド）させるか、待機させます。
   */
  public async requestActive(
    engineId: string,
    onSuspend?: (targetId: string) => Promise<void>,
  ): Promise<void> {
    if (this.activeEngines.has(engineId)) return;

    if (this.activeEngines.size >= this.maxActive) {
      // 最も古いアクティブエンジンを特定（簡易的に最初の要素）
      const oldest = this.activeEngines.values().next().value;
      if (oldest && oldest !== engineId) {
        if (onSuspend) {
          await onSuspend(oldest);
        }
        this.activeEngines.delete(oldest);
      }
    }

    this.activeEngines.add(engineId);
  }

  public releaseActive(engineId: string): void {
    this.activeEngines.delete(engineId);
  }

  public updateStatus(engineId: string, status: EngineStatus): void {
    if (status === "busy") {
      this.activeEngines.add(engineId);
    } else if (status === "ready" || status === "error") {
      // 停止した場合は管理から外す（サスペンドの余地を作る）
      // ただし、即座に消すとリクエスト時の優先順位がわからなくなるため、
      // 実際には LRU キュー等で管理するのが望ましい。
    }
  }
}
