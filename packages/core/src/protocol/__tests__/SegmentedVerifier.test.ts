import { describe, it, expect } from "vitest";
import { SegmentedVerifier } from "../SegmentedVerifier.js";
import { ISegmentedSRI, EngineErrorCode } from "../../types.js";

describe("SegmentedVerifier", () => {
  const dummyData = new Uint8Array([1, 2, 3, 4, 5, 6]);

  const calcHash = async (data: Uint8Array, algo = "SHA-256") => {
    const digest = await crypto.subtle.digest(algo, data as unknown as ArrayBuffer);
    const prefix = algo.toLowerCase().replace("-", "");
    return prefix + "-" + btoa(String.fromCharCode(...new Uint8Array(digest)));
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

  it("should throw SRI_MISMATCH if segment count doesn't match data size", async () => {
    const h1 = await calcHash(new Uint8Array([1, 2, 3, 4, 5, 6]));

    const segmentedSri: ISegmentedSRI = {
      segmentSize: 3, // Expected 2 segments for 6 bytes
      hashes: [h1],
    };

    await expect(
      SegmentedVerifier.assertSegmented(dummyData.buffer, segmentedSri),
    ).rejects.toThrow(
      expect.objectContaining({ code: EngineErrorCode.SRI_MISMATCH }),
    );
  });

  it("should support sha384 and sha512", async () => {
    // Basic structural check for failure
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

  it("should support sha384 success case", async () => {
    const h = await calcHash(new Uint8Array([1, 2, 3]), "SHA-384");
    expect(await SegmentedVerifier.verifySegment(new Uint8Array([1, 2, 3]), h)).toBe(true);
  });

  it("should support sha512 success case", async () => {
    const h = await calcHash(new Uint8Array([1, 2, 3]), "SHA-512");
    expect(await SegmentedVerifier.verifySegment(new Uint8Array([1, 2, 3]), h)).toBe(true);
  });
});
