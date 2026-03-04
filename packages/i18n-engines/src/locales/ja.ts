export default {
  engines: {
    stockfish: {
      name: "Stockfish",
      description: "強力なオープンソースのチェスエンジン",
    },
    yaneuraou: {
      name: "やねうら王",
      description: "強力な将棋エンジン",
    },
  },
  registry: {
    title: "エンジンレジストリ",
    loading: "エンジンを読み込み中...",
    empty: "エンジンが見つかりません",
    invalidManifest: "不正なレジストリ・マニフェストです",
    fetchFailed: "レジストリの取得に失敗しました",
    invalidFormat: "不正なレジストリ形式です",
    timeout: "レジストリ操作がタイムアウトしました",
    sriMismatch: "レジストリの整合性検証に失敗しました",
    invalidSriFormat: "レジストリの SRI 形式が不正です",
    unsupportedAlgorithm: "サポートされていないハッシュアルゴリズムです",
    notLoaded: "レジストリがロードされていません",
  },
  ensemble: {
    errors: {
      noResults: "アンサンブルエンジンから結果が返されませんでした",
    },
    weighted: {
      initialized: "以下のエンジンの重み付き戦略で初期化されました: {engines}",
      noWeight: "エンジン {id} に重みが設定されていません",
    },
  },
};
