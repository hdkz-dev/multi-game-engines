#!/usr/bin/env bash
# download-katago-onnx.sh
#
# DEPRECATED: このスクリプトは build-wasm.yml の build-katago ジョブに
# 統合されました。直接呼び出す必要はありません。
#
# CI フロー (build-wasm.yml:build-katago):
#   1. KATAGO_ONNX_URL シークレットが設定されている場合:
#      → シークレット URL から実際の KataGo ONNX モデルをダウンロード
#   2. シークレットが設定されていない場合:
#      → scripts/create-katago-stub-onnx.py で開発/テスト用スタブを生成
#   3. artifact を docs.yml がダウンロードして GitHub Pages に配置
#   4. refresh-sri.yml が公開 URL から SHA-384 を取得して engines.json に反映
#
# (このスクリプトをローカル実行した場合のみ、まだ未デプロイのモデルを
#  先行して pin できるよう sri-hashes/katago-1.14.txt に書き出す)
#
# 本番用の実 ONNX モデルを使用する場合:
#   gh secret set KATAGO_ONNX_URL  # リポジトリシークレットとして ONNX モデルの URL を設定
#   gh workflow run build-wasm.yml --ref main
#
# ローカルで手動実行する場合 (実 ONNX URL が必要):
#   KATAGO_ONNX_URL=<url> ./scripts/download-katago-onnx.sh [output_dir]

set -euo pipefail

OUTPUT_DIR="${1:-dist/katago/1.14}"
ONNX_FILENAME="katago-b6c96.onnx"
OUTPUT_FILE="${OUTPUT_DIR}/${ONNX_FILENAME}"

mkdir -p "${OUTPUT_DIR}"

if [[ -n "${KATAGO_ONNX_URL:-}" ]]; then
  echo "📥  Downloading KataGo ONNX model from \$KATAGO_ONNX_URL ..."
  curl -fsSL --retry 3 --retry-delay 5 \
    -o "${OUTPUT_FILE}" \
    "${KATAGO_ONNX_URL}"
  echo "✅  Downloaded: $(du -sh "${OUTPUT_FILE}" | cut -f1)"
else
  echo "ℹ️  KATAGO_ONNX_URL not set."
  echo "   In CI, the build-katago job generates a stub model automatically."
  echo "   Locally, run: KATAGO_ONNX_URL=<url> ./scripts/download-katago-onnx.sh"
  echo "   Or generate stub: pip install onnx numpy && python3 scripts/create-katago-stub-onnx.py ${OUTPUT_FILE}"
  exit 0
fi

# ── SRI hash ────────────────────────────────────────────────────────────────
if [[ -f "${OUTPUT_FILE}" ]]; then
  SRI_HASH="sha384-$(openssl dgst -sha384 -binary "${OUTPUT_FILE}" | base64 | tr -d '\n')"
  echo "🔐  SRI: ${SRI_HASH}"
  SRI_DIR="packages/registry/data/sri-hashes"
  mkdir -p "${SRI_DIR}"
  echo "${SRI_HASH}" > "${SRI_DIR}/katago-1.14.txt"
  echo "✅  Written to ${SRI_DIR}/katago-1.14.txt — run 'pnpm sri:refresh' to apply."
fi
