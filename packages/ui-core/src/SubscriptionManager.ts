import { Unsubscribe } from "./store.js";

/**
 * 複数の購読をまとめて管理するためのクラス。
 * 2026 Best Practice: ADR-024 の設計哲学を UI 層にも適用。
 */
export class SubscriptionManager {
  private subscriptions: Set<Unsubscribe> = new Set();

  /**
   * 購読を追加する
   * @returns 個別の購読解除関数
   */
  add(unsub: Unsubscribe): Unsubscribe {
    this.subscriptions.add(unsub);
    return () => {
      this.subscriptions.delete(unsub);
      unsub();
    };
  }

  /**
   * すべての購読を解除する
   */
  clear(): void {
    this.subscriptions.forEach((unsub) => {
      try {
        unsub();
      } catch (e) {
        console.error("[SubscriptionManager] Failed to unsubscribe:", e);
      }
    });
    this.subscriptions.clear();
  }

  /**
   * 現在の購読数
   */
  get size(): number {
    return this.subscriptions.size;
  }
}
