import { Unsubscribe } from "./store.js";

/**
 * 複数の購読をまとめて管理するためのクラス。
 * 2026 Best Practice: ADR-024 の設計哲学を UI 層にも適用。
 */
export class SubscriptionManager {
  private subscriptions: Set<Unsubscribe> = new Set();

  /**
   * 購読を追加する
   * @returns 個別の購読解除関数（冪等性が保証されています）
   */
  add(unsub: Unsubscribe): Unsubscribe {
    let called = false;
    const wrappedUnsub: Unsubscribe = () => {
      if (called) return;
      called = true;
      this.subscriptions.delete(wrappedUnsub);
      unsub();
    };

    this.subscriptions.add(wrappedUnsub);
    return wrappedUnsub;
  }

  /**
   * すべての購読を解除する
   */
  clear(): void {
    // 2026 Best Practice: ループ中での Set からの削除を安全に行うため、コピーを作成
    const currentSubscribers = Array.from(this.subscriptions);
    currentSubscribers.forEach((unsub) => {
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
