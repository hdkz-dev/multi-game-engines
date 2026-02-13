import { describe, it, expect, vi } from "vitest";
import { EngineBridge } from "../bridge/EngineBridge.js";
import { 
  IEngineAdapter, 
  IBaseSearchOptions, 
  IBaseSearchInfo, 
  IBaseSearchResult,
  IProtocolParser
} from "../types.js";

describe("EngineBridge", () => {
  const createMockAdapter = (id: string) => ({
    id,
    name: `Mock ${id}`,
    version: "1.0.0",
    status: "ready",
    parser: {
      createSearchCommand: vi.fn(),
      createStopCommand: vi.fn(),
      createOptionCommand: vi.fn(),
    } as unknown as IProtocolParser<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>,
    load: vi.fn().mockResolvedValue(undefined),
    searchRaw: vi.fn().mockImplementation(() => ({
      info: (async function* () { yield { raw: "info depth 1 score 10" } as IBaseSearchInfo; })(),
      result: Promise.resolve({ raw: "bestmove e2e4" } as IBaseSearchResult),
      stop: vi.fn(),
    })),
    setOption: vi.fn().mockResolvedValue(undefined),
    onStatusChange: vi.fn().mockReturnValue(() => {}),
    onProgress: vi.fn().mockReturnValue(() => {}),
    onTelemetry: vi.fn().mockReturnValue(() => {}),
    dispose: vi.fn().mockResolvedValue(undefined),
  } as unknown as IEngineAdapter<IBaseSearchOptions, IBaseSearchInfo, IBaseSearchResult>);

  it("アダプターを登録し、getEngine で取得できること", () => {
    const bridge = new EngineBridge();
    const adapter = createMockAdapter("test");
    
    bridge.registerAdapter(adapter);
    const engine = bridge.getEngine("test");
    
    expect(engine.id).toBe("test");
    expect(engine.name).toBe("Mock test");
  });

  it("存在しないエンジンを取得しようとするとエラーを投げること", () => {
    const bridge = new EngineBridge();
    expect(() => bridge.getEngine("invalid")).toThrow();
  });

  it("アダプターの登録解除ができること", () => {
    const bridge = new EngineBridge();
    const adapter = createMockAdapter("test");
    
    bridge.registerAdapter(adapter);
    bridge.unregisterAdapter("test");
    
    expect(() => bridge.getEngine("test")).toThrow();
  });

  it("dispose 時に全てのアダプターが破棄されること", async () => {
    const bridge = new EngineBridge();
    const adapter1 = createMockAdapter("engine1");
    const adapter2 = createMockAdapter("engine2");
    
    bridge.registerAdapter(adapter1);
    bridge.registerAdapter(adapter2);
    
    await bridge.dispose();
    
    expect(adapter1.dispose).toHaveBeenCalled();
    expect(adapter2.dispose).toHaveBeenCalled();
  });
});
