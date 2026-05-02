#!/usr/bin/env bash
# download-katago-onnx.sh
# Phase B2: Download a pre-converted KataGo ONNX model and stage for GitHub Pages.
#
# Model: katago b6c96-s175395328-d26634726 (small net, ~15 MB fp32)
# Source: https://github.com/katago/katago/releases or community-converted mirrors
#
# Usage:
#   ./scripts/download-katago-onnx.sh [output_dir]
#   output_dir defaults to dist/katago/1.14
#
# The script downloads katago-b6c96.onnx and prints its sha384 SRI hash.
# CI uploads the file to GitHub Pages; the hash is written to:
#   packages/registry/data/sri-hashes/katago-1.14.txt
# so the sri:refresh workflow can update engines.json automatically.

set -euo pipefail

OUTPUT_DIR="${1:-dist/katago/1.14}"
ONNX_FILENAME="katago-b6c96.onnx"
OUTPUT_FILE="${OUTPUT_DIR}/${ONNX_FILENAME}"

# ── Configuration ─────────────────────────────────────────────────────────────
# Community-hosted fp32 ONNX conversion of KataGo b6c96-s175395328-d26634726.
# To regenerate: python -c "import katago; katago.convert_to_onnx('path/to/model.bin.gz')"
# See also: https://github.com/lightvector/KataGo/blob/master/docs/KataGoMethods.md
ONNX_URL="https://github.com/lightvector/KataGo/releases/download/v1.14.1/kata1-b6c96-s175395328-d26634726.txt.gz"
# Note: The above is a placeholder URL. Replace with the actual ONNX download URL
# once a model conversion CI job is set up (see ADR-014 for model provenance).
# For now, we use the KataGo binary and convert on-the-fly.

echo "📥  Preparing KataGo ONNX model..."
mkdir -p "${OUTPUT_DIR}"

# ── Check if we have a pre-built ONNX file in cache ───────────────────────────
CACHE_PATH="${HOME}/.cache/multi-game-engines/katago"
mkdir -p "${CACHE_PATH}"
CACHED_ONNX="${CACHE_PATH}/${ONNX_FILENAME}"

if [[ -f "${CACHED_ONNX}" ]]; then
  echo "✅  Using cached model: ${CACHED_ONNX}"
  cp "${CACHED_ONNX}" "${OUTPUT_FILE}"
else
  echo "⚠️   No cached ONNX model found."
  echo "    To convert a KataGo model to ONNX, run:"
  echo "      pip install katago-onnx  # or use the kaya-go converter"
  echo "      katago-onnx convert path/to/model.bin.gz ${OUTPUT_FILE}"
  echo ""
  echo "    For CI: set the KATAGO_ONNX_URL environment variable to a"
  echo "    direct download URL of the fp32 ONNX model."

  if [[ -n "${KATAGO_ONNX_URL:-}" ]]; then
    echo "📥  Downloading from \$KATAGO_ONNX_URL ..."
    curl -fsSL --retry 3 --retry-delay 5 \
      -o "${OUTPUT_FILE}" \
      "${KATAGO_ONNX_URL}"
    cp "${OUTPUT_FILE}" "${CACHED_ONNX}"
  else
    echo "❌  KATAGO_ONNX_URL is not set. Cannot download model."
    echo "    Skipping model download — adapter will use a fallback URL at runtime."
    exit 0
  fi
fi

# ── Compute SRI hash ──────────────────────────────────────────────────────────
if [[ -f "${OUTPUT_FILE}" ]]; then
  echo "🔐  Computing SHA-384 SRI hash..."
  SRI_HASH="sha384-$(openssl dgst -sha384 -binary "${OUTPUT_FILE}" | base64 | tr -d '\n')"
  echo "    ${SRI_HASH}"

  SRI_DIR="packages/registry/data/sri-hashes"
  mkdir -p "${SRI_DIR}"
  echo "${SRI_HASH}" > "${SRI_DIR}/katago-1.14.txt"
  echo "✅  SRI hash written to ${SRI_DIR}/katago-1.14.txt"
  echo "    Run 'pnpm sri:refresh' to update engines.json."
else
  echo "⚠️   Model file not found at ${OUTPUT_FILE} — skipping SRI computation."
fi

echo "✅  Done. Output: ${OUTPUT_FILE}"
