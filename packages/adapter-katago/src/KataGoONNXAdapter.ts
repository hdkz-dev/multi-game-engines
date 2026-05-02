import {
  BaseAdapter,
  IEngineAdapter,
  IEngineLoader,
  EngineError,
  EngineErrorCode,
  IEngineConfig,
  ISearchTask,
  MiddlewareCommand,
  createI18nKey, createMove 
} from "@multi-game-engines/core";
import type {
  IGoSearchOptions,
  IGoSearchInfo,
  IGoSearchResult,
} from "@multi-game-engines/domain-go";
import type { InferenceSession } from "onnxruntime-web";
import { KataGoBoard } from "./KataGoBoard.js";
import { encodePosition, decodePolicy } from "./KataGoEncoder.js";
import { tCommon as translate } from "@multi-game-engines/i18n-common";

/**
 * KataGo ONNX adapter.
 *
 * Loads a pre-converted KataGo ONNX model (fp32, b6c96 or similar) via
 * onnxruntime-web and runs policy/value inference directly in the browser
 * without a Web Worker or proprietary binary.
 *
 * Architecture:
 *   - Model URL supplied via config.sources.main.url
 *   - InferenceSession created once in load()
 *   - Board state maintained across moves via KataGoBoard
 *   - search() encodes position → runs session → returns best policy move
 *
 * @example
 * ```typescript
 * const engine = createKataGoEngine({ sources: { main: { url: MODEL_URL } } });
 * await engine.load();
 * const result = await engine.search({ board: "startpos", size: 19, komi: 6.5 });
 * console.log(result.bestMove); // e.g. "D4"
 * ```
 */
export class KataGoONNXAdapter extends BaseAdapter<
  IGoSearchOptions,
  IGoSearchInfo,
  IGoSearchResult
> {
  readonly version: string = "1.14";
  // Parser not used for direct ONNX inference, but required by BaseAdapter.
  readonly parser = {
    parseInfo: () => null,
    parseResult: () => null,
    createSearchCommand: () => [""],
    createStopCommand: () => "",
    createOptionCommand: () => "",
  };

  private _session: InferenceSession | null = null;
  private _board: KataGoBoard = new KataGoBoard(19);

  constructor(config: IEngineConfig = {}) {
    super({ id: "katago", name: "KataGo", ...config });
  }

  /** No source URL validation — ONNX model URL is supplied via config. */
  protected override validateSources(): void {
    // Validation deferred to load() where we verify the URL resolves.
  }

  /**
   * Load the ONNX model from config.sources.main.url.
   * Falls back to a default model URL if none is provided.
   */
  async load(_loader?: IEngineLoader, signal?: AbortSignal): Promise<void> {
    this.emitStatusChange("loading");
    try {
      // Dynamically import to allow tree-shaking when adapter is unused.
      const ort = await import("onnxruntime-web");

      const modelUrl =
        (this.config.sources?.main as { url?: string } | undefined)?.url ??
        "https://hdkz-dev.github.io/multi-game-engines/assets/katago/1.14/katago-b6c96.onnx";

      const sessionOptions: Record<string, unknown> = {
        executionProviders: ["wasm"],
        graphOptimizationLevel: "all",
      };

      if (signal?.aborted) {
        this.emitStatusChange("error");
        throw new EngineError({
          code: EngineErrorCode.LIFECYCLE_ERROR,
          message: "Load aborted",
          engineId: this.id,
        });
      }

      this._session = await ort.InferenceSession.create(
        modelUrl,
        sessionOptions,
      );
      this._board.reset();
      this.emitStatusChange("ready");
    } catch (error) {
      this.emitStatusChange("error");
      throw EngineError.from(error, this.id);
    }
  }

  /**
   * Run ONNX inference to find the best move.
   *
   * @param options - Search options.
   * Supply `options.board = "startpos"` to reset the board.
   * Supply `options.size` for board size (default 19) and `options.komi` (default 6.5).
   */
  override async search(options: IGoSearchOptions): Promise<IGoSearchResult> {
    if (this._status !== "ready" && this._status !== "busy") {
      const i18nKey = createI18nKey("engine.errors.notLoaded");
      throw new EngineError({
        code: EngineErrorCode.NOT_READY,
        message: translate(i18nKey),
        engineId: this.id,
        i18nKey,
      });
    }

    if (!this._session) {
      throw new EngineError({
        code: EngineErrorCode.NOT_READY,
        message: "ONNX session not initialised — call load() first",
        engineId: this.id,
      });
    }

    const size = typeof options.size === "number" ? options.size : 19;
    const komi = typeof options.komi === "number" ? options.komi : 6.5;

    // Reset board if startpos requested or board size changed
    const boardStr = options.board as string | undefined;
    if (!boardStr || boardStr === "startpos" || this._board.size !== size) {
      this._board = new KataGoBoard(size);
    }

    this.emitStatusChange("busy");
    try {
      const ort = await import("onnxruntime-web");
      const { binInput, globalInput } = encodePosition(this._board, komi);
      const N = size;

      const feeds: Record<string, InstanceType<typeof ort.Tensor>> = {
        bin_input_global_ncplane: new ort.Tensor("float32", binInput, [
          1,
          22,
          N,
          N,
        ]),
        global_input: new ort.Tensor("float32", globalInput, [1, 19]),
      };

      const results = await this._session.run(feeds);

      // KataGo output: "policy" tensor of shape [1, N*N+1]
      const policyTensor =
        results["policy"] ??
        results["policy_output"] ??
        Object.values(results)[0];

      if (!policyTensor) {
        this.emitStatusChange("ready");
        return { bestMove: null };
      }

      const policyData = policyTensor.data as Float32Array;
      const decoded = decodePolicy(policyData, N);

      // Pick the highest-probability legal move (skip ko point)
      const koIdx = this._board.koPoint;
      const best = decoded.find((m) => m.gtp === "pass" || m.index !== koIdx);

      const bestGtp = best?.gtp ?? "pass";
      const result: IGoSearchResult = {
        bestMove:
          bestGtp === "pass"
            ? null
            : (createMove(bestGtp) as IGoSearchResult["bestMove"]),
        raw: { gtp: bestGtp, prob: best?.prob },
      };

      for (const cb of this.resultListeners) cb(result);
      this.emitStatusChange("ready");
      return result;
    } catch (error) {
      this.emitStatusChange("ready");
      throw EngineError.from(error, this.id);
    }
  }

  /**
   * Advance internal board state by one move (GTP notation: "D4", "pass").
   * Call this after each move (engine or opponent) to keep the model context.
   */
  applyMove(gtpMove: string): void {
    this._board.applyMove(gtpMove);
  }

  override searchRaw(
    _command: MiddlewareCommand,
  ): ISearchTask<IGoSearchInfo, IGoSearchResult> {
    const options: IGoSearchOptions = { board: "startpos", size: 19 };
    const resultPromise = this.search(options);
    return {
      result: resultPromise,
      info: (async function* () {})(),
      stop: () => {},
    };
  }

  override async stop(): Promise<void> {
    if (this._status === "busy") this.emitStatusChange("ready");
  }

  override async dispose(): Promise<void> {
    if (this._session) {
      await this._session.release();
      this._session = null;
    }
    this.emitStatusChange("terminated");
    this.clearListeners();
  }

  protected override async onBookLoaded(_url: string): Promise<void> {
    // Opening books are not applicable for ONNX inference.
  }
}

export function createKataGoAdapter(
  config: IEngineConfig,
): IEngineAdapter<IGoSearchOptions, IGoSearchInfo, IGoSearchResult> {
  return new KataGoONNXAdapter(config);
}
