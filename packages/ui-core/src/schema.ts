import { z } from "zod";
import { createMove } from "@multi-game-engines/core";

/**
 * 探索情報 (info) のランタイム・バリデーションスキーマ。
 * 2026 Best Practice: 外部（エンジン）からの入力境界で厳格な検証を行う。
 */
export const SearchInfoSchema = z.object({
  depth: z.number().optional(),
  seldepth: z.number().optional(),
  nodes: z.number().optional(),
  nps: z.number().optional(),
  time: z.number().optional(),
  multipv: z.number().optional(),
  pv: z
    .array(z.string())
    .transform((val) => val.map(createMove))
    .optional(),
  score: z
    .object({
      cp: z.number().optional(),
      mate: z.number().optional(),
    })
    .optional(),
  hashfull: z.number().optional(),
  raw: z.string().optional(),
});

export type ExtendedSearchInfo = z.infer<typeof SearchInfoSchema>;
