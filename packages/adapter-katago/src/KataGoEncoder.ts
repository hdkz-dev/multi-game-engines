/**
 * KataGo neural network input encoder.
 *
 * Produces the binary spatial feature planes consumed by KataGo's ONNX model.
 * Based on KataGo v1.14 input format ("v5" features):
 *
 *   bin_input_global_ncplane  [1, C, N, N]  float32
 *   global_input              [1, 19]        float32
 *
 * Feature plane layout (C = 22):
 *   0   current player stones
 *   1   opponent stones
 *   2   current player stones T-1
 *   3   opponent stones T-1
 *   4   current player stones T-2
 *   5   opponent stones T-2
 *   6   current player stones T-3
 *   7   opponent stones T-3
 *   8   current player stones T-4
 *   9   opponent stones T-4
 *  10   current player stones T-5
 *  11   opponent stones T-5
 *  12   current player stones T-6
 *  13   opponent stones T-6
 *  14   ko point (current player may not play here)
 *  15   board edge / padding (1 outside board)
 *  16   1 if board is 9×9 or smaller
 *  17   1 if board is 13×13 or smaller
 *  18   1 if board is 19×19
 *  19   always-1 layer
 *  20   next-is-second-pass (pass-alive ko)
 *  21   positional superko (0 for simplified version)
 *
 * Global input features (19 values):
 *   0   komi / 15  (normalised)
 *   1-7 (reserved / zero for simplified version)
 */

import { KataGoBoard, type Color } from "./KataGoBoard.js";

export const KATAGO_INPUT_PLANES = 22;
export const KATAGO_GLOBAL_FEATURES = 19;

export interface KataGoTensors {
  /** Float32Array of shape [1, PLANES, N, N] */
  binInput: Float32Array;
  /** Float32Array of shape [1, 19] */
  globalInput: Float32Array;
}

/**
 * Encode the current board state into KataGo input tensors.
 *
 * @param board - The KataGoBoard instance (tracks history internally).
 * @param komi - Game komi (e.g. 6.5 or 7.5).
 */
export function encodePosition(board: KataGoBoard, komi = 6.5): KataGoTensors {
  const N = board.size;
  const cells = N * N;
  const curPlayer = board.currentPlayer as Color; // 1=black, 2=white
  const opp: Color = curPlayer === 1 ? 2 : 1;

  const binInput = new Float32Array(KATAGO_INPUT_PLANES * cells);

  function setPlane(plane: number, idx: number, val: number): void {
    binInput[plane * cells + idx] = val;
  }

  // Planes 0-13: stone history (current/opp, 7 depths)
  for (let depth = 0; depth < 7; depth++) {
    const snapshot = board.historyAt(depth);
    const pCur = depth * 2; // current player plane index
    const pOpp = depth * 2 + 1; // opponent plane index
    for (let i = 0; i < cells; i++) {
      if (snapshot[i] === curPlayer) setPlane(pCur, i, 1);
      else if (snapshot[i] === opp) setPlane(pOpp, i, 1);
    }
  }

  // Plane 14: ko point
  const ko = board.koPoint;
  if (ko >= 0) setPlane(14, ko, 1);

  // Plane 15: board edge / padding — 0 (we don't pad outside the actual board)
  // All cells are inside the board, so leave as 0.

  // Planes 16-18: board size encoding
  if (N <= 9) {
    for (let i = 0; i < cells; i++) setPlane(16, i, 1);
  }
  if (N <= 13) {
    for (let i = 0; i < cells; i++) setPlane(17, i, 1);
  }
  if (N <= 19) {
    for (let i = 0; i < cells; i++) setPlane(18, i, 1);
  }

  // Plane 19: always-1
  for (let i = 0; i < cells; i++) setPlane(19, i, 1);

  // Planes 20-21: pass-alive / superko — leave as 0

  // Global features
  const globalInput = new Float32Array(KATAGO_GLOBAL_FEATURES);
  globalInput[0] = komi / 15; // normalised komi

  return { binInput, globalInput };
}

/**
 * Decode the policy logits output from KataGo.
 *
 * KataGo outputs policy over N*N + 1 moves (last = pass).
 * Returns a list of (move_index, probability) pairs sorted by probability.
 */
export function decodePolicy(
  policyLogits: Float32Array,
  boardSize: number,
): Array<{ index: number; prob: number; gtp: string }> {
  const cells = boardSize * boardSize;
  // softmax
  let maxLogit = -Infinity;
  for (let i = 0; i <= cells; i++)
    maxLogit = Math.max(maxLogit, policyLogits[i]!);
  let sumExp = 0;
  const probs = new Float32Array(cells + 1);
  for (let i = 0; i <= cells; i++) {
    probs[i] = Math.exp(policyLogits[i]! - maxLogit);
    sumExp += probs[i]!;
  }
  for (let i = 0; i <= cells; i++) probs[i] = (probs[i] ?? 0) / sumExp;

  // probs[] is already normalised (divided by sumExp above).
  const result: Array<{ index: number; prob: number; gtp: string }> = [];
  for (let i = 0; i <= cells; i++) {
    result.push({
      index: i,
      prob: probs[i] ?? 0,
      gtp: i === cells ? "pass" : KataGoBoard.indexToGtp(i, boardSize),
    });
  }
  result.sort((a, b) => b.prob - a.prob);
  return result;
}
