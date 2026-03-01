import { describe, it, expect } from "vitest";
import { deepMerge } from "../deepMerge.js";

describe("deepMerge", () => {
  it("should merge shallow objects", () => {
    const target = { a: 1, b: 2 };
    const source = { b: 3, c: 4 };
    expect(deepMerge(target, source as unknown as typeof target)).toEqual({
      a: 1,
      b: 3,
      c: 4,
    });
  });

  it("should merge nested objects", () => {
    const target = { a: { x: 1, y: 2 }, b: 2 };
    const source = { a: { y: 3, z: 4 }, c: 4 };
    expect(deepMerge(target, source as unknown as typeof target)).toEqual({
      a: { x: 1, y: 3, z: 4 },
      b: 2,
      c: 4,
    });
  });

  it("should return target if source is undefined", () => {
    const target = { a: 1 };
    expect(deepMerge(target, undefined as unknown as typeof target)).toBe(
      target,
    );
  });

  it("should handle null or non-object values gracefully", () => {
    const target = { a: { x: 1 } };
    const source = { a: null };
    expect(deepMerge(target, source as unknown as typeof target)).toEqual({
      a: null,
    });
  });

  it("should prevent prototype pollution", () => {
    const target = {} as Record<string, unknown>;
    const source = JSON.parse('{"__proto__": {"polluted": true}}') as Record<
      string,
      unknown
    >;

    deepMerge(target, source);
    expect((target as Record<string, unknown>).polluted).toBeUndefined();
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it("should overwrite arrays rather than merging them (current implementation behavior)", () => {
    const target = { a: [1, 2] };
    const source = { a: [3] };
    expect(deepMerge(target, source as unknown as typeof target)).toEqual({
      a: [3],
    });
  });
});
