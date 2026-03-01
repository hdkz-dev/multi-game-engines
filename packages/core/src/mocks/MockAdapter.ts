import { BaseAdapter } from "../adapters/BaseAdapter.js";
import { IEngineLoader,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  ISearchTask,
  IProtocolParser,
  IEngineConfig,
  MiddlewareCommand,
  NormalizedScore, } from "../types.js";
import { createMove } from "../protocol/ProtocolValidator.js";

/**
 * CI/CD および開発用の軽量なモックアダプター。
 * 外部アセットをロードせず、即座に「ready」になり、ランダムまたは固定の回答を返します。
 */
export class MockAdapter extends BaseAdapter<
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult
> {
  readonly id: string;
  readonly name: string;
  readonly version: string = "1.0.0-mock";
  readonly parser: IProtocolParser<
    IBaseSearchOptions,
    IBaseSearchInfo,
    IBaseSearchResult
  >;

  constructor(config: IEngineConfig = {}) {
    super(config);
    this.id = config.id ?? "mock-engine";
    this.name = config.name ?? "Mock Engine";
    this.parser = new MockParser();
  }

  async load(_loader?: IEngineLoader): Promise<void> {
    this.emitStatusChange("loading");
    // 即座に完了
    this.emitStatusChange("ready");
  }

  searchRaw(
    _command: MiddlewareCommand,
  ): ISearchTask<IBaseSearchInfo, IBaseSearchResult> {
    this.emitStatusChange("busy");

    const resultPromise = new Promise<IBaseSearchResult>((resolve) => {
      // 500ms 後に回答を返す（シミュレーション）
      setTimeout(() => {
        if (this._status === "busy") {
          const result: IBaseSearchResult = {
            bestMove: createMove("e2e4"),
            raw: "bestmove e2e4",
          };
          resolve(result);
          this.emitStatusChange("ready");
        }
      }, 500);
    });

    const infoStream: AsyncIterable<IBaseSearchInfo> = {
      [Symbol.asyncIterator]: async function* () {
        yield {
          depth: 1,
          score: { cp: 10, normalized: 0.01 as NormalizedScore },
          raw: "info depth 1 score cp 10",
        };
        yield {
          depth: 2,
          score: { cp: 20, normalized: 0.02 as NormalizedScore },
          raw: "info depth 2 score cp 20",
        };
      },
    };

    return {
      info: infoStream,
      result: resultPromise,
      stop: () => {
        this.emitStatusChange("ready");
      },
    };
  }

  async stop(): Promise<void> {
    this.emitStatusChange("ready");
  }

  protected async onBookLoaded(_url: string): Promise<void> {
    // NOP
  }

  async setOption(
    _name: string,
    _value: string | number | boolean,
  ): Promise<void> {
    // NOP
  }
}

class MockParser implements IProtocolParser<
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult
> {
  createSearchCommand(_options: IBaseSearchOptions): MiddlewareCommand {
    return "go";
  }
  createStopCommand(): MiddlewareCommand {
    return "stop";
  }
  createOptionCommand(_name: string, _value: unknown): MiddlewareCommand {
    return "setoption";
  }
  parseInfo(line: string | Record<string, unknown>): IBaseSearchInfo | null {
    return typeof line === "string" ? { raw: line } : null;
  }
  parseResult(
    line: string | Record<string, unknown>,
  ): IBaseSearchResult | null {
    return typeof line === "string" ? { bestMove: "e2e4", raw: line } : null;
  }
}
