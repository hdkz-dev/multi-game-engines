import { WorkerCommunicator } from "./WorkerCommunicator.js";

interface BootstrapSettings {
  main: string;
  wasm: string;
  worker: string;
  token: string;
}

interface EngineModule {
  addMessageListener(listener: (message: unknown) => void): void;
  postMessage(message: string): void;
  terminate(): void;
}

export interface EmscriptenWorkerScope {
  crossOriginIsolated?: boolean;
  SharedArrayBuffer?: unknown;
  Stockfish?: unknown;
  importScripts(url: string): void;
  postMessage(message: unknown): void;
  onmessage: ((event: MessageEvent<unknown>) => void) | null;
}

/** Self contained: serialized into the dedicated worker, also directly testable. */
export function bootstrap(
  scope: EmscriptenWorkerScope,
  settings: BootstrapSettings,
): void {
  const queue: string[] = [];
  let queuedCharacters = 0;
  let engine: EngineModule | undefined;
  let stopped = false;
  const cleanup = (): void => {
    stopped = true;
    queue.length = 0;
    queuedCharacters = 0;
    engine?.terminate();
  };
  const fail = (cause: unknown): void => {
    if (stopped) return;
    try {
      cleanup();
    } finally {
      // Throw in a task so the owning Worker's onerror receives async failures.
      setTimeout(() => {
        throw new Error(cause instanceof Error ? cause.message : String(cause));
      }, 0);
    }
  };
  scope.onmessage = (event): void => {
    const message = event.data;
    if (
      typeof message === "object" &&
      message !== null &&
      "terminate" in message &&
      message.terminate === settings.token
    ) {
      try {
        cleanup();
        scope.postMessage({ terminated: settings.token });
      } catch (error) {
        setTimeout(() => {
          throw error;
        }, 0);
      }
      return;
    }
    if (stopped) return;
    try {
      const commands: unknown[] =
        typeof message === "string"
          ? [message]
          : Array.isArray(message)
            ? message
            : [];
      if (commands.length > 128)
        throw new Error("Engine command batch overflow");
      if (
        (typeof message !== "string" && !Array.isArray(message)) ||
        Array.from(commands).some((command) => typeof command !== "string")
      ) {
        throw new Error("Engine commands must be strings or arrays of strings");
      }
      const validated = commands as string[];
      const characters = validated.reduce(
        (total, command) => total + command.length,
        0,
      );
      if (
        characters > 65536 ||
        (!engine &&
          (queue.length + validated.length > 128 ||
            queuedCharacters + characters > 65536))
      ) {
        throw new Error("Engine initialization command queue overflow");
      }
      if (engine) {
        for (const command of validated) engine.postMessage(command);
      } else {
        queue.push(...validated);
        queuedCharacters += characters;
      }
    } catch (error) {
      fail(error);
    }
  };
  const initialize = async (): Promise<void> => {
    if (
      scope.crossOriginIsolated !== true ||
      typeof scope.SharedArrayBuffer !== "function"
    ) {
      throw new Error(
        "Emscripten workers require crossOriginIsolated and SharedArrayBuffer",
      );
    }
    scope.importScripts(settings.main);
    const factory = scope.Stockfish;
    if (typeof factory !== "function")
      throw new Error("Stockfish factory is unavailable");
    const instance: unknown = await factory({
      mainScriptUrlOrBlob: settings.main,
      locateFile: (path: string): string => {
        if (path === "stockfish.wasm") return settings.wasm;
        if (path === "stockfish.worker.js") return settings.worker;
        throw new Error(`Unknown Emscripten resource: ${path}`);
      },
      onAbort: (reason: unknown): void => {
        fail(reason);
      },
    });
    if (
      typeof instance !== "object" ||
      instance === null ||
      !("addMessageListener" in instance) ||
      typeof instance.addMessageListener !== "function" ||
      !("postMessage" in instance) ||
      typeof instance.postMessage !== "function" ||
      !("terminate" in instance) ||
      typeof instance.terminate !== "function"
    ) {
      throw new Error("Invalid Emscripten engine module");
    }
    const initialized = instance as EngineModule;
    if (stopped) {
      initialized.terminate();
      return;
    }
    engine = initialized;
    engine.addMessageListener((message) => {
      if (stopped) return;
      if (typeof message !== "string") {
        fail(new Error("Engine output must be a string"));
        return;
      }
      scope.postMessage(message);
    });
    for (const message of queue) engine.postMessage(message);
    queue.length = 0;
    queuedCharacters = 0;
  };
  void initialize().catch(fail);
}

/** Bootstraps a verified Emscripten Stockfish factory inside a dedicated worker. */
export class EmscriptenWorkerCommunicator extends WorkerCommunicator {
  private readonly wrapperUrl: string;
  private readonly shutdownToken: string;
  private terminationPromise: Promise<void> | undefined;

  constructor(resources: Readonly<Record<string, string>>) {
    const required = (name: string): string => {
      const value = resources[name];
      if (!value || new URL(value).protocol !== "blob:") {
        throw new Error(`Verified blob resource required: ${name}`);
      }
      return value;
    };
    if (
      typeof SharedArrayBuffer !== "function" ||
      globalThis.crossOriginIsolated !== true
    ) {
      throw new Error(
        "Emscripten workers require crossOriginIsolated and SharedArrayBuffer",
      );
    }
    const settings: BootstrapSettings = {
      main: required("main"),
      wasm: required("wasm"),
      worker: required("worker"),
      token: crypto.randomUUID(),
    };
    const wrapperUrl = URL.createObjectURL(
      new Blob(
        [`(${bootstrap.toString()})(globalThis, ${JSON.stringify(settings)});`],
        {
          type: "text/javascript",
        },
      ),
    );
    try {
      super(wrapperUrl);
    } catch (error) {
      URL.revokeObjectURL(wrapperUrl);
      throw error;
    }
    this.wrapperUrl = wrapperUrl;
    this.shutdownToken = settings.token;
  }

  override terminate(): Promise<void> {
    this.terminationPromise ??= Promise.resolve().then(() =>
      this.performTermination(),
    );
    return this.terminationPromise;
  }

  private async performTermination(): Promise<void> {
    try {
      const acknowledgment = this.expectMessage<unknown>(
        (message) =>
          typeof message === "object" &&
          message !== null &&
          "terminated" in message &&
          message.terminated === this.shutdownToken,
        100,
      );
      // Attach rejection handling before postMessage can throw for a failed worker.
      void acknowledgment.catch(() => {});
      super.postMessage({ terminate: this.shutdownToken });
      await acknowledgment;
    } catch {
      /* A failed worker is still forcibly terminated below. */
    } finally {
      await super.terminate();
      URL.revokeObjectURL(this.wrapperUrl);
    }
  }
}
