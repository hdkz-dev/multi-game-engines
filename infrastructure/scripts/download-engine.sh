#!/bin/bash
# エンジンバイナリダウンロードスクリプト
# 
# 使用例:
#   ./download-engine.sh stockfish 16.1
#   ./download-engine.sh stockfish 16.1 ./my-engines
#
# 環境変数:
#   CDN_BASE_URL: カスタム CDN URL (デフォルト: https://engines.multi-game-engines.dev)

set -euo pipefail

# 引数
ENGINE=${1:-}
VERSION=${2:-latest}
OUTPUT_DIR=${3:-./engines}

# デフォルト CDN URL
CDN_BASE_URL=${CDN_BASE_URL:-"https://engines.multi-game-engines.dev"}

# 色付き出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ヘルパー関数
info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# 使用方法
usage() {
    cat << EOF
Usage: $(basename "$0") <engine> [version] [output_dir]

Arguments:
    engine      Engine name (e.g., stockfish, yaneuraou)
    version     Engine version (default: latest)
    output_dir  Output directory (default: ./engines)

Examples:
    $(basename "$0") stockfish 16.1
    $(basename "$0") stockfish latest ./my-engines

Available engines:
    - stockfish
    - yaneuraou
    - fairy-stockfish
EOF
    exit 1
}

# 引数チェック
if [[ -z "$ENGINE" ]]; then
    usage
fi

# 出力ディレクトリ作成
mkdir -p "$OUTPUT_DIR/$ENGINE/$VERSION"

info "Downloading $ENGINE v$VERSION..."
info "CDN: $CDN_BASE_URL"
info "Output: $OUTPUT_DIR/$ENGINE/$VERSION"

# manifest.json を取得
MANIFEST_URL="$CDN_BASE_URL/v1/$ENGINE/$VERSION/manifest.json"
info "Fetching manifest from $MANIFEST_URL..."

MANIFEST=$(curl -sf "$MANIFEST_URL") || error "Failed to fetch manifest"

# ファイル一覧を取得してダウンロード
echo "$MANIFEST" | jq -r '.files | to_entries[] | "\(.key) \(.value.url) \(.value.sri) \(.value.size)"' | while read -r key url sri size; do
    FILE_URL="$CDN_BASE_URL/v1/$ENGINE/$VERSION/$url"
    OUTPUT_FILE="$OUTPUT_DIR/$ENGINE/$VERSION/$url"
    
    info "Downloading $key ($size bytes)..."
    
    # ダウンロード
    curl -sf -o "$OUTPUT_FILE" "$FILE_URL" || error "Failed to download $key"
    
    # SRI 検証
    if [[ -n "$sri" && "$sri" != "null" ]]; then
        info "Verifying SRI for $key..."
        
        # ハッシュアルゴリズムを抽出 (sha256, sha384, sha512)
        ALGO=$(echo "$sri" | cut -d'-' -f1)
        EXPECTED_HASH=$(echo "$sri" | cut -d'-' -f2)
        
        # ファイルハッシュを計算
        case "$ALGO" in
            sha256) ACTUAL_HASH=$(shasum -a 256 "$OUTPUT_FILE" | cut -d' ' -f1 | xxd -r -p | base64) ;;
            sha384) ACTUAL_HASH=$(shasum -a 384 "$OUTPUT_FILE" | cut -d' ' -f1 | xxd -r -p | base64) ;;
            sha512) ACTUAL_HASH=$(shasum -a 512 "$OUTPUT_FILE" | cut -d' ' -f1 | xxd -r -p | base64) ;;
            *) warn "Unknown hash algorithm: $ALGO, skipping verification" ;;
        esac
        
        if [[ "$ACTUAL_HASH" == "$EXPECTED_HASH" ]]; then
            success "SRI verification passed for $key"
        else
            error "SRI verification failed for $key\nExpected: $EXPECTED_HASH\nActual: $ACTUAL_HASH"
        fi
    else
        warn "No SRI hash for $key, skipping verification"
    fi
done

# manifest.json もコピー
echo "$MANIFEST" > "$OUTPUT_DIR/$ENGINE/$VERSION/manifest.json"

success "Downloaded $ENGINE v$VERSION to $OUTPUT_DIR/$ENGINE/$VERSION"

# ファイル一覧表示
info "Downloaded files:"
ls -la "$OUTPUT_DIR/$ENGINE/$VERSION"
