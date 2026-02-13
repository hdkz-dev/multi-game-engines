import { describe, it, expect } from "vitest";
import { CapabilityDetector } from "../capabilities/CapabilityDetector.js";

describe("CapabilityDetector", () => {
  it("should detect capabilities", async () => {
    const caps = await CapabilityDetector.detect();
    expect(caps).toBeDefined();
    expect(typeof caps.opfs).toBe("boolean");
  });
});
