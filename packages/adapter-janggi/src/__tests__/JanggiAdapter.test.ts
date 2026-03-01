import { describe, it, expect } from "vitest";
import { JanggiAdapter } from "../JanggiAdapter.js";

describe("JanggiAdapter", () => {
  it("should have correct id and name", () => {
    const adapter = new JanggiAdapter({
      id: "custom-jg",
      name: "Custom Janggi",
    });
    expect(adapter.id).toBe("custom-jg");
    expect(adapter.name).toBe("Custom Janggi");
  });
});
