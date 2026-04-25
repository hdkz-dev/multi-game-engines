import { describe, it, expect, vi, beforeEach } from "vitest";
import { EngineConcurrencyController } from "../EngineConcurrencyController.js";

describe("EngineConcurrencyController", () => {
  beforeEach(() => {
    vi.stubGlobal("navigator", { deviceMemory: 8 });
  });

  it("should limit active engines based on RAM", async () => {
    const controller = new EngineConcurrencyController(2); // Force 2

    await controller.requestActive("e1");
    await controller.requestActive("e2");

    const onSuspend = vi.fn();
    await controller.requestActive("e3", onSuspend);

    expect(onSuspend).toHaveBeenCalledWith("e1");
  });

  it("should auto-limit to 1 if deviceMemory is low", async () => {
    vi.stubGlobal("navigator", { deviceMemory: 2 });
    const controller = new EngineConcurrencyController(); // Should detect 1

    await controller.requestActive("e1");
    const onSuspend = vi.fn();
    await controller.requestActive("e2", onSuspend);

    expect(onSuspend).toHaveBeenCalledWith("e1");
  });

  it("should update status correctly", async () => {
    const controller = new EngineConcurrencyController(1);
    controller.updateStatus("e1", "busy");
    // e1 is now active

    // release
    controller.releaseActive("e1");
    // next one should not need suspension of e1
    const onSuspend = vi.fn();
    await controller.requestActive("e2", onSuspend);
    expect(onSuspend).not.toHaveBeenCalled();
  });

  it("should remove from active on ready or error status", async () => {
    const controller = new EngineConcurrencyController(2);
    await controller.requestActive("e1");

    // After "ready", e1 should be removed from active — verify indirectly:
    // with max=2 and e1 gone, adding e2+e3 should NOT suspend e1.
    controller.updateStatus("e1", "ready");
    const onSuspend = vi.fn();
    await controller.requestActive("e2", onSuspend);
    await controller.requestActive("e3", onSuspend);
    expect(onSuspend).not.toHaveBeenCalledWith("e1");

    // After "error", e2 should also be removed — e4 can be added without suspending e2.
    controller.updateStatus("e2", "error");
    const onSuspend2 = vi.fn();
    await controller.requestActive("e4", onSuspend2);
    expect(onSuspend2).not.toHaveBeenCalledWith("e2");
  });
});
