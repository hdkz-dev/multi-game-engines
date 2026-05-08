/**
 * mortal-stub-worker.js
 *
 * Mortal 麻雀エンジン スタブ Worker (development / CI 用)
 *
 * 実際の Mortal AI (PyTorch ベース) は WebAssembly への直接コンパイルが
 * 困難なため、このスタブは MahjongJSONParser が期待する JSON プロトコルを
 * 実装し、アダプターのパイプライン全体をテスト可能にします。
 *
 * プロトコル:
 *   入力  { type: "search",  board: {...} }
 *         { type: "stop"                  }
 *         { type: "option", name, value   }
 *   出力  { type: "info",   thinking, evaluations: [{move, ev, prob}] }
 *         { type: "result", bestMove }
 *
 * 有効な指し手フォーマット: /^([1-9][mpsz]|tsumo|ron|riichi|chi|pon|kan|kakan|nuki|none)$/
 *
 * NOTE: 実戦向けでありません。後に実際の Mortal ONNX 統合に置き換えてください。
 */

"use strict";

// ── 有効な指し手リスト ────────────────────────────────────────────────────────
const TILES = [
  "1m",
  "2m",
  "3m",
  "4m",
  "5m",
  "6m",
  "7m",
  "8m",
  "9m",
  "1p",
  "2p",
  "3p",
  "4p",
  "5p",
  "6p",
  "7p",
  "8p",
  "9p",
  "1s",
  "2s",
  "3s",
  "4s",
  "5s",
  "6s",
  "7s",
  "8s",
  "9s",
  "1z",
  "2z",
  "3z",
  "4z",
  "5z",
  "6z",
  "7z",
];

const SPECIAL_ACTIONS = [
  "tsumo",
  "ron",
  "riichi",
  "chi",
  "pon",
  "kan",
  "kakan",
  "nuki",
  "none",
];

/** board.hand (配列) から最初の牌を返す簡易ロジック */
function pickDiscard(board) {
  // board.hand が配列の場合 (["1m","2p",...])
  if (board && Array.isArray(board.hand) && board.hand.length > 0) {
    const hand = board.hand;
    const tile = hand[hand.length - 1]; // 最後の牌 (通常ツモ牌)
    if (typeof tile === "string" && /^[1-9][mpsz]$/.test(tile)) {
      return tile;
    }
    // 最初の有効な牌を探す
    for (const t of hand) {
      if (
        typeof t === "string" &&
        /^([1-9][mpsz]|tsumo|ron|riichi|none)$/.test(t)
      ) {
        return t;
      }
    }
  }
  // フォールバック: 乱数で牌を選択 (再現性のため簡易ハッシュ使用)
  const seed = JSON.stringify(board ?? "").length % TILES.length;
  return TILES[seed];
}

/** 評価値リスト生成: 上位 5 牌に確率を割り当て */
function buildEvaluations(board, bestMove) {
  const moves = [];
  const seen = new Set();

  // ベスト手を先頭に
  moves.push({ move: bestMove, ev: 0.0, prob: 0.4 });
  seen.add(bestMove);

  // hand から残りの候補
  if (board && Array.isArray(board.hand)) {
    for (const t of board.hand) {
      if (seen.size >= 5) break;
      if (typeof t === "string" && !seen.has(t) && /^[1-9][mpsz]$/.test(t)) {
        const prob = Number((0.15 - seen.size * 0.02).toFixed(2));
        moves.push({ move: t, ev: -seen.size * 0.05, prob });
        seen.add(t);
      }
    }
  }

  // 不足分をデフォルト牌で補完
  for (const t of TILES) {
    if (seen.size >= 5) break;
    if (!seen.has(t)) {
      moves.push({ move: t, ev: -seen.size * 0.1, prob: 0.05 });
      seen.add(t);
    }
  }

  return moves;
}

// ── Worker メッセージハンドラ ────────────────────────────────────────────────
let searching = false;
let searchTimeout = null;

self.onmessage = function (event) {
  const msg =
    typeof event.data === "string"
      ? (() => {
          try {
            return JSON.parse(event.data);
          } catch {
            return null;
          }
        })()
      : event.data;

  if (!msg || typeof msg !== "object") return;

  switch (msg.type) {
    case "search": {
      searching = true;
      const board = msg.board ?? {};
      const bestMove = pickDiscard(board);
      const evaluations = buildEvaluations(board, bestMove);

      // info メッセージ (思考ログ)
      self.postMessage(
        JSON.stringify({
          type: "info",
          thinking: `[mortal-stub] evaluating ${evaluations.length} candidates`,
          evaluations,
        }),
      );

      // 非同期で result を返す (10ms 後)
      searchTimeout = setTimeout(() => {
        if (!searching) return;
        searching = false;
        self.postMessage(
          JSON.stringify({
            type: "result",
            bestMove,
          }),
        );
      }, 10);
      break;
    }

    case "stop": {
      searching = false;
      if (searchTimeout !== null) {
        clearTimeout(searchTimeout);
        searchTimeout = null;
      }
      // stop 後に result: null を送信
      self.postMessage(
        JSON.stringify({
          type: "result",
          bestMove: null,
        }),
      );
      break;
    }

    case "option": {
      // オプション設定: スタブでは無視
      break;
    }

    default:
      break;
  }
};

// Worker 起動ログ
self.postMessage(
  JSON.stringify({
    type: "info",
    thinking: "[mortal-stub] worker ready (development stub — not a real AI)",
    evaluations: [],
  }),
);
