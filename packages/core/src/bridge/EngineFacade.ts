import {
  IEngine,
  IEngineAdapter,
  EngineStatus,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  IMiddleware,
  ISearchTask,
  IMiddlewareContext,
} from "../types";

/**
 * 利用者がエンジンを操作するための Facade 実装。
 */
export class EngineFacade<
  T_OPTIONS extends IBaseSearchOptions,
  T_INFO extends IBaseSearchInfo,
  T_RESULT extends IBaseSearchResult,
> implements IEngine<T_OPTIONS, T_INFO, T_RESULT> {
  private activeTask: ISearchTask<T_INFO, T_RESULT> | null = null;

  constructor(
    private readonly adapter: IEngineAdapter<T_OPTIONS, T_INFO, T_RESULT>,
    private readonly middlewares: IMiddleware<T_INFO, T_RESULT>[] = []
  ) {}

  get id(): string { return this.adapter.id; }
  get name(): string { return this.adapter.name; }
  get version(): string { return this.adapter.version; }

  get status(): EngineStatus {
    return this.adapter.status;
  }

  async load(): Promise<void> {
    await this.adapter.load();
  }

  /**
   * 探索を実行します。
   */
  async search(options: T_OPTIONS): Promise<T_RESULT> {
    await this.stop();

    const context: IMiddlewareContext<T_OPTIONS> = {
      engineId: this.id,
      options,
    };

    let command = this.adapter.parser.createSearchCommand(options);
    for (const mw of this.middlewares) {
      if (mw.onCommand) {
        command = await mw.onCommand(command, context);
      }
    }

    const task = this.adapter.searchRaw(command);
    this.activeTask = task;

    try {
      let result = await task.result;
      for (const mw of this.middlewares) {
        if (mw.onResult) {
          result = await mw.onResult(result, context);
        }
      }
      return result;
    } finally {
      this.activeTask = null;
    }
  }

  /**
   * 思考状況を購読します。
   */
  onInfo(callback: (info: T_INFO) => void): () => void {
    let isDisposed = false;

    const runInfoLoop = async () => {
      if (!this.activeTask) return;
      
      const context: IMiddlewareContext<T_OPTIONS> = {
        engineId: this.id,
        options: {} as T_OPTIONS, 
      };

      try {
        for await (let info of this.activeTask.info) {
          if (isDisposed) break;

          for (const mw of this.middlewares) {
            if (mw.onInfo) {
              info = await mw.onInfo(info, context);
            }
          }
          callback(info);
        }
      } catch (err) {
        // 中断時はエラーを無視
        if (!isDisposed) {
          console.error("[EngineFacade] Info stream error:", err);
        }
      }
    };

    void runInfoLoop();

    return () => {
      isDisposed = true;
    };
  }

  async stop(): Promise<void> {
    if (this.activeTask) {
      await this.activeTask.stop();
      this.activeTask = null;
    }
  }

  async dispose(): Promise<void> {
    await this.stop();
    await this.adapter.dispose();
  }
}
