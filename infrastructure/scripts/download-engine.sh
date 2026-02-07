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
readonly ENGINE="${1:-}"
readonly VERSION="${2:-latest}"
readonly OUTPUT_DIR="${3:-./engines}"

# デフォルト CDN URL
CDN_BASE_URL=${CDN_BASE_URL:-"https://engines.multi-game-engines.dev"}

# 色付き出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ヘルパー関数
# ヘルパー関数
info() {
    printf "${BLUE}[INFO]${NC} %s\n" "$1"
}

success() {
    printf "${GREEN}[SUCCESS]${NC} %s\n" "$1"
}

warn() {
    printf "${YELLOW}[WARN]${NC} %s\n" "$1"
}

error() {
    printf "${RED}[ERROR]${NC} %s\n" "$1"
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

# パス・トラバーサルガード
if [[ "$ENGINE" =~ \.\. ]] || [[ "$VERSION" =~ \.\. ]]; then
    error "Potential path traversal detected in arguments"
fi

# 出力ディレクトリ作成
mkdir -p "$OUTPUT_DIR/$ENGINE/$VERSION"

info "Target: $ENGINE"
info "CDN: $CDN_BASE_URL"

# "latest" の場合、ルートマニフェストから最新バージョンを解決
if [[ "$VERSION" == "latest" ]]; then
    INDEX_URL="$CDN_BASE_URL/manifest.json"
    info "Resolving latest version from $INDEX_URL..."
    
    # マニフェスト取得 (タイムアウト: 接続10秒, 全体10秒)
    INDEX_JSON=$(curl -sf --connect-timeout 10 -m 10 "$INDEX_URL") || error "Failed to fetch root manifest to resolve 'latest'. Please specify a distinct version."
    
    # jq で最新バージョンを抽出
    RESOLVED_VERSION=$(echo "$INDEX_JSON" | jq -r ".engines[\"$ENGINE\"].latestVersion")
    
    if [[ "$RESOLVED_VERSION" == "null" || -z "$RESOLVED_VERSION" ]]; then
        error "Engine '$ENGINE' not found in root manifest or no latest version defined."
    fi
    
    info "Resolved latest version: $RESOLVED_VERSION"
    VERSION="$RESOLVED_VERSION"
fi

info "Downloading $ENGINE v$VERSION..."
mkdir -p "$OUTPUT_DIR/$ENGINE/$VERSION"
info "Output: $OUTPUT_DIR/$ENGINE/$VERSION"

# manifest.json を取得
MANIFEST_URL="$CDN_BASE_URL/v1/$ENGINE/$VERSION/manifest.json"
info "Fetching manifest from $MANIFEST_URL..."

MANIFEST=$(curl -sf --connect-timeout 10 -m 10 "$MANIFEST_URL") || error "Failed to fetch manifest"

# ファイル一覧を取得してダウンロード
# パイプではなくプロセス置換を使用することで、ループ内での exit が親プロセスに伝わるようにする
while read -r key url sri size; do
    # マニフェスト内の url に対するパス・トラバーサルガード
    if [[ "$url" =~ \.\. ]] || [[ "$url" == /* ]]; then
        error "Invalid file path in manifest: $url"
    fi

    FILE_URL="$CDN_BASE_URL/v1/$ENGINE/$VERSION/$url"
    OUTPUT_FILE="$OUTPUT_DIR/$ENGINE/$VERSION/$url"
    
    # 必要に応じてサブディレクトリを作成
    mkdir -p "$(dirname "$OUTPUT_FILE")"

    info "Downloading $key ($size bytes)..."
    
    # ダウンロード (タイムアウト: 接続10秒, データ転送300秒)
    curl -sfL --connect-timeout 10 -m 300 -o "$OUTPUT_FILE" "$FILE_URL" || error "Failed to download $key"
    
    # SRI 検証
    if [[ -n "$sri" && "$sri" != "null" ]]; then
        info "Verifying SRI for $key..."
        
        # ハッシュアルゴリズムを抽出 (sha256, sha384, sha512)
        ALGO=$(echo "$sri" | cut -d'-' -f1)
        EXPECTED_HASH=$(echo "$sri" | cut -d'-' -f2)
        
        # ファイルハッシュを計算 (Base64形式)
        ACTUAL_HASH=""
        case "$ALGO" in
            sha256) ACTUAL_HASH=$(openssl dgst -sha256 -binary "$OUTPUT_FILE" | openssl enc -base64 | tr -d '\n\r ') ;;
            sha384) ACTUAL_HASH=$(openssl dgst -sha384 -binary "$OUTPUT_FILE" | openssl enc -base64 | tr -d '\n\r ') ;;
            sha512) ACTUAL_HASH=$(openssl dgst -sha512 -binary "$OUTPUT_FILE" | openssl enc -base64 | tr -d '\n\r ') ;;
            *) warn "Unknown hash algorithm: $ALGO, skipping verification" ;;
        esac
        
        if [[ -n "$ACTUAL_HASH" ]]; then
            if [[ "$ACTUAL_HASH" == "$EXPECTED_HASH" ]]; then
                success "SRI verification passed for $key"
            else
                error "SRI verification failed for $key\n  Expected: $EXPECTED_HASH\n  Actual:   $ACTUAL_HASH"
            fi
        fi
    else
        warn "No SRI hash for $key, skipping verification"
    fi
done < <(echo "$MANIFEST" | jq -r '.files | to_entries[] | "\(.key) \(.value.url) \(.value.sri) \(.value.size)"')

# manifest.json もコピー
echo "$MANIFEST" > "$OUTPUT_DIR/$ENGINE/$VERSION/manifest.json"

success "Downloaded $ENGINE v$VERSION to $OUTPUT_DIR/$ENGINE/$VERSION"

# ファイル一覧表示
info "Downloaded files:"
ls -la "$OUTPUT_DIR/$ENGINE/$VERSION"
