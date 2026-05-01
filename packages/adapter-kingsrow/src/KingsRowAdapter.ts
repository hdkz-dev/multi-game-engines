import {
  BaseAdapter,
  IEngineAdapter,
  IEngineLoader,
  EngineError,
  EngineErrorCode,
  IEngineConfig,
  ISearchTask,
  MiddlewareCommand,
  createI18nKey,
} from "@multi-game-engines/core";

import {
  ICheckersSearchOptions,
  ICheckersSearchInfo,
  ICheckersSearchResult,
  createCheckersMove,
} from "@multi-game-engines/domain-checkers";
import {
  EnglishDraughts,
  EnglishDraughtsComputerFactory,
  type EnglishDraughtsGame,
  type DraughtsMove1D,
} from "rapid-draughts/english";
import { RapidDraughtsParser } from "./KingsRowParser.js";
import { tCommon as translate } from "@multi-game-engines/i18n-common";

/**
 * 2026 Zenith Tier: Checkers adapter backed by rapid-draughts.
 *
 * Replaces the proprietary KingsRow engine (Windows DLL only, no WASM path)
 * with rapid-draughts@1.0.6 — a pure TypeScript English Draughts engine
 * that runs natively in the browser without a Web Worker or WASM build.
 *
 * Architecture:
 *   No WorkerCommunicator, no source URL needed — rapid-draughts is a
 *   bundled npm dependency. The adapter manages game state directly and
 *   calls EnglishDraughtsComputerFactory.alphaBeta() for move selection.
 */
export class KingsRowAdapter extends BaseAdapter<
  ICheckersSearchOptions,
  ICheckersSearchInfo,
  ICheckersSearchResult
> {
  readonly version: string = "1.0";
  readonly parser = new RapidDraughtsParser();

  /** Internal game state — initialised in load(). */
  private game: EnglishDraughtsGame | null = null;

  constructor(config: IEngineConfig = {}) {
    super(config);
  }

  /**
   * rapid-draughts needs no source URL. Skip the URL-based source
   * validation that BaseAdapter performs for Worker-based engines.
   */
  protected override validateSources(): void {
    // No-op: rapid-draughts is a bundled npm dep, not a remote asset.
  }

  /**
   * Initialise the English Draughts game state.
   * No loader or WASM download required.
   */
  async load(_loader?: IEngineLoader, _signal?: AbortSignal): Promise<void> {
    this.emitStatusChange("loading");
    try {
      this.game = EnglishDraughts.setup();
      this.emitStatusChange("ready");
    } catch (error) {
      this.emitStatusChange("error");
      throw EngineError.from(error, this.id);
    }
  }

  /**
   * Compute the best move for the current position using alpha-beta search.
   *
   * If `options.board` is "startpos" or the adapter is freshly loaded, the
   * internal game is reset to the standard English Draughts starting position.
   * Otherwise the adapter uses the maintained game state (updated via
   * `applyMove()` calls from the game loop).
   *
   * @param options.board  "startpos" to reset, or any value to use current state.
   * @param options.depth  Alpha-beta search depth (default: 7).
   */
  override async search(
    options: ICheckersSearchOptions,
  ): Promise<ICheckersSearchResult> {
    if (this._status !== "ready" && this._status !== "busy") {
      const i18nKey = createI18nKey("engine.errors.notLoaded");
      throw new EngineError({
        code: EngineErrorCode.NOT_READY,
        message: translate(i18nKey),
        engineId: this.id,
        i18nKey,
      });
    }

    // Reset to default position if requested or if game is uninitialised.
    const boardStr = options.board as string | undefined;
    if (!this.game || !boardStr || boardStr === "startpos") {
      this.game = EnglishDraughts.setup();
    }

    this.emitStatusChange("busy");
    try {
      const depth = typeof options.depth === "number" ? options.depth : 7;
      const computer = EnglishDraughtsComputerFactory.alphaBeta({
        maxDepth: depth,
      });

      const move = await computer(this.game);

      const result: ICheckersSearchResult = move
        ? {
            bestMove: createCheckersMove(`${move.origin}-${move.destination}`),
            raw: move,
          }
        : { bestMove: null };

      for (const cb of this.resultListeners) cb(result);
      this.emitStatusChange("ready");
      return result;
    } catch (error) {
      this.emitStatusChange("ready");
      throw EngineError.from(error, this.id);
    }
  }

  /**
   * Apply a move to the internal game state (advance the game after the
   * opponent or the engine has played a move).
   *
   * @param moveStr  Standard notation: "11-15" (origin-destination).
   */
  applyMove(moveStr: string): void {
    if (!this.game) return;
    const [o, d] = moveStr.split("-").map(Number);
    if (!o || !d) return;
    const legalMoves = this.game.moves;
    const matched = legalMoves.find(
      (m: DraughtsMove1D) => m.origin === o && m.destination === d,
    );
    if (matched) this.game.move(matched);
  }

  /**
   * `searchRaw` delegates to the overridden `search()` so that middleware
   * which calls `searchRaw` directly (e.g. EngineFacade) still works.
   */
  override searchRaw(
    _command: MiddlewareCommand,
  ): ISearchTask<ICheckersSearchInfo, ICheckersSearchResult> {
    // Build a minimal options object from the raw command if possible.
    const options: ICheckersSearchOptions = {
      board: "startpos" as ICheckersSearchOptions["board"],
    };

    const resultPromise = this.search(options);

    return {
      result: resultPromise,
      info: (async function* () {
        // rapid-draughts does not emit incremental info lines.
      })(),
      stop: () => {
        // Alpha-beta is a Promise; cancellation is not supported.
      },
    };
  }

  override async stop(): Promise<void> {
    // Alpha-beta runs to completion; we can only signal readiness.
    if (this._status === "busy") this.emitStatusChange("ready");
  }

  override async dispose(): Promise<void> {
    this.game = null;
    this.emitStatusChange("terminated");
    this.clearListeners();
  }

  protected override async onBookLoaded(_url: string): Promise<void> {
    // Checkers opening books are not supported by rapid-draughts.
  }
}

/** Alias kept for backward compatibility. */
export { KingsRowAdapter as RapidDraughtsAdapter };

export function createKingsRowAdapter(
  config: IEngineConfig,
): IEngineAdapter<
  ICheckersSearchOptions,
  ICheckersSearchInfo,
  ICheckersSearchResult
> {
  return new KingsRowAdapter(config);
}

/** @deprecated Use createKingsRowAdapter — kept for backward compat. */
export const createRapidDraughtsAdapter = createKingsRowAdapter;
