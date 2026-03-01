import { describe, it, expect } from "vitest";
import { XiangqiAdapter } from "../XiangqiAdapter.js";

describe("XiangqiAdapter", () => {
  it("should have correct id and name", () => {
    const adapter = new XiangqiAdapter({
      id: "custom-xq",
      name: "Custom Xiangqi",
    });
    expect(adapter.id).toBe("custom-xq");
    expect(adapter.name).toBe("Custom Xiangqi");
  });
});
