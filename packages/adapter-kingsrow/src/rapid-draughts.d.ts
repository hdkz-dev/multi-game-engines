/**
 * Ambient module declaration for rapid-draughts/english.
 *
 * rapid-draughts ships typesVersions barrel re-exports that TypeScript 6 +
 * NodeNext cannot follow (the barrel uses extension-less relative paths).
 * This declaration patches the missing exports so tsc --emitDeclarationOnly
 * succeeds without changing the runtime behaviour (tsup/esbuild resolves the
 * real package correctly).
 */
declare module "rapid-draughts/english" {
  import type {
    DraughtsMove1D,
    DraughtsBoard1D,
    DraughtsStatus,
    DraughtsPlayer,
  } from "rapid-draughts";

  export type { DraughtsMove1D, DraughtsBoard1D };
  export { DraughtsStatus, DraughtsPlayer };

  /** English Draughts game instance. */
  export interface EnglishDraughtsGame {
    readonly status: DraughtsStatus;
    readonly player: DraughtsPlayer;
    readonly board: DraughtsBoard1D;
    readonly moves: DraughtsMove1D[];
    isValidMove(move: DraughtsMove1D): boolean;
    move(move: DraughtsMove1D): void;
    asciiBoard(): string;
  }

  /** Computer function: given a game, asynchronously returns the best move. */
  export type EnglishDraughtsComputer = (
    game: EnglishDraughtsGame,
  ) => Promise<DraughtsMove1D>;

  /** Factory for creating English Draughts game instances. */
  export const EnglishDraughts: {
    setup(
      data?: Record<string, unknown>,
      history?: Record<string, unknown>,
    ): EnglishDraughtsGame;
  };

  /** Factory for creating computer opponents. */
  export const EnglishDraughtsComputerFactory: {
    random(): EnglishDraughtsComputer;
    alphaBeta(options: { maxDepth?: number }): EnglishDraughtsComputer;
  };
}
