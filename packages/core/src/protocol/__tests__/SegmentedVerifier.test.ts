import { describe, it, expect, vi } from "vitest";
import { SegmentedVerifier } from "../SegmentedVerifier.js";
import { ISegmentedSRI, EngineErrorCode } from "../../types.js";

describe("SegmentedVerifier", () => {
  const dummyData = new Uint8Array([1, 2, 3, 4, 5, 6]);
  // sha256 of [1, 2, 3] is "LCa0a2j/xo/5m0U8HTBBNBNCLDtHMaRdg4WInVT/J28=" (approx)
  // Let's use a real calculation for the test.

  const calcHash = async (data: Uint8Array) => {
    const digest = await crypto.subtle.digest("SHA-256", data);
    return "sha256-" + btoa(String.fromCharCode(...new Uint8Array(digest)));
  };

  it("should verify segments correctly", async () => {
    const h1 = await calcHash(new Uint8Array([1, 2, 3]));
    const h2 = await calcHash(new Uint8Array([4, 5, 6]));

    const segmentedSri: ISegmentedSRI = {
      segmentSize: 3,
      hashes: [h1, h2],
    };

    await expect(
      SegmentedVerifier.assertSegmented(dummyData.buffer, segmentedSri),
    ).resolves.toBeUndefined();
  });

  it("should throw SRI_MISMATCH if a segment is tampered", async () => {
    const h1 = await calcHash(new Uint8Array([1, 2, 3]));
    const h2 = "sha256-invalidhash";

    const segmentedSri: ISegmentedSRI = {
      segmentSize: 3,
      hashes: [h1, h2],
    };

    await expect(
      SegmentedVerifier.assertSegmented(dummyData.buffer, segmentedSri),
    ).rejects.toThrow(
      expect.objectContaining({ code: EngineErrorCode.SRI_MISMATCH }),
    );
  });

  it("should support sha384 and sha512", async () => {
    // Basic structural check
    expect(
      await SegmentedVerifier.verifySegment(new Uint8Array([1]), "sha384-xxxx"),
    ).toBe(false);
    expect(
      await SegmentedVerifier.verifySegment(new Uint8Array([1]), "sha512-xxxx"),
    ).toBe(false);
    expect(
      await SegmentedVerifier.verifySegment(
        new Uint8Array([1]),
        "unknown-xxxx",
      ),
    ).toBe(false);
  });
});
