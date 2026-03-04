export default {
  dashboard: {
    title: "ZENITH DASHBOARD",
    subtitle: "Next-Gen Game Intelligence Bridge",
    initializingEngines: "Initializing Engines...",
    initializationFailed: "Initialization Failed",
    languageSelector: "Select Language",
    engineSelector: "Select Engine",
    chessLabel: "Chess / UCI",
    shogiLabel: "Shogi / USI",
    gameBoard: {
      title: "Game Board",
      subtitle: "Waiting for Move Synchronized",
      invalidPosition: "Invalid board position detected",
      handSente: "Sente Hand",
      handGote: "Gote Hand",
      chessPieces: {
        p: "Pawn",
        n: "Knight",
        b: "Bishop",
        r: "Rook",
        q: "Queen",
        k: "King",
      },
      shogiPieces: {
        FU: "Pawn",
        KY: "Lance",
        KE: "Knight",
        GI: "Silver",
        KI: "Gold",
        KA: "Bishop",
        HI: "Rook",
        OU: "King",
      },
    },
    stats: {
      engineRuntime: {
        label: "Engine Runtime",
        value: "WASM Threads",
        sub: "SIMD Accelerated",
      },
      hardware: {
        label: "Hardware",
        value: "Native V8",
        sub: "Max Optimized",
      },
      performance: {
        label: "Performance",
        value: "Zenith Tier",
        sub: "Low Latency",
      },
      accessibility: {
        label: "Accessibility",
        value: "WCAG 2.2 AA",
        sub: "Inclusive Design",
      },
    },
    technicalInsight: {
      title: "Technical Insight",
      description:
        "This dashboard utilizes the 2026 Engine Bridge Protocol. By separating UI from engine-specific logic, we achieve a Zero-Any policy across all layers, from Worker serialization to React rendering.",
    },
    zenithFeatures: {
      title: "Zenith Features",
      multiPv: "Multi-PV Persistent Log",
      reactiveState: "Reactive State Transformation",
      contractUi: "Contract-Driven UI (Zod)",
    },
    language: {
      ja: "Japanese (JA)",
      en: "English (EN)",
    },
    errors: {
      bridgeNotAvailable: "Engine bridge is not available in this environment.",
    },
  },
  engine: {
    stockfishTitle: "Stockfish 16.1",
    yaneuraouTitle: "Yaneuraou 7.5.0",
    topCandidate: "Top Candidate",
  },
};
