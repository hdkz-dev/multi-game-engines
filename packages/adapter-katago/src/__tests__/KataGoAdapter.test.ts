/**
 * Unit tests for KataGoONNXAdapter.
 *
 * onnxruntime-web is mocked: InferenceSession.create() returns a stub that
 * responds with a flat policy tensor (uniform logits).  No real ONNX model
 * is downloaded during tests.
 */
import { describe, it, expect, vi, beforeAll, afterAll } from "vitest";
import { KataGoONNXAdapter, KataGoAdapter, KataGoBoard } from "../index.js";

// ── Mock onnxruntime-web ──────────────────────────────────────────────────────

const CELLS = 19 * 19;

class MockTensor {
  data: Float32Array;
  constructor(_type: string, data: Float32Array, _shape: number[]) {
    this.data = data;
  }
}

const mockPolicy = new Float32Array(CELLS + 1).fill(0.1);
// Make move index 0 the highest-probability move
mockPolicy[0] = 10.0;

const mockSession = {
  run: vi.fn().mockResolvedValue({
    policy: { data: mockPolicy },
  }),
  release: vi.fn().mockResolvedValue(undefined),
};

vi.mock("onnxruntime-web", () => ({
  InferenceSession: {
    create: vi.fn().mockResolvedValue(mockSession),
  },
  Tensor: MockTensor,
}));

// ─────────────────────────────────────────────────────────────────────────────

describe("KataGoONNXAdapter", () => {
  beforeAll(() => {
    vi.spyOn(performance, "now").mockReturnValue(0);
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it("KataGoAdapter is an alias for KataGoONNXAdapter", () => {
    expect(KataGoAdapter).toBe(KataGoONNXAdapter);
  });

  it("should initialise with id 'katago'", () => {
    const adapter = new KataGoONNXAdapter();
    expect(adapter.id).toBe("katago");
    expect(adapter.version).toBe("1.14");
  });

  it("should be 'uninitialized' before load()", () => {
    const adapter = new KataGoONNXAdapter();
    expect(adapter.status).toBe("uninitialized");
  });

  it("should reach 'ready' after load()", async () => {
    const adapter = new KataGoONNXAdapter();
    await adapter.load();
    expect(adapter.status).toBe("ready");
    await adapter.dispose();
  });

  it("should call InferenceSession.create with the model URL", async () => {
    const { InferenceSession } = await import("onnxruntime-web");
    const adapter = new KataGoONNXAdapter({
      sources: {
        main: { url: "https://example.com/katago.onnx" } as never,
      },
    });
    await adapter.load();
    expect(InferenceSession.create).toHaveBeenCalledWith(
      "https://example.com/katago.onnx",
      expect.objectContaining({ executionProviders: ["wasm"] }),
    );
    await adapter.dispose();
  });

  it("should return a bestMove string after search()", async () => {
    const adapter = new KataGoONNXAdapter();
    await adapter.load();
    const result = await adapter.search({ board: "startpos", size: 19 });
    expect(result.bestMove).not.toBeNull();
    // Move index 0 is column A row 1 → "A1"; GOMove is a branded string
    expect(typeof (result.bestMove as unknown as string)).toBe("string");
    await adapter.dispose();
  });

  it("should throw NOT_READY if search() called before load()", async () => {
    const adapter = new KataGoONNXAdapter();
    await expect(adapter.search({ size: 19 })).rejects.toMatchObject({
      code: "NOT_READY",
    });
  });

  it("should reset board on 'startpos'", async () => {
    const adapter = new KataGoONNXAdapter();
    await adapter.load();
    await adapter.search({ board: "startpos", size: 19 });
    // Second search with startpos should also work (board reset)
    const result = await adapter.search({ board: "startpos", size: 19 });
    expect(result.bestMove).toBeDefined();
    await adapter.dispose();
  });

  it("dispose() should release the ONNX session", async () => {
    const adapter = new KataGoONNXAdapter();
    await adapter.load();
    await adapter.dispose();
    expect(mockSession.release).toHaveBeenCalled();
    expect(adapter.status).toBe("terminated");
  });
});

describe("KataGoBoard", () => {
  it("should start empty", () => {
    const board = new KataGoBoard(9);
    expect(board.stones.every((s) => s === 0)).toBe(true);
  });

  it("should apply a move and update stone at the correct index", () => {
    const board = new KataGoBoard(9);
    board.applyMove("A1"); // row=0, col=0 → index 0
    expect(board.stones[0]).toBe(1); // black
  });

  it("should alternate player after each move", () => {
    const board = new KataGoBoard(9);
    expect(board.currentPlayer).toBe(1);
    board.applyMove("A1");
    expect(board.currentPlayer).toBe(2);
    board.applyMove("B1");
    expect(board.currentPlayer).toBe(1);
  });

  it("gtpToIndex / indexToGtp roundtrip", () => {
    const idx = KataGoBoard.gtpToIndex("D4", 19);
    expect(idx).toBe(3 * 19 + 3); // col D=3, row 4=3
    expect(KataGoBoard.indexToGtp(idx, 19)).toBe("D4");
  });

  it("pass should return index -1", () => {
    expect(KataGoBoard.gtpToIndex("pass", 19)).toBe(-1);
  });

  it("should maintain history snapshots", () => {
    const board = new KataGoBoard(9);
    board.applyMove("A1"); // black at index 0
    // historyAt(0) = current board — black stone at 0
    expect(board.historyAt(0)[0]).toBe(1);
    // historyAt(1) = snapshot before A1 was played — empty
    expect(board.historyAt(1)[0]).toBe(0);
  });
});
