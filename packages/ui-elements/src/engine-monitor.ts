import { LitElement, html, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import {
  IEngine,
  IBaseSearchOptions,
  IBaseSearchResult,
  EngineStatus,
  IBaseSearchInfo,
} from "@multi-game-engines/core";
import {
  MonitorRegistry,
  EngineSearchState,
  SearchStateTransformer,
  CommandDispatcher,
  UINormalizerMiddleware,
} from "@multi-game-engines/ui-core";

/**
 * フレームワーク非依存のエンジンモニター・カスタム要素。
 */
@customElement("engine-monitor")
export class EngineMonitorElement extends LitElement {
  static styles = css`
    :host {
      --em-bg: white;
      --em-border: #e5e7eb;
      --em-accent: #2563eb;
      display: block;
      font-family: ui-monospace, monospace;
      border: 1px solid var(--em-border);
      border-radius: 0.75rem;
      overflow: hidden;
      background: var(--em-bg);
    }
    .header {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--em-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .btn-start {
      background: #eff6ff;
      color: var(--em-accent);
    }
    .btn-stop {
      background: #fef2f2;
      color: #dc2626;
    }
    button {
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      font-weight: bold;
      border: none;
      cursor: pointer;
    }
  `;

  @property({ type: Object }) engine?: IEngine<
    IBaseSearchOptions,
    IBaseSearchInfo,
    IBaseSearchResult
  >;
  @property({ type: Object }) searchOptions: IBaseSearchOptions = {};

  @state() private _searchState?: EngineSearchState;
  @state() private _status: EngineStatus = "uninitialized";

  private _unsub?: () => void;
  private _dispatcher?: CommandDispatcher<
    EngineSearchState,
    IBaseSearchOptions,
    IBaseSearchInfo,
    IBaseSearchResult
  >;

  connectedCallback() {
    super.connectedCallback();
    this._initMonitor();
  }

  private _initMonitor() {
    if (!this.engine) return;

    if (typeof this.engine.use === "function") {
      this.engine.use(
        new UINormalizerMiddleware<
          IBaseSearchOptions,
          IBaseSearchInfo,
          IBaseSearchResult
        >(),
      );
    }

    const monitor = MonitorRegistry.getInstance().getOrCreateMonitor<
      EngineSearchState,
      IBaseSearchOptions,
      IBaseSearchInfo,
      IBaseSearchResult
    >(this.engine, "startpos", SearchStateTransformer.mergeInfo);

    monitor.startMonitoring();
    this._status = this.engine.status;
    this._searchState = monitor.getSnapshot();

    this._unsub = monitor.subscribe(() => {
      this._searchState = monitor.getSnapshot();
      this._status = (this.engine as IEngine).status;
    });

    this._dispatcher = new CommandDispatcher<
      EngineSearchState,
      IBaseSearchOptions,
      IBaseSearchInfo,
      IBaseSearchResult
    >(monitor, (s: EngineStatus) => {
      this._status = s;
    });
  }

  disconnectedCallback() {
    if (this._unsub) this._unsub();
    super.disconnectedCallback();
  }

  private async _handleStart() {
    if (this._dispatcher) {
      await this._dispatcher.dispatchSearch(this.searchOptions);
    }
  }

  private async _handleStop() {
    if (this._dispatcher) {
      await this._dispatcher.dispatchStop();
    }
  }

  render() {
    // 根本修正: undefined チェックを徹底し型安全を確保
    if (!this.engine || !this._searchState) {
      return html`<div>Initializing engine...</div>`;
    }

    const state = this._searchState;

    return html`
      <div class="header">
        <span style="font-weight:bold">${this.engine.name}</span>
        ${this._status === "busy"
          ? html`<button class="btn-stop" @click="${this._handleStop}">
              STOP
            </button>`
          : html`<button class="btn-start" @click="${this._handleStart}">
              START
            </button>`}
      </div>
      <div style="padding: 1rem">
        <div style="font-size: 0.75rem; color: #666">
          Depth: ${state.stats.depth}
        </div>
        <div style="font-size: 1.25rem; font-weight: bold; margin-top: 0.5rem">
          ${state.pvs[0]?.moves[0] || "---"}
        </div>
      </div>
    `;
  }
}
