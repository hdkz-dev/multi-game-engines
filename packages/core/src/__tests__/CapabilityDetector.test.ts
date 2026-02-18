import { describe, it, expect, vi, afterEach } from "vitest";
import { CapabilityDetector } from "../capabilities/CapabilityDetector.js";

describe("CapabilityDetector", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("should detect capabilities", async () => {
    const caps = await CapabilityDetector.detect();
    expect(caps).toBeDefined();
    expect(typeof caps.opfs).toBe("boolean");
  });
});
