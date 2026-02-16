import { z } from "zod";
import { createMove } from "@multi-game-engines/core";

/**
 * 探索情報 (info) のランタイム・バリデーションスキーマ。
 * 2026 Best Practice: 外部（エンジン）からの入力境界で厳格な検証を行う。
 */
export const SearchInfoSchema = z.object({
  depth: z.number().int().nonnegative().optional(),
  seldepth: z.number().int().nonnegative().optional(),
  nodes: z.number().int().nonnegative().optional(),
  nps: z.number().int().nonnegative().optional(),
  time: z.number().int().nonnegative().optional(),
  multipv: z.number().int().positive().optional(),
  pv: z
    .array(z.string())
    .transform((val) => val.map(createMove))
    .optional(),
  score: z
    .object({
      cp: z.number().int().optional(),
      mate: z.number().int().optional(),
      points: z.number().optional(),
      winrate: z.number().min(0).max(1).optional(),
    })
    .optional(),
  visits: z.number().int().nonnegative().optional(),
  hashfull: z.number().int().min(0).max(1000).optional(),
  raw: z.string().optional(),
});

export type ExtendedSearchInfo = z.infer<typeof SearchInfoSchema>;
