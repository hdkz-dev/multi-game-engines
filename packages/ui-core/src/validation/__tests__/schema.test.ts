import { describe, it, expect } from "vitest";
import { SearchInfoSchema } from "../schema.js";

describe("SearchInfoSchema", () => {
  // ─── 正常系: 構造化スコア ─────────────────────────

  describe("valid structured score", () => {
    it("should accept { cp: 100 }", () => {
      const result = SearchInfoSchema.safeParse({
        score: { cp: 100 },
        depth: 10,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.score).toEqual({ cp: 100 });
      }
    });

    it("should accept { mate: 5 }", () => {
      const result = SearchInfoSchema.safeParse({
        score: { mate: 5 },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.score).toEqual({ mate: 5 });
      }
    });

    it("should accept { cp: -200 } (negative)", () => {
      const result = SearchInfoSchema.safeParse({
        score: { cp: -200 },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.score).toEqual({ cp: -200 });
      }
    });

    it("should accept { mate: -3 } (opponent winning)", () => {
      const result = SearchInfoSchema.safeParse({
        score: { mate: -3 },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.score).toEqual({ mate: -3 });
      }
    });

    it("should accept { cp: 0 } (drawn position)", () => {
      const result = SearchInfoSchema.safeParse({
        score: { cp: 0 },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.score).toEqual({ cp: 0 });
      }
    });

    it("should accept when both cp and mate are present", () => {
      // 実際には起こらないが、スキーマレベルでは両方 optional なので受け入れる
      const result = SearchInfoSchema.safeParse({
        score: { cp: 100, mate: 5 },
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.score).toEqual({ cp: 100, mate: 5 });
      }
    });
  });

  // ─── 異常系: 不正なスコア ─────────────────────────

  describe("invalid score format", () => {
    it("should reject flat number score", () => {
      const result = SearchInfoSchema.safeParse({
        score: 100,
      });
      expect(result.success).toBe(false);
    });

    it("should reject string score", () => {
      const result = SearchInfoSchema.safeParse({
        score: "100",
      });
      expect(result.success).toBe(false);
    });

    it("should reject score with non-numeric cp", () => {
      const result = SearchInfoSchema.safeParse({
        score: { cp: "abc" },
      });
      expect(result.success).toBe(false);
    });
  });

  // ─── スコアなし / 空オブジェクト ──────────────────

  describe("missing or empty score", () => {
    it("should accept info without score", () => {
      const result = SearchInfoSchema.safeParse({
        depth: 15,
        nodes: 1000,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.score).toBeUndefined();
      }
    });

    it("should accept completely empty object", () => {
      const result = SearchInfoSchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("should accept score as empty object (both cp/mate undefined)", () => {
      const result = SearchInfoSchema.safeParse({
        score: {},
      });
      expect(result.success).toBe(true);
    });
  });

  // ─── PV の変換 ────────────────────────────────────

  describe("pv transform", () => {
    it("should transform string array pv into Move branded types", () => {
      const result = SearchInfoSchema.safeParse({
        pv: ["e2e4", "e7e5", "g1f3"],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        // createMove returns branded strings that are still strings at runtime
        expect(result.data.pv).toEqual(["e2e4", "e7e5", "g1f3"]);
      }
    });
  });

  // ─── 余分なフィールドの除去 ───────────────────────

  describe("extra fields", () => {
    it("should strip unknown fields (Zod strict stripping)", () => {
      const result = SearchInfoSchema.safeParse({
        depth: 10,
        unknownField: "should be ignored",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).not.toHaveProperty("unknownField");
      }
    });
  });
});
