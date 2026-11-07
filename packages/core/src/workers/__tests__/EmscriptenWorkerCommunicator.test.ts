import { runInNewContext } from "node:vm";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  bootstrap,
  EmscriptenWorkerCommunicator,
  type EmscriptenWorkerScope,
} from "../EmscriptenWorkerCommunicator.js";

const settings = {
  main: "blob:main",
  wasm: "blob:wasm",
  worker: "blob:worker",
  token: "secret",
};
function fixture() {
  let resolve: (value: unknown) => void = () => {};
  let listener: (value: unknown) => void = () => {};
  const module = {
    postMessage: vi.fn(),
    terminate: vi.fn(),
    addMessageListener: vi.fn((callback: (value: unknown) => void) => {
      listener = callback;
    }),
  };
  const factory = vi.fn(
    () =>
      new Promise<unknown>((done) => {
        resolve = done;
      }),
  );
  const scope: EmscriptenWorkerScope = {
    crossOriginIsolated: true,
    SharedArrayBuffer,
    Stockfish: factory,
    importScripts: vi.fn(),
    postMessage: vi.fn(),
    onmessage: null,
  };
  const send = (data: unknown) =>
    scope.onmessage?.({ data } as MessageEvent<unknown>);
  return {
    scope,
    module,
    factory,
    send,
    ready: async (value: unknown = module) => {
      resolve(value);
      await Promise.resolve();
      await Promise.resolve();
    },
    output: (value: unknown) => listener(value),
  };
}
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
describe("Emscripten factory bootstrap", () => {
  it("queues startup commands, resolves only verified resources, and forwards output", async () => {
    const f = fixture();
    bootstrap(f.scope, settings);
    f.send("uci");
    await f.ready();
    expect(f.module.postMessage).toHaveBeenCalledWith("uci");
    f.send("isready");
    f.output("readyok");
    expect(f.scope.postMessage).toHaveBeenCalledWith("readyok");
    const options = f.factory.mock.calls[0] as unknown as [
      { locateFile: (path: string) => string; mainScriptUrlOrBlob: string },
    ];
    expect(options[0].mainScriptUrlOrBlob).toBe(settings.main);
    expect(options[0].locateFile("stockfish.wasm")).toBe(settings.wasm);
    expect(options[0].locateFile("stockfish.worker.js")).toBe(settings.worker);
    expect(() => options[0].locateFile("https://unverified/file")).toThrow(
      "Unknown",
    );
    f.send({ terminate: settings.token });
    expect(f.module.terminate).toHaveBeenCalledOnce();
    expect(f.scope.postMessage).toHaveBeenCalledWith({
      terminated: settings.token,
    });
    f.output("late");
    f.send("late");
    expect(f.module.postMessage).toHaveBeenCalledTimes(2);
  });
  it.each([{}, "x".repeat(65537)])(
    "fails closed on invalid or oversized startup input",
    async (input) => {
      vi.useFakeTimers();
      const f = fixture();
      bootstrap(f.scope, settings);
      f.send(input);
      expect(() => vi.runAllTimers()).toThrow();
      await f.ready();
      expect(f.module.terminate).toHaveBeenCalledOnce();
    },
  );
  it("bounds command count and reports output failures", async () => {
    vi.useFakeTimers();
    const f = fixture();
    bootstrap(f.scope, settings);
    for (let index = 0; index < 129; index++) f.send("uci");
    expect(() => vi.runAllTimers()).toThrow("overflow");
    const g = fixture();
    bootstrap(g.scope, settings);
    await g.ready();
    g.output({});
    expect(() => vi.runAllTimers()).toThrow("output");
    expect(g.module.terminate).toHaveBeenCalledOnce();
  });
  it.each(["isolation", "factory", "module"])(
    "reports initialization failure: %s",
    async (kind) => {
      vi.useFakeTimers();
      const f = fixture();
      if (kind === "isolation") f.scope.crossOriginIsolated = false;
      if (kind === "factory") f.scope.Stockfish = null;
      bootstrap(f.scope, settings);
      await f.ready({});
      expect(() => vi.runAllTimers()).toThrow();
    },
  );
  it("flattens position/go batches and forwards their bestmove response", async () => {
    const f = fixture();
    bootstrap(f.scope, settings);
    f.send(["position startpos", "go depth 1"]);
    await f.ready();
    expect(f.module.postMessage.mock.calls).toEqual([
      ["position startpos"],
      ["go depth 1"],
    ]);
    f.module.postMessage.mockImplementation((command: string) => {
      if (command.startsWith("go")) f.output("bestmove e2e4");
    });
    f.send(["position startpos moves e2e4", "go depth 2"]);
    expect(f.scope.postMessage).toHaveBeenCalledWith("bestmove e2e4");
  });
  it.each([
    { input: ["uci", 1] },
    { input: new Uint8Array([1]) },
    { input: Array.from({ length: 1 }) },
    { input: Array.from({ length: 129 }, () => "uci") },
  ])("rejects malformed batches atomically", async ({ input }) => {
    vi.useFakeTimers();
    const f = fixture();
    bootstrap(f.scope, settings);
    await f.ready();
    f.send(input);
    expect(() => vi.runAllTimers()).toThrow();
    expect(f.module.postMessage).not.toHaveBeenCalled();
  });
  it("rejects a startup batch exceeding remaining capacity without partial enqueue", async () => {
    vi.useFakeTimers();
    const f = fixture();
    bootstrap(f.scope, settings);
    f.send("x".repeat(65530));
    f.send(["uci", "isready"]);
    expect(() => vi.runAllTimers()).toThrow("overflow");
    await f.ready();
    expect(f.module.postMessage).not.toHaveBeenCalled();
  });
  it("surfaces abort and termination exceptions as worker errors", async () => {
    vi.useFakeTimers();
    const f = fixture();
    bootstrap(f.scope, settings);
    const options = f.factory.mock.calls[0] as unknown as [
      { onAbort: (reason: unknown) => void },
    ];
    options[0].onAbort("aborted");
    expect(() => vi.runAllTimers()).toThrow("aborted");
    const g = fixture();
    bootstrap(g.scope, settings);
    await g.ready();
    g.module.terminate.mockImplementation(() => {
      throw new Error("shutdown failure");
    });
    g.send({ terminate: settings.token });
    expect(() => vi.runAllTimers()).toThrow("shutdown failure");
  });
  it("serialized bootstrap executes without module closure references", async () => {
    const f = fixture();
    runInNewContext(`(${bootstrap.toString()})(scope, settings)`, {
      scope: f.scope,
      settings,
      setTimeout,
      Error,
    });
    f.send("uci");
    await f.ready();
    expect(f.module.postMessage).toHaveBeenCalledWith("uci");
  });
});
describe("Emscripten worker ownership", () => {
  it("revokes wrapper URL after bounded shutdown and only once", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("crossOriginIsolated", true);
    const terminate = vi.fn();
    vi.stubGlobal(
      "Worker",
      vi.fn(function () {
        return { terminate, postMessage: vi.fn() };
      }),
    );
    const revoke = vi.spyOn(URL, "revokeObjectURL");
    const communicator = new EmscriptenWorkerCommunicator(settings);
    const shutdown = communicator.terminate();
    await vi.advanceTimersByTimeAsync(100);
    await shutdown;
    await communicator.terminate();
    expect(terminate).toHaveBeenCalledOnce();
    expect(revoke).toHaveBeenCalledOnce();
    revoke.mockRestore();
  });
  it("requires isolation and accepts graceful shutdown acknowledgement", async () => {
    vi.stubGlobal("crossOriginIsolated", false);
    expect(() => new EmscriptenWorkerCommunicator(settings)).toThrow(
      "crossOriginIsolated",
    );
    vi.stubGlobal("crossOriginIsolated", true);
    const worker = {
      onmessage: null as null | ((event: MessageEvent<unknown>) => void),
      onerror: null,
      terminate: vi.fn(),
      postMessage: vi.fn((message: unknown) => {
        if (
          typeof message === "object" &&
          message !== null &&
          "terminate" in message
        ) {
          worker.onmessage?.({ data: "info" } as MessageEvent<unknown>);
          worker.onmessage?.({
            data: { terminated: message.terminate },
          } as MessageEvent<unknown>);
        }
      }),
    };
    vi.stubGlobal(
      "Worker",
      vi.fn(function () {
        return worker;
      }),
    );
    const communicator = new EmscriptenWorkerCommunicator(settings);
    await communicator.terminate();
    expect(worker.terminate).toHaveBeenCalledOnce();
  });
  it("forcibly disposes an already failed worker without an unhandled shutdown rejection", async () => {
    vi.stubGlobal("crossOriginIsolated", true);
    vi.spyOn(console, "error").mockImplementation(() => {});
    const worker = {
      onmessage: null,
      onerror: null as null | ((event: ErrorEvent) => void),
      terminate: vi.fn(),
      postMessage: vi.fn(),
    };
    vi.stubGlobal(
      "Worker",
      vi.fn(function () {
        return worker;
      }),
    );
    const communicator = new EmscriptenWorkerCommunicator(settings);
    worker.onerror?.({ message: "failed" } as ErrorEvent);
    await communicator.terminate();
    expect(worker.terminate).toHaveBeenCalledOnce();
    expect(worker.postMessage).not.toHaveBeenCalled();
  });
  it("shares in-flight shutdown until the deferred acknowledgement", async () => {
    vi.stubGlobal("crossOriginIsolated", true);
    const worker = {
      onmessage: null as null | ((event: MessageEvent<unknown>) => void),
      onerror: null,
      terminate: vi.fn(),
      postMessage: vi.fn<(message: unknown) => void>(),
    };
    vi.stubGlobal(
      "Worker",
      vi.fn(function () {
        return worker;
      }),
    );
    const revoke = vi.spyOn(URL, "revokeObjectURL");
    const communicator = new EmscriptenWorkerCommunicator(settings);
    const first = communicator.terminate();
    const second = communicator.terminate();
    expect(second).toBe(first);
    let settled = false;
    const completed = Promise.all([first, second]).then(() => {
      settled = true;
    });
    await Promise.resolve();
    expect(settled).toBe(false);
    expect(worker.terminate).not.toHaveBeenCalled();
    expect(revoke).not.toHaveBeenCalled();
    const sent = worker.postMessage.mock.calls[0]?.[0] as { terminate: string };
    worker.onmessage?.({
      data: { terminated: sent.terminate },
    } as MessageEvent<unknown>);
    await completed;
    expect(worker.terminate).toHaveBeenCalledOnce();
    expect(revoke).toHaveBeenCalledOnce();
    revoke.mockRestore();
  });
  it("rejects unverified resources and revokes on constructor failure", () => {
    vi.stubGlobal("crossOriginIsolated", true);
    expect(
      () =>
        new EmscriptenWorkerCommunicator({
          ...settings,
          wasm: "https://example.com/a",
        }),
    ).toThrow("Verified blob");
    vi.stubGlobal(
      "Worker",
      vi.fn(function () {
        throw new Error("worker blocked");
      }),
    );
    const revoke = vi.spyOn(URL, "revokeObjectURL");
    expect(() => new EmscriptenWorkerCommunicator(settings)).toThrow("blocked");
    expect(revoke).toHaveBeenCalledOnce();
    revoke.mockRestore();
  });
});
