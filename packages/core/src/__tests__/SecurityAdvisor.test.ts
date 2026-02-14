import { describe, it, expect } from "vitest";
import { SecurityAdvisor } from "../capabilities/SecurityAdvisor.js";

describe("SecurityAdvisor", () => {
  it("should verify SRI correctly", async () => {
    // Mock data and SRI
    const encoded = new TextEncoder().encode("test");
    // Node.jsのプールされたバッファを避け、独立したArrayBufferを確実に作成
    const data = encoded.buffer.slice(
      encoded.byteOffset,
      encoded.byteOffset + encoded.byteLength,
    );

    // sha256 of "test" is 9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08
    // in base64: n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg=
    const sri = "sha256-n4bQgYhMfWWaL+qgxVrQFaO/TxsrC4Is0V1sFbDwCgg=";

    const isValid = await SecurityAdvisor.verifySRI(data, sri);
    expect(isValid).toBe(true);
  });
});
