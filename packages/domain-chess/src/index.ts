import {
  EngineErrorCode,
  EngineError,
  PositionString,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  IScoreInfo,
  Move,
  I18nKey,
} from "@multi-game-engines/core";
import { t as translate } from "@multi-game-engines/i18n";

/**
 * Branded Type for FEN (Forsyth-Edwards Notation) strings.
 */
export type FEN = PositionString<"FEN">;

/**
 * チェス用の探索オプション。
 */
export interface IChessSearchOptions extends IBaseSearchOptions {
  fen?: FEN | undefined;
  depth?: number | undefined;
  time?: number | undefined;
  nodes?: number | undefined;
}

/**
 * チェス用の思考情報。
 */
export interface IChessSearchInfo extends IBaseSearchInfo {
  depth?: number | undefined;
  seldepth?: number | undefined;
  score?: IScoreInfo | undefined;
  nodes?: number | undefined;
  nps?: number | undefined;
  time?: number | undefined;
  pv?: Move[] | undefined;
  hashfull?: number | undefined;
  multipv?: number | undefined;
}

/**
 * チェス用の探索結果。
 */
export interface IChessSearchResult extends IBaseSearchResult {
  bestMove: Move | null;
  ponder?: Move | null | undefined;
}

/**
 * チェスの駒識別子。
 */
export type ChessPiece =
  | "P"
  | "N"
  | "B"
  | "R"
  | "Q"
  | "K"
  | "p"
  | "n"
  | "b"
  | "r"
  | "q"
  | "k";

/**
 * Parsed FEN result containing the 2D board array and turn metadata.
 */
export interface ParsedFEN {
  /** 8x8 grid of pieces. board[0] is Rank 8, board[7] is Rank 1. */
  board: (ChessPiece | null)[][];
  /** Whose turn it is: 'w' for White, 'b' for Black. */
  turn: "w" | "b";
}

/**
 * FEN 形式の文字列を厳密に検証し、Branded Type を返します。
 */
export function createFEN(pos: string): FEN {
  if (typeof pos !== "string" || pos.trim().length === 0) {
    const i18nKey = "engine.errors.invalidFEN" as I18nKey;
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: translate(i18nKey),
      i18nKey,
    });
  }
  const trimmedPos = pos.trim();
  if (trimmedPos === "startpos") {
    return "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" as FEN;
  }
  if (!/^[0-9a-hRNBQKPpnbrqkw/ -]+$/.test(trimmedPos)) {
    const i18nKey = "engine.errors.illegalCharacters" as I18nKey;
    throw new EngineError({
      code: EngineErrorCode.SECURITY_ERROR,
      message: translate(i18nKey),
      i18nKey,
      remediation:
        "FEN should only contain digits [0-9], files [a-h], pieces [rnbqkpRNBQKP], active color [wb], '/', ' ', and '-'.",
    });
  }
  const fields = trimmedPos.split(/\s+/);
  if (fields.length !== 6) {
    const i18nKey = "engine.errors.invalidFENStructure" as I18nKey;
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: translate(i18nKey),
      i18nKey,
    });
  }

  // 2nd field: Active color (w or b)
  if (!/^[wb]$/.test(fields[1]!)) {
    const i18nKey = "engine.errors.invalidFENTurn" as I18nKey;
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: translate(i18nKey),
      i18nKey,
    });
  }

  // 4th field: En passant target square (- or a-h3/a-h6)
  if (!/^(?:-|[a-h][36])$/.test(fields[3]!)) {
    const i18nKey = "engine.errors.invalidFENEnPassant" as I18nKey;
    const i18nParams = { square: fields[3]! };
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: translate(i18nKey, i18nParams),
      i18nKey,
      i18nParams,
    });
  }

  // 3rd field: Castling rights (K, Q, k, q or -)
  const castling = fields[2]!;
  const isValidCastling =
    /^(?:[KQkq]{1,4}|-)$/.test(castling) &&
    (castling === "-" || new Set(castling).size === castling.length);

  if (!isValidCastling) {
    const i18nKey = "engine.errors.invalidFENCastling" as I18nKey;
    const i18nParams = { rights: castling };
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: translate(i18nKey, i18nParams),
      i18nKey,
      i18nParams,
    });
  }

  // 5th field: Halfmove clock (>= 0)
  const halfmove = Number(fields[4]!);
  if (!Number.isInteger(halfmove) || halfmove < 0) {
    const i18nKey = "engine.errors.invalidFENHalfmove" as I18nKey;
    const i18nParams = { clock: fields[4]! };
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: translate(i18nKey, i18nParams),
      i18nKey,
      i18nParams,
    });
  }

  // 6th field: Fullmove number (>= 1)
  const fullmove = Number(fields[5]!);
  if (!Number.isInteger(fullmove) || fullmove < 1) {
    const i18nKey = "engine.errors.invalidFENFullmove" as I18nKey;
    const i18nParams = { move: fields[5]! };
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: translate(i18nKey, i18nParams),
      i18nKey,
      i18nParams,
    });
  }

  return trimmedPos as FEN;
}

export function isValidChessPiece(char: string): char is ChessPiece {
  return /^[PNBRQKpnbrqk]$/.test(char);
}

/**
 * FEN 文字列を解析して 2D 盤面配列に変換します。
 */
export function parseFEN(fen: FEN): ParsedFEN {
  const parts = fen.trim().split(/\s+/);
  const position = parts[0]!;
  const turn = parts[1] as "w" | "b";

  const rows = position.split("/");
  if (rows.length !== 8) {
    const i18nKey = "engine.errors.invalidFenRanks" as I18nKey;
    throw new EngineError({
      code: EngineErrorCode.VALIDATION_ERROR,
      message: translate(i18nKey),
      i18nKey,
    });
  }

  const board: (ChessPiece | null)[][] = [];
  for (let r = 0; r < 8; r++) {
    const row = rows[r]!;
    const boardRow: (ChessPiece | null)[] = [];
    for (const char of row) {
      if (/[1-8]/.test(char)) {
        const emptyCount = parseInt(char, 10);
        for (let i = 0; i < emptyCount; i++) boardRow.push(null);
      } else if (isValidChessPiece(char)) {
        boardRow.push(char);
      } else {
        const i18nKey = "engine.errors.invalidFenChar" as I18nKey;
        const i18nParams = { char };
        throw new EngineError({
          code: EngineErrorCode.VALIDATION_ERROR,
          message: translate(i18nKey, i18nParams),
          i18nKey,
          i18nParams,
        });
      }
    }
    if (boardRow.length !== 8) {
      const i18nKey = "engine.errors.invalidFenRankWidth" as I18nKey;
      const i18nParams = { rank: 8 - r, expected: 8, actual: boardRow.length };
      throw new EngineError({
        code: EngineErrorCode.VALIDATION_ERROR,
        message: translate(i18nKey, i18nParams),
        i18nKey,
        i18nParams,
      });
    }
    board.push(boardRow);
  }
  return { board, turn };
}
