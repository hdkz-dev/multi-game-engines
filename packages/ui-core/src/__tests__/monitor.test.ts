import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { SearchMonitor } from "../monitor.js";
import {
  IEngine,
  IBaseSearchOptions,
  IBaseSearchInfo,
  IBaseSearchResult,
} from "@multi-game-engines/core";

// モック用の型定義
type MockState = { count: number; lastRaw: string };
type MockInfo = { raw: string };

const createMockInfo = (raw: string): MockInfo & IBaseSearchInfo => ({
  raw,
  depth: 1,
  seldepth: 1,
  nodes: 1,
  nps: 1,
  time: 1,
  multipv: 1,
  pv: [],
});

describe("SearchMonitor (Throttling)", () => {
  let mockEngine: IEngine<
    IBaseSearchOptions,
    MockInfo & IBaseSearchInfo,
    IBaseSearchResult
  >;
  let infoCallback: (info: MockInfo & IBaseSearchInfo) => void;

  beforeEach(() => {
    vi.useFakeTimers();
    infoCallback = () => {};
    mockEngine = {
      id: "mock-engine",
      name: "Mock Engine",
      version: "1.0.0",
      status: "ready",
      onInfo: vi.fn((cb) => {
        infoCallback = cb;
        return () => {};
      }),
      onStatusChange: vi.fn(() => () => {}),
      search: vi.fn(),
      stop: vi.fn(),
      use: vi.fn(),
      emitTelemetry: vi.fn(),
    } as unknown as IEngine<
      IBaseSearchOptions,
      MockInfo & IBaseSearchInfo,
      IBaseSearchResult
    >;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should batch multiple updates into a single state notification", async () => {
    // 状態変換ロジック: カウントアップと最後の生メッセージ保持
    const transformer = vi.fn((state: MockState, info: MockInfo) => ({
      count: state.count + 1,
      lastRaw: info.raw,
    }));

    const monitor = new SearchMonitor<
      MockState,
      IBaseSearchOptions,
      MockInfo & IBaseSearchInfo,
      IBaseSearchResult
    >(mockEngine, { count: 0, lastRaw: "" }, transformer);

    const listener = vi.fn();
    monitor.subscribe(listener);

    monitor.startMonitoring();

    // 1. 短期間に複数の更新を発生させる
    infoCallback(createMockInfo("msg1"));
    infoCallback(createMockInfo("msg2"));
    infoCallback(createMockInfo("msg3"));

    // まだ非同期処理前なので、更新は反映されていないはず
    expect(listener).not.toHaveBeenCalled();
    expect(transformer).not.toHaveBeenCalled();

    // 2. タイマーを進める (requestAnimationFrame / setTimeout 発火)
    await vi.runAllTimersAsync();

    // 3. 検証
    // トランスフォーマーは受信したメッセージの回数分呼ばれるべき (msg1 -> msg2 -> msg3)
    expect(transformer).toHaveBeenCalledTimes(3);

    // しかし、ストアのリスナーへの通知（再レンダリング）は1回にまとめられるべき
    expect(listener).toHaveBeenCalledTimes(1);

    // 最終状態の確認
    const state = monitor.getState();
    expect(state.count).toBe(3);
    expect(state.lastRaw).toBe("msg3");
  });

  it("should stop processing updates after stopMonitoring", async () => {
    const transformer = (state: MockState, info: MockInfo) => ({
      ...state,
      lastRaw: info.raw,
    });

    const monitor = new SearchMonitor<
      MockState,
      IBaseSearchOptions,
      MockInfo & IBaseSearchInfo,
      IBaseSearchResult
    >(mockEngine, { count: 0, lastRaw: "" }, transformer);

    monitor.startMonitoring();
    infoCallback(createMockInfo("msg1"));

    // 処理される前に停止
    monitor.stopMonitoring();

    await vi.runAllTimersAsync();

    // 停止後は更新が反映されていないこと
    expect(monitor.getState().lastRaw).toBe("");
  });
});
