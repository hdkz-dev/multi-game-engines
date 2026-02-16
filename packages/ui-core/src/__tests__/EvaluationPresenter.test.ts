import { describe, it, expect } from "vitest";
import { EvaluationPresenter } from "../presentation.js";
import { EvaluationScore, IEvaluationHistoryEntry } from "../types.js";

describe("EvaluationPresenter", () => {
  describe("getColorClass", () => {
    it("should return correct class for mate score", () => {
      const score: EvaluationScore = {
        type: "mate",
        value: 5,
        relativeValue: 5,
      };
      expect(EvaluationPresenter.getColorClass(score)).toContain(
        "bg-score-mate",
      );
    });

    it("should return correct class for negative mate score", () => {
      const score: EvaluationScore = {
        type: "mate",
        value: -2,
        relativeValue: -2,
      };
      expect(EvaluationPresenter.getColorClass(score)).toContain("bg-red-600");
    });

    it("should return correct class for high positive cp score", () => {
      const score: EvaluationScore = {
        type: "cp",
        value: 150,
        relativeValue: 150,
      };
      expect(EvaluationPresenter.getColorClass(score)).toContain(
        "bg-score-plus",
      );
    });

    it("should return correct class for high negative cp score", () => {
      const score: EvaluationScore = {
        type: "cp",
        value: -200,
        relativeValue: -200,
      };
      expect(EvaluationPresenter.getColorClass(score)).toContain(
        "bg-score-minus",
      );
    });

    it("should return correct class for neutral cp score", () => {
      const score: EvaluationScore = {
        type: "cp",
        value: 50,
        relativeValue: 50,
      };
      expect(EvaluationPresenter.getColorClass(score)).toContain(
        "bg-score-neutral",
      );
    });

    it("should invert colors if inverted is true", () => {
      const score: EvaluationScore = {
        type: "cp",
        value: 150,
        relativeValue: 150,
      };
      expect(EvaluationPresenter.getColorClass(score, true)).toContain(
        "bg-score-minus",
      );
    });
  });

  describe("getDisplayLabel", () => {
    it("should format mate score correctly", () => {
      const score: EvaluationScore = {
        type: "mate",
        value: 3,
        relativeValue: 3,
      };
      expect(EvaluationPresenter.getDisplayLabel(score)).toBe("M3");
    });

    it("should format positive cp score correctly", () => {
      const score: EvaluationScore = {
        type: "cp",
        value: 123,
        relativeValue: 123,
      };
      expect(EvaluationPresenter.getDisplayLabel(score)).toBe("+1.23");
    });

    it("should format negative cp score correctly", () => {
      const score: EvaluationScore = {
        type: "cp",
        value: -5,
        relativeValue: -5,
      };
      expect(EvaluationPresenter.getDisplayLabel(score)).toBe("-0.05");
    });

    it("should format zero cp score correctly", () => {
      const score: EvaluationScore = { type: "cp", value: 0, relativeValue: 0 };
      expect(EvaluationPresenter.getDisplayLabel(score)).toBe("+0.00");
    });
  });

  describe("getGraphPoints", () => {
    const entries: IEvaluationHistoryEntry[] = [
      { score: { type: "cp", value: 0, relativeValue: 0 }, timestamp: 0 },
      { score: { type: "cp", value: 500, relativeValue: 500 }, timestamp: 1 },
      {
        score: { type: "cp", value: -1000, relativeValue: -1000 },
        timestamp: 2,
      },
      { score: { type: "mate", value: 1, relativeValue: 1 }, timestamp: 3 },
    ];

    it("should calculate correct points", () => {
      const points = EvaluationPresenter.getGraphPoints(
        entries,
        200,
        100,
        1000,
      );
      expect(points).toHaveLength(4);
      // y=50 (center) for 0 score
      expect(points[0].y).toBe(50);
      // y=25 for +500 score (halfway to top)
      expect(points[1].y).toBe(25);
      // y=100 for -1000 score (bottom)
      expect(points[2].y).toBe(100);
      // y=0 for mate > 0 (top)
      expect(points[3].y).toBe(0);
    });

    it("should return empty array for no entries", () => {
      const points = EvaluationPresenter.getGraphPoints([], 200, 100, 1000);
      expect(points).toEqual([]);
    });
  });
});
