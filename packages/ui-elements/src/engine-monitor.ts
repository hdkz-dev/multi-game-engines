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
  createUIStrings,
} from "@multi-game-engines/ui-core";
import { locales } from "@multi-game-engines/i18n";

import "./score-badge.js";
import "./engine-stats.js";
import "./pv-list.js";
import "./search-log.js";

/**
 * フレームワーク非依存のエンジンモニター・カスタム要素 <engine-monitor>
 */
@customElement("engine-monitor")
export class EngineMonitorElement extends LitElement {
  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      background-color: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.75rem;
      overflow: hidden;
      box-shadow:
        0 4px 6px -1px rgb(0 0 0 / 0.1),
        0 2px 4px -2px rgb(0 0 0 / 0.1);
      font-family: ui-sans-serif, system-ui, sans-serif;
    }
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      background-color: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
    }
    .title-group {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    h2 {
      margin: 0;
      font-size: 0.875rem;
      font-weight: 700;
      color: #374151;
    }
    .status-indicator {
      width: 0.625rem;
      height: 0.625rem;
      border-radius: 9999px;
      background-color: #d1d5db;
      border: 2px solid white;
      box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    }
    .status-indicator.busy {
      background-color: #22c55e;
      animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }
    @keyframes pulse {
      0%,
      100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }
    .actions {
      display: flex;
      gap: 0.5rem;
    }
    button {
      padding: 0.375rem 0.75rem;
      border-radius: 0.5rem;
      font-size: 0.75rem;
      font-weight: 700;
      border: none;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-start {
      background-color: #2563eb;
      color: white;
    }
    .btn-start:hover {
      background-color: #1d4ed8;
    }
    .btn-stop {
      background-color: #fef2f2;
      color: #dc2626;
    }
    .btn-stop:hover {
      background-color: #fee2e2;
    }

    .content {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
    }
    .best-move-section {
      padding: 1.25rem;
      border-bottom: 1px solid #f3f4f6;
    }
    .label-xs {
      font-size: 0.625rem;
      font-weight: 800;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.75rem;
      display: block;
    }
    .best-move-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .best-move-value {
      font-size: 1.875rem;
      font-weight: 900;
      color: #111827;
      font-family: ui-monospace, monospace;
      letter-spacing: -0.05em;
    }
    .tab-header {
      display: flex;
      gap: 1rem;
      padding: 0.5rem 1rem;
      background-color: #f9fafb;
      border-bottom: 1px solid #e5e7eb;
    }
    .tab-btn {
      padding: 0.25rem 0.5rem;
      font-size: 0.625rem;
      font-weight: 800;
      color: #9ca3af;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      background: none;
      border: none;
      border-radius: 0;
      border-bottom: 2px solid transparent;
    }
    .tab-btn.active {
      color: #2563eb;
      border-bottom-color: #2563eb;
    }
    .tab-content {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
    }
    .error-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      text-align: center;
      color: #dc2626;
    }
  `;

  @property({ type: Object }) engine?: IEngine<
    IBaseSearchOptions,
    IBaseSearchInfo,
    IBaseSearchResult
  >;
  @property({ type: Object }) searchOptions: IBaseSearchOptions = {};
  @property({ type: String }) panelTitle?: string;
  @property({ type: String }) locale = "ja";

  @state() private _searchState?: EngineSearchState;
  @state() private _status: EngineStatus = "uninitialized";
  @state() private _activeTab: "pv" | "log" = "pv";

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
      // 重複登録防止は EngineFacade 側で行われるが、明示的に正規化を適用
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
    if (!this.engine || !this._searchState) {
      return html`<div class="error-container">Initializing...</div>`;
    }

    const strings = createUIStrings(
      this.locale === "ja" ? locales.ja : locales.en,
    );
    const state = this._searchState;
    const bestPV = state.pvs[0];

    return html`
      <header>
        <div class="title-group">
          <h2>${this.panelTitle || strings.title}</h2>
          <div
            class="status-indicator ${this._status === "busy" ? "busy" : ""}"
          ></div>
        </div>
        <div class="actions">
          ${this._status === "busy" || this._status === "loading"
            ? html`<button class="btn-stop" @click="${this._handleStop}">
                ${strings.stop}
              </button>`
            : html`<button class="btn-start" @click="${this._handleStart}">
                ${strings.start}
              </button>`}
        </div>
      </header>

      <div class="content">
        ${this._status === "error"
          ? html`
              <div class="error-container">
                <strong>${strings.errorTitle}</strong>
                <div style="font-size: 0.75rem; margin-top: 0.5rem">
                  ${this.engine.lastError?.remediation ||
                  strings.errorDefaultRemediation}
                </div>
              </div>
            `
          : html`
              <section class="best-move-section">
                <span class="label-xs">${strings.topCandidate}</span>
                <div class="best-move-row">
                  <div class="best-move-value">
                    ${bestPV?.moves[0] || strings.noMove}
                  </div>
                  ${bestPV
                    ? html`<score-badge
                        .score="${bestPV.score}"
                        .locale="${this.locale}"
                      ></score-badge>`
                    : ""}
                </div>
              </section>

              <engine-stats
                .stats="${state.stats}"
                .locale="${this.locale}"
              ></engine-stats>

              <div class="tab-header">
                <button
                  class="tab-btn ${this._activeTab === "pv" ? "active" : ""}"
                  @click="${() => (this._activeTab = "pv")}"
                >
                  ${strings.principalVariations}
                </button>
                <button
                  class="tab-btn ${this._activeTab === "log" ? "active" : ""}"
                  @click="${() => (this._activeTab = "log")}"
                >
                  ${strings.searchLog || "Log"}
                </button>
              </div>

              <div class="tab-content">
                ${this._activeTab === "pv"
                  ? html`<pv-list
                      .pvs="${state.pvs}"
                      .locale="${this.locale}"
                    ></pv-list>`
                  : html`<search-log
                      .log="${state.searchLog}"
                      .locale="${this.locale}"
                    ></search-log>`}
              </div>
            `}
      </div>
    `;
  }
}
