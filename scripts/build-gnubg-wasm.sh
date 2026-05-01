#!/usr/bin/env bash
# =============================================================================
# build-gnubg-wasm.sh — Compile GNU Backgammon to WebAssembly
#
# Source:  hwatheod/gnubg-web (based on gnubg v1.05.000, GPL-3.0)
#          https://github.com/hwatheod/gnubg-web
# Output:  gnubg.module.js + gnubg.module.wasm + gnubg.module.data
#          gnubg.js  (committed Worker wrapper)
#
# Architecture:
#   Unlike Edax (ASYNCIFY + stdin/stdout), gnubg-web uses direct C function
#   exports. The Worker calls Module._run_command(buf) synchronously; gnubg's
#   output is captured via Module.print callback. No ASYNCIFY required.
#
# Usage:
#   # In CI (Emscripten SDK pre-installed via mymindstorm/setup-emscripten):
#   bash scripts/build-gnubg-wasm.sh
#
#   # Locally with Docker:
#   docker run --rm -v $(pwd):/src -w /src \
#     emscripten/emsdk:4.0.10 bash scripts/build-gnubg-wasm.sh
#
# Requirements: emcc (Emscripten ≥ 3.1.57), git, sed
# =============================================================================
set -euo pipefail

GNUBG_WEB_REPO="https://github.com/hwatheod/gnubg-web"
SRC_DIR="/tmp/gnubg-src"
OUT_DIR="${GNUBG_BUILD_OUT:-/tmp/gnubg-build}"

echo "=== GNU Backgammon WASM Build ==="
echo "  Source : ${GNUBG_WEB_REPO}"
echo "  Output : ${OUT_DIR}"
echo ""

mkdir -p "$OUT_DIR"

# ── 1. Clone hwatheod/gnubg-web ──────────────────────────────────────────────
# This repo bundles: patched gnubg 1.05 + glib 2.62.0 pre-configured for WASM
if [[ ! -d "$SRC_DIR/.git" ]]; then
  echo "Cloning hwatheod/gnubg-web..."
  git clone --depth=1 "$GNUBG_WEB_REPO" "$SRC_DIR"
else
  echo "Using cached source at ${SRC_DIR}"
fi

echo ""
echo "Repo root:"
ls "$SRC_DIR/"

# ── 2. Patch stub: getpwuid throws instead of returning NULL ─────────────────
# hwatheod's build requires patching the output JS post-build (see issue #1).
# We do this after compilation (step 5).

# ── 3. Collect all .c source files (same as hwatheod/build.sh) ───────────────
echo ""
echo "Collecting source files..."

# gnubg core + lib (hwatheod patches: -DWEB=1 strips GTK/sound/external deps)
GNUBG_C=$(find "$SRC_DIR/gnubg" -maxdepth 1 -name "*.c" | sort | tr '\n' ' ')
GNUBG_LIB_C=$(find "$SRC_DIR/gnubg/lib" -maxdepth 1 -name "*.c" 2>/dev/null | sort | tr '\n' ' ' || true)

# glib 2.62.0 (pre-configured for Emscripten, checked-in config.h)
GLIB_C=$(find "$SRC_DIR/glib/glib-2.62.0/glib" -maxdepth 1 -name "*.c" | sort | tr '\n' ' ')
GLIB_CHARSET_C=$(find "$SRC_DIR/glib/glib-2.62.0/glib/libcharset" -maxdepth 1 -name "*.c" | sort | tr '\n' ' ')

echo "gnubg/*.c: $(echo $GNUBG_C | wc -w) files"
echo "gnubg/lib/*.c: $(echo $GNUBG_LIB_C | wc -w) files"
echo "glib/*.c: $(echo $GLIB_C | wc -w) files"
echo "glib/libcharset/*.c: $(echo $GLIB_CHARSET_C | wc -w) files"

# ── 4. Compile with Emscripten ───────────────────────────────────────────────
echo ""
echo "Compiling with emcc $(emcc --version | head -1)..."

PACKAGED_FILES_DIR="$SRC_DIR/packaged_files"
echo "Preloading data from: $PACKAGED_FILES_DIR"
ls "$PACKAGED_FILES_DIR/"

# Key differences from hwatheod's build:
#   -sMODULARIZE=1       — Wrap in a factory function (createGnubgModule)
#   -sEXPORT_NAME        — Factory function name
#   -sEXPORTED_FUNCTIONS — Export run_command + memory functions for Worker
#   -sENVIRONMENT=worker — No DOM dependencies
#   No ASYNCIFY needed   — run_command() is synchronous
# shellcheck disable=SC2086
emcc \
  $GNUBG_C \
  $GNUBG_LIB_C \
  $GLIB_C \
  $GLIB_CHARSET_C \
  -O2 \
  -DGLIB_COMPILATION=1 \
  -DWEB=1 \
  -I "$SRC_DIR/glib/glib-2.62.0/glib/" \
  -I "$SRC_DIR/glib/glib-2.62.0/" \
  -I "$SRC_DIR/glib/glib-2.62.0/_build/glib" \
  -I "$SRC_DIR/gnubg/lib/" \
  -I "$SRC_DIR/gnubg/" \
  -I "$SRC_DIR/glib/glib-2.62.0/_build/" \
  -I "$SRC_DIR/glib/glib-2.62.0/glib/libcharset/" \
  -sWASM=1 \
  -sMODULARIZE=1 \
  -sEXPORT_NAME=createGnubgModule \
  -sEXPORTED_FUNCTIONS='["_run_command", "_malloc", "_free"]' \
  -sEXPORTED_RUNTIME_METHODS='["getValue", "setValue", "allocateUTF8", "UTF8ToString"]' \
  -sALLOW_MEMORY_GROWTH=1 \
  -sINITIAL_MEMORY=67108864 \
  -sENVIRONMENT=worker \
  -sEXIT_RUNTIME=0 \
  --preload-file "$PACKAGED_FILES_DIR@/" \
  -o "$OUT_DIR/gnubg.module.js" \
  2>&1

echo ""
echo "Build output (before patch):"
ls -lh "$OUT_DIR/"

# ── 5. Post-build patch: getpwuid stub ───────────────────────────────────────
# Emscripten's getpwuid stub throws "getpwuid: TODO" instead of returning NULL.
# gnubg calls getpwuid() during init; the throw aborts startup.
# Patch: replace the throw with a null return (hwatheod issue #1 / #13219).
JS_OUT="$OUT_DIR/gnubg.module.js"
if grep -q 'throw"getpwuid: TODO"' "$JS_OUT" 2>/dev/null; then
  echo "Applying getpwuid patch..."
  sed -i 's/throw"getpwuid: TODO"/return 0/g' "$JS_OUT"
  echo "Patch applied."
elif grep -q 'getpwuid' "$JS_OUT" 2>/dev/null; then
  echo "WARNING: getpwuid found in output but throw pattern not matched."
  echo "  Lines with getpwuid:"
  grep -n 'getpwuid' "$JS_OUT" | head -5
else
  echo "No getpwuid stub found — Emscripten may have fixed this already."
fi

# ── 6. Copy the committed Worker wrapper alongside the module ─────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cp "$SCRIPT_DIR/gnubg-worker.js" "$OUT_DIR/gnubg.js"
echo "Worker wrapper copied: gnubg.js"

# ── 7. Emit size summary ──────────────────────────────────────────────────────
echo ""
echo "=== Output summary ==="
for f in "$OUT_DIR"/*; do
  size=$(wc -c < "$f")
  printf "  %-45s  %s\n" "$(basename "$f")" "$(numfmt --to=iec-i --suffix=B "$size" 2>/dev/null || echo "${size} bytes")"
done
