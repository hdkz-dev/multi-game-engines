import { describe, it, expect, vi } from "vitest";
import { SubscriptionManager } from "../SubscriptionManager.js";

describe("SubscriptionManager", () => {
  it("should return an idempotent unsubscribe function", () => {
    const manager = new SubscriptionManager();
    const spy = vi.fn();
    const unsub = manager.add(spy);

    expect(manager.size).toBe(1);

    // First call: calls the original function and removes it from the Set
    unsub();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(manager.size).toBe(0);

    // Second call: does nothing
    unsub();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(manager.size).toBe(0);
  });

  it("should allow clear() to call all unsubscribers", () => {
    const manager = new SubscriptionManager();
    const spy1 = vi.fn();
    const spy2 = vi.fn();
    manager.add(spy1);
    manager.add(spy2);

    expect(manager.size).toBe(2);

    manager.clear();
    expect(spy1).toHaveBeenCalledTimes(1);
    expect(spy2).toHaveBeenCalledTimes(1);
    expect(manager.size).toBe(0);
  });

  it("should be safe to call returned unsub after clear()", () => {
    const manager = new SubscriptionManager();
    const spy = vi.fn();
    const unsub = manager.add(spy);

    manager.clear();
    expect(spy).toHaveBeenCalledTimes(1);

    // Already called by clear(), so it should not be called again here
    unsub();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("should handle clear() during redundant calls", () => {
    const manager = new SubscriptionManager();
    const spy = vi.fn();
    const unsub = manager.add(spy);

    unsub();
    expect(spy).toHaveBeenCalledTimes(1);

    manager.clear();
    expect(spy).toHaveBeenCalledTimes(1); // Already unsubscribed, so should not be called again
  });

  it("should continue calling other unsubscribers even if one throws", () => {
    const manager = new SubscriptionManager();
    const spy1 = vi.fn();
    const throwingSpy = vi.fn(() => {
      throw new Error("Test error");
    });
    const spy2 = vi.fn();

    manager.add(spy1);
    manager.add(throwingSpy);
    manager.add(spy2);

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    manager.clear();

    expect(spy1).toHaveBeenCalledTimes(1);
    expect(throwingSpy).toHaveBeenCalledTimes(1);
    expect(spy2).toHaveBeenCalledTimes(1);
    expect(manager.size).toBe(0);
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
