export default {
  dashboard: {
    title: "ZENITH ダッシュボード",
    subtitle: "次世代ゲームインテリジェンス・ブリッジ",
    initializingEngines: "エンジンを初期化中...",
    initializationFailed: "初期化に失敗しました",
    languageSelector: "言語選択",
    engineSelector: "エンジン選択",
    chessLabel: "チェス / UCI",
    shogiLabel: "将棋 / USI",
    gameBoard: {
      title: "ゲームボード",
      subtitle: "指し手連携待機中",
      invalidPosition: "不正な盤面状態が検出されました",
      handSente: "先手持駒",
      handGote: "後手持駒",
      chessPieces: {
        p: "ポーン",
        n: "ナイト",
        b: "ビショップ",
        r: "ルーク",
        q: "クイーン",
        k: "キング",
      },
      shogiPieces: {
        FU: "歩",
        KY: "香",
        KE: "桂",
        GI: "銀",
        KI: "金",
        KA: "角",
        HI: "飛",
        OU: "玉",
      },
    },
    stats: {
      engineRuntime: {
        label: "エンジン実行環境",
        value: "WASM スレッド",
        sub: "SIMD 加速",
      },
      hardware: {
        label: "ハードウェア",
        value: "ネイティブ V8",
        sub: "最大最適化",
      },
      performance: {
        label: "パフォーマンス",
        value: "Zenith ティア",
        sub: "低遅延",
      },
      accessibility: {
        label: "アクセシビリティ",
        value: "WCAG 2.2 AA",
        sub: "インクルーシブ・デザイン",
      },
    },
    technicalInsight: {
      title: "技術的な洞察",
      description:
        "このダッシュボードは 2026 エンジンブリッジプロトコルを活用しています。UI をエンジン固有のロジックから分離することで、Worker のシリアライズから React のレンダリングに至るまで、全レイヤーで Zero-Any ポリシーを実現しています。",
    },
    zenithFeatures: {
      title: "Zenith 機能一覧",
      multiPv: "Multi-PV 永続ログ",
      reactiveState: "リアクティブ状態変換",
      contractUi: "契約駆動 UI (Zod)",
    },
    language: {
      ja: "日本語 (JA)",
      en: "英語 (EN)",
    },
    errors: {
      bridgeNotAvailable: "この環境ではエンジンブリッジが利用できません。",
    },
  },
  engine: {
    stockfishTitle: "Stockfish 16.1",
    yaneuraouTitle: "Yaneuraou 7.5.0",
    topCandidate: "最善手候補",
  },
};
