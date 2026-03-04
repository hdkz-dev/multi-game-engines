export default {
  engine: {
    title: "チェスエンジン",
    status: "ステータス",
    depth: "深さ",
    nodes: "ノード数",
    nps: "NPS",
    time: "時間",
    score: "評価値",
    visits: "試行回数",
    mateIn: "{n} 手詰",
    advantage: "優勢 +{v}",
    sideWhite: "先手 (白)",
    sideBlack: "後手 (黒)",
  },
  errors: {
    missingFEN: "探索オプションに FEN 文字列がありません。",
    invalidFEN: 'FEN 形式が不正です: "{fen}"。',
  },
};
