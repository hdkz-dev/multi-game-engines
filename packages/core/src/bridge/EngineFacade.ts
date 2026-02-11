import {
  IEngine,
  IEngineAdapter,
  IEngineAdapterInfo,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
  ISearchTask,
  ILicenseInfo,
  IMiddleware,
  IMiddlewareContext,
  IEngineBridge,
} from "../types";

/**
 * 利用者向けの Facade クラス。
 * 
 * アダプターの詳細（Worker通信、低レイヤープロトコル）を抽象化し、
 * ミドルウェアの適用やタスク管理（排他制御、統計収集）を一元管理します。
 */
export class EngineFacade<
  T_OPTIONS extends IBaseSearchOptions = IBaseSearchOptions,
  T_INFO extends IBaseSearchInfo = IBaseSearchInfo,
  T_RESULT extends IBaseSearchResult = IBaseSearchResult,
> implements IEngine<T_OPTIONS, T_INFO, T_RESULT>
{
  /** 現在進行中の探索タスクを保持 */
  private activeTask: ISearchTask<T_INFO, T_RESULT> | null = null;

  constructor(
    private readonly adapterInstance: IEngineAdapter<T_OPTIONS, T_INFO, T_RESULT>,
    /**
     * ミドルウェアは多岐にわたるデータ型を扱う可能性があるため、
     * 内部管理用に any を使用。外部インターフェースでは型安全性が維持される。
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private readonly middlewares: IMiddleware<any, any>[] = [],
    private readonly bridge?: IEngineBridge,
  ) {}

  /** アダプターの現在状態（読取専用） */
  get adapter(): IEngineAdapterInfo {
    return this.adapterInstance;
  }

  /**
   * エンジンの初期化。
   * ブリッジのリソースローダーを使用して WASM 等を準備します。
   */
  async load(): Promise<void> {
    const loader = this.bridge ? await this.bridge.getLoader() : undefined;
    await this.adapterInstance.load(loader);
  }

  /**
   * 探索を開始します。
   * 排他制御（前のタスクの自動停止）およびテレメトリの収集を行います。
   */
  async search(options: T_OPTIONS): Promise<ISearchTask<T_INFO, T_RESULT>> {
    const startTime = Date.now();

    // 1. 既存タスクがあれば停止 (2026 Best Practice: Auto-abort)
    if (this.activeTask) {
      await this.activeTask.stop();
    }

    const context: IMiddlewareContext<T_OPTIONS> = {
      engineId: this.adapterInstance.id,
      adapterName: this.adapterInstance.name,
      timestamp: startTime,
      options: options,
    };

    // 探索開始のテレメトリを発行
    this.adapterInstance.emitTelemetry?.({
      event: "search_start",
      timestamp: startTime,
      attributes: { engineId: this.adapterInstance.id }
    });

    // 2. コマンド生成とミドルウェア適用
    let command = this.adapterInstance.parser.createSearchCommand(options);
    for (const middleware of this.middlewares) {
      if (middleware.onCommand) {
        command = await middleware.onCommand(command, context);
      }
    }

    // 3. アダプターによる実行
    const task = this.adapterInstance.searchRaw(command);
    this.activeTask = task;

    // 4. AbortSignal との連動
    if (options.signal) {
      options.signal.addEventListener("abort", () => {
        void task.stop();
      }, { once: true });
    }

    // 5. ミドルウェア適用のための非同期イテレータと結果ラップ
    const interceptedInfo = this.interceptInfo(task.info, context);
    const interceptedResult = this.interceptResult(task.result, context);

    const wrappedTask: ISearchTask<T_INFO, T_RESULT> = {
      info: interceptedInfo,
      result: interceptedResult.finally(() => {
        // 探索終了時の処理
        if (this.activeTask === task) {
          this.activeTask = null;
        }
        // 探索完了のテレメトリを発行
        this.adapterInstance.emitTelemetry?.({
          event: "search_complete",
          timestamp: Date.now(),
          attributes: { duration_ms: Date.now() - startTime }
        });
      }),
      stop: () => task.stop(),
    };

    return wrappedTask;
  }

  /** 実行中の探索を停止。アダプターは再利用可能な状態を維持。 */
  async stop(): Promise<void> {
    if (this.activeTask) {
      await this.activeTask.stop();
      this.activeTask = null;
    }
  }

  /** エンジンを完全に終了し、リソースを破棄。 */
  async quit(): Promise<void> {
    await this.stop();
    await this.adapterInstance.dispose();
  }

  /** 法的な帰属表示用のデータを取得。 */
  getCredits(): { engine: ILicenseInfo; adapter: ILicenseInfo } {
    return {
      engine: this.adapterInstance.engineLicense,
      adapter: this.adapterInstance.adapterLicense,
    };
  }

  /** 出力情報のストリーミング加工。 */
  private async *interceptInfo(
    infoIterable: AsyncIterable<T_INFO>,
    context: IMiddlewareContext<T_OPTIONS>,
  ): AsyncIterable<T_INFO> {
    for await (let info of infoIterable) {
      for (const middleware of this.middlewares) {
        if (middleware.onInfo) {
          info = await middleware.onInfo(info, context);
        }
      }
      yield info;
    }
  }

  /** 最終結果の加工。 */
  private async interceptResult(
    resultPromise: Promise<T_RESULT>,
    context: IMiddlewareContext<T_OPTIONS>,
  ): Promise<T_RESULT> {
    let result = await resultPromise;
    for (const middleware of this.middlewares) {
      if (middleware.onResult) {
        result = await middleware.onResult(result, context);
      }
    }
    return result;
  }
}
