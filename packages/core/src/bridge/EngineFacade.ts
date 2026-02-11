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
 * 利用者が直接操作するエンジン操作の窓口 (Facade)。
 * 
 * [設計意図]
 * - 複雑な非同期タスクのライフサイクル（ロード・探索・中断・破棄）を抽象化。
 * - 2026年基準の Web 標準 (AbortSignal, Async Iterator) をネイティブにサポート。
 * - 排他制御を内蔵し、単一の Facade インスタンスで複数の探索が競合するのを防ぐ。
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

  /** エンジンの初期化とバイナリのロードを実行 */
  async load(): Promise<void> {
    const loader = await this.bridge.getLoader();
    await this.adapter.load(loader);
  }

  /**
   * 探索を実行します。
   * @throws {EngineError} 中断時や内部エラー時に発生
   */
  async search(options: T_OPTIONS): Promise<T_RESULT> {
    // 1. 排他制御: 既に実行中のタスクがあれば停止させる
    if (this.activeTask) {
      await this.activeTask.stop();
      this.activeTask = null;
    }

    // 2. AbortSignal の即時チェック (Fail-fast)
    // 探索コマンドを生成する前に、既にシグナルが中断されていないか確認する
    if (options.signal?.aborted) {
      throw new EngineError(EngineErrorCode.SEARCH_TIMEOUT, "Search aborted immediately via AbortSignal.");
    }

    const context: IMiddlewareContext<T_OPTIONS> = {
      engineId: this.adapter.id,
      options,
    };

    // 3. ミドルウェア適用 (Command)
    let command = this.adapter.parser.createSearchCommand(options);
    for (const middleware of this.middlewares) {
      if (middleware.onCommand) {
        command = await middleware.onCommand(command, context);
      }
    }

    // 4. アダプターによる探索の開始
    const task = this.adapter.searchRaw(command);
    this.activeTask = task;

    /** 
     * 思考状況 (info) の配信ループ
     * 非同期イテレータを使用して、アダプターからのデータをリアルタイムにミドルウェア処理して配信する
     */
    const consumeInfo = async () => {
      try {
        for await (let info of task.info) {
          for (const middleware of this.middlewares) {
            if (middleware.onInfo) {
              info = await middleware.onInfo(info, context);
            }
          }
          this.infoListeners.forEach(cb => cb(info));
        }
      } catch (err) {
        // infoストリームのエラーはメインの結果 Promise を中断させないが、ログには残す
        console.error("[EngineFacade] Info stream consumed with error:", err);
      }
    };
    void consumeInfo();

    // 5. 結果 Promise の構築とクリーンアップ管理
    return new Promise<T_RESULT>((resolve, reject) => {
      const onAbort = () => {
        cleanup();
        task.stop().catch(() => {}); // バックグラウンドで停止
        reject(new EngineError(EngineErrorCode.SEARCH_TIMEOUT, "Search aborted via AbortSignal."));
      };

      const cleanup = () => {
        options.signal?.removeEventListener("abort", onAbort);
        if (this.activeTask === task) this.activeTask = null;
      };

      if (options.signal) {
        options.signal.addEventListener("abort", onAbort, { once: true });
      }

      task.result.then((res) => {
        cleanup();
        // ミドルウェア適用 (Result)
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

  /** info メッセージの購読。購読解除用の関数を返す (2026 Best Practice) */
  onInfo(callback: (info: T_INFO) => void): () => void {
    this.infoListeners.add(callback);
    return () => this.infoListeners.delete(callback);
  }

  /** 現在実行中の探索を強制停止 */
  async stop(): Promise<void> {
    if (this.activeTask) {
      await this.activeTask.stop();
      this.activeTask = null;
    }
  }

  /** インスタンスの破棄とリソースの解放 */
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
