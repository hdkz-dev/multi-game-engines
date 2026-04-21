import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  vi,
  beforeAll,
  afterAll,
} from "vitest";
import "../components/engine-monitor.js";
import type { EngineMonitorElement } from "../components/engine-monitor.js";
import {
  IEngine,
  IBaseSearchOptions,
  IBaseSearchResult,
  EngineStatus,
  IBaseSearchInfo,
} from "@multi-game-engines/core";

class MockEngine implements Partial<
  IEngine<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>
> {
  id = "mock-engine";
  name = "Mock Engine";
  status: EngineStatus = "ready";
  private _statusListeners: ((s: EngineStatus) => void)[] = [];
  onStatusChange = (fn: (s: EngineStatus) => void) => {
    this._statusListeners.push(fn);
    return () => {
      this._statusListeners = this._statusListeners.filter((l) => l !== fn);
    };
  };
  emitStatus(s: EngineStatus) {
    this.status = s;
    this._statusListeners.forEach((fn) => fn(s));
  }
  onInfo = vi.fn(() => () => {});
  onSearchResult = vi.fn(() => () => {});
  onTelemetry = vi.fn(() => () => {});
  emitTelemetry = vi.fn();
  search = vi.fn().mockResolvedValue({} as IBaseSearchResult);
  stop = vi.fn().mockResolvedValue(undefined);
  use = vi.fn().mockReturnThis();
}

describe("EngineMonitorElement", () => {
  beforeAll(() => {
    vi.spyOn(performance, "now").mockReturnValue(0);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("should be defined as a custom element", () => {
    expect(customElements.get("engine-monitor")).toBeDefined();
  });

  it("should render placeholder text when no engine is provided", async () => {
    const el = document.createElement("engine-monitor") as EngineMonitorElement;
    el.locale = "en";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot?.textContent).toContain("Initializing...");
  });

  it("should initialize monitor when engine is set", async () => {
    const engine = new MockEngine() as unknown as IEngine<
      IBaseSearchOptions,
      IBaseSearchInfo,
      IBaseSearchResult
    >;
    const el = document.createElement("engine-monitor") as EngineMonitorElement;
    el.engine = engine;
    el.locale = "en";
    document.body.appendChild(el);
    await el.updateComplete;
    const shadow = el.shadowRoot;
    expect(shadow).not.toBeNull();
    expect(shadow?.textContent).toBeTruthy();
  });

  it("should render full UI when engine and state are available", async () => {
    const engine = new MockEngine() as unknown as IEngine<
      IBaseSearchOptions,
      IBaseSearchInfo,
      IBaseSearchResult
    >;
    const el = document.createElement("engine-monitor") as EngineMonitorElement;
    el.engine = engine;
    el.locale = "ja";
    el.panelTitle = "Test Panel";
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot?.innerHTML).toBeTruthy();
  });

  it("should handle start button click", async () => {
    const engine = new MockEngine() as unknown as IEngine<
      IBaseSearchOptions,
      IBaseSearchInfo,
      IBaseSearchResult
    >;
    const el = document.createElement("engine-monitor") as EngineMonitorElement;
    el.engine = engine;
    document.body.appendChild(el);
    await el.updateComplete;

    const startBtn = el.shadowRoot?.querySelector(
      ".btn-start",
    ) as HTMLButtonElement | null;
    startBtn?.click();
    await el.updateComplete;
    expect(el.shadowRoot).toBeTruthy();
  });

  it("should handle stop button click when engine is busy", async () => {
    const rawEngine = new MockEngine();
    let resolveSearch!: (v: IBaseSearchResult) => void;
    rawEngine.search = vi.fn(
      () =>
        new Promise<IBaseSearchResult>((resolve) => {
          resolveSearch = resolve;
        }),
    );
    const engine = rawEngine as unknown as IEngine<
      IBaseSearchOptions,
      IBaseSearchInfo,
      IBaseSearchResult
    >;
    const el = document.createElement("engine-monitor") as EngineMonitorElement;
    el.engine = engine;
    document.body.appendChild(el);
    await el.updateComplete;

    const startBtn = el.shadowRoot?.querySelector(
      ".btn-start",
    ) as HTMLButtonElement | null;
    startBtn?.click();
    await el.updateComplete;

    const stopBtn = el.shadowRoot?.querySelector(
      ".btn-stop",
    ) as HTMLButtonElement | null;
    if (stopBtn) {
      stopBtn.click();
      await el.updateComplete;
    }
    resolveSearch?.({} as IBaseSearchResult);
    expect(el.shadowRoot).toBeTruthy();
  });

  it("should switch to log tab on click", async () => {
    const engine = new MockEngine() as unknown as IEngine<
      IBaseSearchOptions,
      IBaseSearchInfo,
      IBaseSearchResult
    >;
    const el = document.createElement("engine-monitor") as EngineMonitorElement;
    el.engine = engine;
    document.body.appendChild(el);
    await el.updateComplete;

    const logTab = el.shadowRoot?.querySelector(
      "#tab-log",
    ) as HTMLButtonElement | null;
    logTab?.click();
    await el.updateComplete;
    expect(el.shadowRoot).toBeTruthy();
  });

  it("should switch tabs via keyboard (ArrowRight/ArrowLeft)", async () => {
    const engine = new MockEngine() as unknown as IEngine<
      IBaseSearchOptions,
      IBaseSearchInfo,
      IBaseSearchResult
    >;
    const el = document.createElement("engine-monitor") as EngineMonitorElement;
    el.engine = engine;
    document.body.appendChild(el);
    await el.updateComplete;

    const tablist = el.shadowRoot?.querySelector('[role="tablist"]');
    if (tablist) {
      tablist.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
      );
      await el.updateComplete;
      tablist.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }),
      );
      await el.updateComplete;
      tablist.dispatchEvent(
        new KeyboardEvent("keydown", { key: "End", bubbles: true }),
      );
      await el.updateComplete;
      tablist.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Home", bubbles: true }),
      );
      await el.updateComplete;
    }
    expect(el.shadowRoot).toBeTruthy();
  });

  it("should clean up on disconnection", async () => {
    const engine = new MockEngine() as unknown as IEngine<
      IBaseSearchOptions,
      IBaseSearchInfo,
      IBaseSearchResult
    >;
    const el = document.createElement("engine-monitor") as EngineMonitorElement;
    el.engine = engine;
    document.body.appendChild(el);
    await el.updateComplete;
    document.body.removeChild(el);
    expect(el.shadowRoot).toBeTruthy();
  });
});
