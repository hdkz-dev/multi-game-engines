/**
 * Lightweight Go board for KataGo ONNX input encoding.
 *
 * Tracks stone placement and history (up to 8 moves back) needed to
 * construct KataGo's binary spatial feature planes.
 */

export type Color = 0 | 1 | 2; // 0 = empty, 1 = black, 2 = white

/** GTP column letters: A–T skipping I */
const GTP_COLS = "ABCDEFGHJKLMNOPQRST";

export interface Stone {
  row: number; // 0-indexed from bottom (GTP convention)
  col: number; // 0-indexed from left
}

export class KataGoBoard {
  readonly size: number;
  private _board: Color[];
  /** Board snapshots for last N plies (index 0 = most recent) */
  private _history: Color[][];
  private _koPoint: number; // flat index or -1
  private _currentPlayer: Color; // 1=black, 2=white

  constructor(size = 19) {
    this.size = size;
    this._board = new Array<Color>(size * size).fill(0);
    this._history = [];
    this._koPoint = -1;
    this._currentPlayer = 1;
  }

  get currentPlayer(): Color {
    return this._currentPlayer;
  }

  get koPoint(): number {
    return this._koPoint;
  }

  /** Return flat board array (copy). */
  get stones(): Color[] {
    return this._board.slice();
  }

  /** Return a history snapshot at depth d (0 = current, 1 = one move ago …). */
  historyAt(d: number): Color[] {
    if (d === 0) return this._board;
    return this._history[d - 1] ?? this._board;
  }

  /** Convert "D4" / "pass" / "resign" to flat board index or -1. */
  static gtpToIndex(gtpMove: string, size: number): number {
    const m = gtpMove.trim().toLowerCase();
    if (m === "pass" || m === "resign") return -1;
    const col = GTP_COLS.toLowerCase().indexOf(m[0]!);
    const row = parseInt(m.slice(1), 10) - 1;
    if (col === -1 || row < 0 || row >= size || col >= size) return -1;
    return row * size + col;
  }

  /** Convert flat index back to GTP string. */
  static indexToGtp(idx: number, size: number): string {
    if (idx < 0) return "pass";
    const col = idx % size;
    const row = Math.floor(idx / size);
    return `${GTP_COLS[col]}${row + 1}`;
  }

  /** Apply a move (GTP string or "pass") to the board. */
  applyMove(gtpMove: string): void {
    // Save snapshot before mutation
    this._history.unshift(this._board.slice());
    if (this._history.length > 8) this._history.pop();

    const idx = KataGoBoard.gtpToIndex(gtpMove, this.size);
    if (idx >= 0) {
      this._board[idx] = this._currentPlayer;
      // Simple ko: detect single-stone capture on opponent after placing stone
      this._koPoint = this._detectKo(idx);
      this._removeCaptures(idx);
    } else {
      this._koPoint = -1;
    }

    this._currentPlayer = this._currentPlayer === 1 ? 2 : 1;
  }

  /** Reset to empty board (new game). */
  reset(): void {
    this._board.fill(0);
    this._history = [];
    this._koPoint = -1;
    this._currentPlayer = 1;
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private _neighbors(idx: number): number[] {
    const s = this.size;
    const row = Math.floor(idx / s);
    const col = idx % s;
    const nb: number[] = [];
    if (row > 0) nb.push(idx - s);
    if (row < s - 1) nb.push(idx + s);
    if (col > 0) nb.push(idx - 1);
    if (col < s - 1) nb.push(idx + 1);
    return nb;
  }

  private _groupAndLiberties(idx: number): {
    group: number[];
    liberties: number[];
  } {
    const color = this._board[idx];
    if (!color) return { group: [], liberties: [] };
    const visited = new Set<number>();
    const liberties = new Set<number>();
    const queue = [idx];
    while (queue.length) {
      const cur = queue.pop()!;
      if (visited.has(cur)) continue;
      visited.add(cur);
      for (const nb of this._neighbors(cur)) {
        const nbColor = this._board[nb];
        if (nbColor === 0) liberties.add(nb);
        else if (nbColor === color && !visited.has(nb)) queue.push(nb);
      }
    }
    return { group: [...visited], liberties: [...liberties] };
  }

  /** Remove captured opponent groups; return captured count. */
  private _removeCaptures(placedIdx: number): number {
    const opp: Color = this._currentPlayer === 1 ? 2 : 1;
    let captured = 0;
    for (const nb of this._neighbors(placedIdx)) {
      if (this._board[nb] === opp) {
        const { group, liberties } = this._groupAndLiberties(nb);
        if (liberties.length === 0) {
          for (const stone of group) this._board[stone] = 0;
          captured += group.length;
        }
      }
    }
    return captured;
  }

  /** Very simple ko detection: returns the ko point index or -1. */
  private _detectKo(placedIdx: number): number {
    const opp: Color = this._currentPlayer === 1 ? 2 : 1;
    let singleCapture = -1;
    let captureCount = 0;
    for (const nb of this._neighbors(placedIdx)) {
      if (this._board[nb] === opp) {
        const { group, liberties } = this._groupAndLiberties(nb);
        if (liberties.length === 0) {
          captureCount += group.length;
          if (group.length === 1) singleCapture = group[0]!;
        }
      }
    }
    if (captureCount === 1 && singleCapture >= 0) {
      // Also check the placed stone has exactly one liberty after the capture
      // (the captured point) to confirm it's a ko
      const { liberties: myLibs } = this._groupAndLiberties(placedIdx);
      if (myLibs.length === 1 && myLibs[0] === singleCapture) {
        return singleCapture;
      }
    }
    return -1;
  }
}
