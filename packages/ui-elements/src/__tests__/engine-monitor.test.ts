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
  get statusListenerCount() {
    return this._statusListeners.length;
  }
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
    const rawEngine = new MockEngine();
    const engine = rawEngine as unknown as IEngine<
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
    // After engine is set, the "Initializing..." placeholder should be gone
    expect(shadow?.textContent).not.toContain("Initializing...");
  });

  it("should render full UI when engine and state are available", async () => {
    const rawEngine = new MockEngine();
    const engine = rawEngine as unknown as IEngine<
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
    // panelTitle should appear in the rendered shadow DOM
    expect(el.shadowRoot?.textContent).toContain("Test Panel");
  });

  it("should handle start button click", async () => {
    const rawEngine = new MockEngine();
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
    expect(startBtn).not.toBeNull();
    startBtn!.click();
    await el.updateComplete;
    // search should have been dispatched
    expect(rawEngine.search).toHaveBeenCalled();
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
    expect(startBtn).not.toBeNull();
    startBtn!.click();
    await el.updateComplete;

    const stopBtn = el.shadowRoot?.querySelector(
      ".btn-stop",
    ) as HTMLButtonElement | null;
    if (stopBtn) {
      stopBtn.click();
      await el.updateComplete;
      expect(rawEngine.stop).toHaveBeenCalled();
    }
    resolveSearch?.({} as IBaseSearchResult);
  });

  it("should switch to log tab on click", async () => {
    const rawEngine = new MockEngine();
    const engine = rawEngine as unknown as IEngine<
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
    expect(logTab).not.toBeNull();
    logTab!.click();
    await el.updateComplete;
    expect(logTab!.getAttribute("aria-selected")).toBe("true");
  });

  it("should switch tabs via keyboard (ArrowRight/ArrowLeft)", async () => {
    const rawEngine = new MockEngine();
    const engine = rawEngine as unknown as IEngine<
      IBaseSearchOptions,
      IBaseSearchInfo,
      IBaseSearchResult
    >;
    const el = document.createElement("engine-monitor") as EngineMonitorElement;
    el.engine = engine;
    document.body.appendChild(el);
    await el.updateComplete;

    const tablist = el.shadowRoot?.querySelector('[role="tablist"]');
    expect(tablist).not.toBeNull();
    tablist!.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }),
    );
    await el.updateComplete;
    tablist!.dispatchEvent(
      new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }),
    );
    await el.updateComplete;
    tablist!.dispatchEvent(
      new KeyboardEvent("keydown", { key: "End", bubbles: true }),
    );
    await el.updateComplete;
    tablist!.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Home", bubbles: true }),
    );
    await el.updateComplete;
    // After keyboard nav, the active tab's aria-selected should still be set
    const pvTab = el.shadowRoot?.querySelector(
      "#tab-pv",
    ) as HTMLButtonElement | null;
    expect(pvTab?.getAttribute("aria-selected")).toBe("true");
  });

  it("should clean up on disconnection", async () => {
    const rawEngine = new MockEngine();
    const engine = rawEngine as unknown as IEngine<
      IBaseSearchOptions,
      IBaseSearchInfo,
      IBaseSearchResult
    >;
    const el = document.createElement("engine-monitor") as EngineMonitorElement;
    el.engine = engine;
    document.body.appendChild(el);
    await el.updateComplete;

    document.body.removeChild(el);
    // Element should no longer be part of the DOM
    expect(document.body.contains(el)).toBe(false);
    // No status listeners should remain after disconnect
    expect(rawEngine.statusListenerCount).toBe(0);
  });
});
