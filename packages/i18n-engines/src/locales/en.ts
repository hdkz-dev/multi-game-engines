export default {
  engines: {
    stockfish: {
      name: "Stockfish",
      description: "Strong open-source chess engine",
    },
    yaneuraou: {
      name: "Yaneuraou",
      description: "Powerful Shogi engine",
    },
  },
  registry: {
    title: "Engine Registry",
    loading: "Loading engines...",
    empty: "No engines found",
    invalidManifest: "Invalid registry manifest",
    fetchFailed: "Failed to fetch registry",
    invalidFormat: "Invalid registry format",
    timeout: "Registry operation timed out",
    sriMismatch: "Integrity verification failed for registry",
    invalidSriFormat: "Invalid SRI format in registry",
    unsupportedAlgorithm: "Unsupported hashing algorithm in registry",
    notLoaded: "Registry is not loaded",
  },
  ensemble: {
    errors: {
      noResults: "No results received from ensemble engines",
    },
    weighted: {
      initialized: "Initialized with weighted strategy for: {engines}",
      noWeight: "No weight configured for engine: {id}",
    },
  },
};
