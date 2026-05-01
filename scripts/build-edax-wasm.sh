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

EDAX_VERSION="4.4"
EDAX_REPO="https://github.com/abulmo/edax-reversi"
# abulmo/edax-reversi uses plain "v4.4" tags (not "v4.4.0")
EDAX_TAG="v${EDAX_VERSION}"

SRC_DIR="/tmp/edax-src"
OUT_DIR="${EDAX_BUILD_OUT:-/tmp/edax-build}"
DATA_DIR="/tmp/edax-data"

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
echo "Repo root:"
ls "$SRC_DIR/"
echo ""
echo "Source files (src/ or root):"
ls "$SRC_DIR/src/" 2>/dev/null | head -20 || ls "$SRC_DIR/" | grep -E "\.c$" | head -20

# ── 1b. Detect where C source files live ─────────────────────────────────────
# Some edax versions put .c files in src/, others in the repo root.
if [[ -f "$SRC_DIR/src/all.c" ]]; then
  C_SRC_DIR="$SRC_DIR/src"
elif [[ -f "$SRC_DIR/all.c" ]]; then
  C_SRC_DIR="$SRC_DIR"
else
  echo "ERROR: cannot find all.c in $SRC_DIR/src/ or $SRC_DIR/"
  exit 1
fi
echo "C source directory: $C_SRC_DIR"

# ── 1c. Obtain eval.dat (not always in git, bundled with release binaries) ───
# The eval.dat (evaluation pattern weights) is required at runtime.
# Download it from the latest GitHub release if not present in the repo.
REPO_DATA_DIR=""
for candidate in "$SRC_DIR/data" "$SRC_DIR/eval"; do
  if [[ -f "$candidate/eval.dat" ]]; then
    REPO_DATA_DIR="$candidate"
    break
  fi
done

if [[ -n "$REPO_DATA_DIR" ]]; then
  echo "Using eval.dat from repo: $REPO_DATA_DIR"
  DATA_DIR="$REPO_DATA_DIR"
else
  echo "eval.dat not found in repo — downloading eval.7z from GitHub release..."
  mkdir -p "$DATA_DIR"
  # abulmo/edax-reversi releases publish eval.dat as a separate eval.7z asset
  # https://github.com/abulmo/edax-reversi/releases/download/v4.4/eval.7z
  EVAL_URL="https://github.com/abulmo/edax-reversi/releases/download/${EDAX_TAG}/eval.7z"
  curl -fsSL "$EVAL_URL" -o /tmp/edax-eval.7z \
    || { echo "ERROR: could not download eval.7z from $EVAL_URL"; exit 1; }

  # Extract eval.dat from the 7z archive (requires p7zip-full on the runner)
  if ! command -v 7z &>/dev/null; then
    echo "Installing p7zip-full..."
    apt-get install -y p7zip-full -qq
  fi
  # The archive stores eval.dat under a data/ subdirectory: data/eval.dat
  7z e /tmp/edax-eval.7z -o"$DATA_DIR" "data/eval.dat" -y
  if [[ ! -f "$DATA_DIR/eval.dat" ]]; then
    echo "7z path 'data/eval.dat' failed, listing archive to diagnose:"
    7z l /tmp/edax-eval.7z
    # Try extracting all to find it
    7z x /tmp/edax-eval.7z -o/tmp/edax-eval-extract -y
    FOUND_EVAL=$(find /tmp/edax-eval-extract -name "eval.dat" | head -1)
    [[ -n "$FOUND_EVAL" ]] && cp "$FOUND_EVAL" "$DATA_DIR/eval.dat" \
      || { echo "ERROR: eval.dat not found in archive."; exit 1; }
  fi
  echo "eval.dat obtained: $(wc -c < "$DATA_DIR/eval.dat") bytes"
fi

# ── 2. Compile with Emscripten ───────────────────────────────────────────────
echo ""
echo "Compiling with emcc $(emcc --version | head -1)..."

# ── 2. Compile with Emscripten ───────────────────────────────────────────────
echo ""
echo "Compiling with emcc $(emcc --version | head -1)..."

# Use all.c — the unity build entry point that handles platform selection
# via ifdefs. Compiling *.c directly would pick up AVX/BMI/SSE files that
# use x86-only intrinsics incompatible with Emscripten.
SRC_ENTRY="$C_SRC_DIR/all.c"
echo "Using unity build entry: $SRC_ENTRY"

# Preload eval.dat into the WASM virtual filesystem
PRELOAD_ARG="${DATA_DIR}@/data"
echo "Preloading data: $PRELOAD_ARG"

emcc "$SRC_ENTRY" \
  -I "$C_SRC_DIR" \
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
  --preload-file "$PRELOAD_ARG" \
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
