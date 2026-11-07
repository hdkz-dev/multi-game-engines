import { createFairyStockfishEngine } from "@multi-game-engines/adapter-fairy-stockfish";
import { createFairyStockfishShogiEngine } from "@multi-game-engines/adapter-fairy-stockfish-shogi";

const { URL, Worker: NativeWorker } = globalThis;
const audit = {
  created: [],
  revoked: [],
  workers: [],
  workerErrors: [],
  sent: [],
  received: [],
  statuses: [],
};
const create = URL.createObjectURL.bind(URL);
const revoke = URL.revokeObjectURL.bind(URL);
URL.createObjectURL = (blob) => {
  const url = create(blob);
  audit.created.push(url);
  return url;
};
URL.revokeObjectURL = (url) => {
  audit.revoked.push(url);
  revoke(url);
};
globalThis.Worker = class extends NativeWorker {
  constructor(url, options) {
    super(url, options);
    this.auditId = audit.workers.length;
    audit.workers.push({ url: String(url), terminated: false });
    this.addEventListener("error", (event) =>
      audit.workerErrors.push(event.message),
    );
    this.addEventListener("message", (event) => {
      if (typeof event.data === "string") audit.received.push(event.data);
    });
  }
  postMessage(data, ...rest) {
    audit.sent.push(
      typeof data === "string"
        ? data
        : { type: data?.type, keys: Object.keys(data ?? {}) },
    );
    return super.postMessage(data, ...rest);
  }
  terminate() {
    audit.workers[this.auditId].terminated = true;
    return super.terminate();
  }
};
const disposalSnapshot = () => ({
  created: audit.created.length,
  revoked: audit.revoked.length,
  workers: audit.workers.length,
  terminated: audit.workers.filter((worker) => worker.terminated).length,
  allBlobsRevoked: audit.created.every((url) => audit.revoked.includes(url)),
  allWorkersTerminated: audit.workers.every((worker) => worker.terminated),
});
const environmentSnapshot = () => ({
  crossOriginIsolated: globalThis.crossOriginIsolated,
  sharedArrayBuffer: typeof globalThis.SharedArrayBuffer,
});
globalThis.getFairySmokeAudit = () => audit;
globalThis.runFairySmoke = async (protocol) => {
  const engine =
    protocol === "uci"
      ? createFairyStockfishEngine()
      : createFairyStockfishShogiEngine();
  engine.onStatusChange((status) => audit.statuses.push(status));
  engine.consent();
  let phase = "load";
  try {
    await engine.load();
    phase = "search";
    const result = await engine.search(
      protocol === "uci"
        ? {
            fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
            depth: 1,
            time: 500,
          }
        : {
            sfen: "lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1",
            depth: 1,
            movetime: 500,
          },
    );
    phase = "dispose";
    await engine.dispose();
    return {
      ok: true,
      protocol,
      result,
      disposalAtReturn: disposalSnapshot(),
      audit,
      environment: environmentSnapshot(),
    };
  } catch (error) {
    await engine.dispose();
    return {
      ok: false,
      protocol,
      phase,
      error: {
        message: error instanceof Error ? error.message : String(error),
      },
      audit,
      disposalAtReturn: disposalSnapshot(),
      environment: environmentSnapshot(),
    };
  }
};
