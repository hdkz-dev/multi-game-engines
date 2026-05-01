#!/usr/bin/env bash
# =============================================================================
# build-edax-wasm.sh — Compile Edax (Othello/Reversi) to WebAssembly
#
# Source:  abulmo/edax-reversi v4.4 (GPL-2.0-or-later)
# Output:  edax.module.js + edax.module.wasm  (Emscripten ASYNCIFY build)
#          edax.js                             (committed Worker wrapper)
#
# Usage:
#   # In CI (Emscripten SDK pre-installed via mymindstorm/setup-emscripten):
#   bash scripts/build-edax-wasm.sh
#
#   # Locally with Docker:
#   docker run --rm -v $(pwd):/src -w /src \
#     emscripten/emsdk:4.0.10 bash scripts/build-edax-wasm.sh
#
# Requirements: emcc (Emscripten ≥ 3.1.57), unzip, curl
# =============================================================================
set -euo pipefail

EDAX_VERSION="4.4.0"
EDAX_REPO="https://github.com/abulmo/edax-reversi"
EDAX_TAG="v${EDAX_VERSION}"

SRC_DIR="/tmp/edax-src"
OUT_DIR="${EDAX_BUILD_OUT:-/tmp/edax-build}"

echo "=== Edax WASM Build ==="
echo "  Version : ${EDAX_VERSION}"
echo "  Source  : ${EDAX_REPO}"
echo "  Output  : ${OUT_DIR}"
echo ""

mkdir -p "$OUT_DIR"

# ── 1. Clone source ──────────────────────────────────────────────────────────
if [[ ! -d "$SRC_DIR/.git" ]]; then
  echo "Cloning abulmo/edax-reversi ${EDAX_TAG}..."
  git clone --depth=1 --branch "$EDAX_TAG" "$EDAX_REPO" "$SRC_DIR" \
    || { echo "Tag ${EDAX_TAG} not found, trying master..."; git clone --depth=1 "$EDAX_REPO" "$SRC_DIR"; }
else
  echo "Using cached source at ${SRC_DIR}"
fi

echo ""
echo "Source tree (src/):"
ls "$SRC_DIR/src/" | head -20

# ── 2. Compile with Emscripten ───────────────────────────────────────────────
echo ""
echo "Compiling with emcc $(emcc --version | head -1)..."

# Use all.c — Edax's unity build entry point. It includes the other .c files
# internally and uses ifdefs to select the right platform variant. Compiling
# *.c directly would include AVX/BMI/SSE files that use x86-only intrinsics
# and will fail under Emscripten.
SRC_ENTRY="$SRC_DIR/src/all.c"
if [[ ! -f "$SRC_ENTRY" ]]; then
  echo "ERROR: $SRC_ENTRY not found. Source clone may be incomplete."
  ls "$SRC_DIR/src/"
  exit 1
fi
echo "Using unity build entry: $SRC_ENTRY"

emcc "$SRC_ENTRY" \
  -I "$SRC_DIR/src" \
  -O2 \
  -DHAS_CPU_64=1 \
  -DUSE_PTHREADS=0 \
  -DLASTFLIP_PLAIN \
  -sWASM=1 \
  -sASYNCIFY=1 \
  -sASYNCIFY_STACK_SIZE=65536 \
  -sMODULARIZE=1 \
  -sEXPORT_NAME=createEdaxModule \
  -sEXPORTED_RUNTIME_METHODS=FS,callMain \
  -sALLOW_MEMORY_GROWTH=1 \
  -sINITIAL_MEMORY=134217728 \
  -sMAXIMUM_MEMORY=536870912 \
  -sENVIRONMENT=worker \
  -sEXIT_RUNTIME=0 \
  --preload-file "$SRC_DIR/data"@/data \
  -o "$OUT_DIR/edax.module.js" \
  2>&1

echo ""
echo "Build complete:"
ls -lh "$OUT_DIR/"

# ── 3. Copy the committed Worker wrapper alongside the module ─────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cp "$SCRIPT_DIR/edax-worker.js" "$OUT_DIR/edax.js"
echo "Worker wrapper copied: edax.js"

# ── 4. Emit size summary ──────────────────────────────────────────────────────
echo ""
echo "=== Output summary ==="
for f in "$OUT_DIR"/*; do
  size=$(wc -c < "$f")
  printf "  %-40s  %s bytes\n" "$(basename "$f")" "$(numfmt --to=iec-i --suffix=B "$size" 2>/dev/null || echo "${size}")"
done
