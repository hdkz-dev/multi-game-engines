import {
  IEngine,
  IEngineAdapter,
  IMiddleware,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  ISearchTask,
  EngineStatus,
  IMiddlewareContext,
  EngineErrorCode,
} from "../types";
import { EngineBridge } from "./EngineBridge";
import { EngineError } from "../errors/EngineError";

/**
 * エンジン操作の窓口となる Facade クラス。
 * 
 * [設計意図]
 * 1. 複雑な非同期タスク（探索）のライフサイクルを一元管理。
 * 2. ミドルウェアチェーンによる入出力の透過的な加工。
 * 3. 2026年基準の AbortSignal による正確な中断制御。
 */
export class EngineFacade<
  T_OPTIONS extends IBaseSearchOptions,
  T_INFO extends IBaseSearchInfo,
  T_RESULT extends IBaseSearchResult,
> implements IEngine<T_OPTIONS, T_INFO, T_RESULT> {
  private activeTask: ISearchTask<T_INFO, T_RESULT> | null = null;
  private infoListeners = new Set<(info: T_INFO) => void>();

  constructor(
    private readonly adapter: IEngineAdapter<T_OPTIONS, T_INFO, T_RESULT>,
    private readonly middlewares: IMiddleware<T_INFO, T_RESULT>[],
    private readonly bridge: EngineBridge,
  ) {}

  async load(): Promise<void> {
    const loader = await this.bridge.getLoader();
    await this.adapter.load(loader);
  }

  /**
   * 探索を実行します。
   * AbortSignal が中断された場合、プロミスを即座に reject します。
   */
  async search(options: T_OPTIONS): Promise<T_RESULT> {
    if (this.activeTask) {
      await this.activeTask.stop();
      this.activeTask = null;
    }

    const context: IMiddlewareContext<T_OPTIONS> = {
      engineId: this.adapter.id,
      options,
    };

    let command = this.adapter.parser.createSearchCommand(options);

    // Command Middleware 適用
    for (const middleware of this.middlewares) {
      if (middleware.onCommand) {
        command = await middleware.onCommand(command, context);
      }
    }

    const task = this.adapter.searchRaw(command);
    this.activeTask = task;

    // 非同期イテレータによる info の配信 (ミドルウェア適用付き)
    const consumeInfo = async () => {
      try {
        for await (let info of task.info) {
          // Info Middleware 適用
          for (const middleware of this.middlewares) {
            if (middleware.onInfo) {
              info = await middleware.onInfo(info, context);
            }
          }
          this.infoListeners.forEach(cb => cb(info));
        }
      } catch (err) {
        console.error("[EngineFacade] Info stream error:", err);
      }
    };
    void consumeInfo();

    // 探索キャンセル (AbortSignal) の監視
    return new Promise<T_RESULT>((resolve, reject) => {
      const cleanup = () => {
        options.signal?.removeEventListener("abort", onAbort);
        if (this.activeTask === task) this.activeTask = null;
      };

      const onAbort = () => {
        cleanup();
        task.stop().catch(() => {});
        reject(new EngineError(EngineErrorCode.SEARCH_TIMEOUT, "Search aborted via signal"));
      };

      if (options.signal) {
        if (options.signal.aborted) return onAbort();
        options.signal.addEventListener("abort", onAbort, { once: true });
      }

      task.result.then((res) => {
        cleanup();
        // Result Middleware 適用
        let finalResult = res;
        (async () => {
          for (const middleware of this.middlewares) {
            if (middleware.onResult) {
              finalResult = await middleware.onResult(finalResult, context);
            }
          }
          resolve(finalResult);
        })().catch(reject);
      }).catch((err) => {
        cleanup();
        reject(err);
      });
    });
  }

  onInfo(callback: (info: T_INFO) => void): () => void {
    this.infoListeners.add(callback);
    return () => this.infoListeners.delete(callback);
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
    this.infoListeners.clear();
  }

  get id(): string { return this.adapter.id; }
  get name(): string { return this.adapter.name; }
  get version(): string { return this.adapter.version; }
  get status(): EngineStatus { return this.adapter.status; }
}
