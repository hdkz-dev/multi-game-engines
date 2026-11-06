#!/bin/bash

# pre-commit-check.sh
# 2026 Ultimate Pre-commit Pipeline

EXIT_CODE=0

echo "🚀 Starting Pre-commit Quality Gate..."

# 1. Check for sensitive tokens (Security)
echo "🔍 Checking for sensitive tokens..."
SENSITIVE_PATTERNS=(
    "GITHUB_PERSONAL_ACCESS_TOKEN"
    "VERCEL_TOKEN"
    "BRAVE_API_KEY"
    "GOOGLE_API_KEY"
    "ghp_[a-zA-Z0-9]{36}"
)

STAGED_FILES=$(git diff --cached --name-only --diff-filter=d)

for FILE in $STAGED_FILES; do
    if [[ $(file --mime "$FILE") == *"binary"* ]]; then continue; fi
    if [[ "$FILE" == scripts/* ]]; then continue; fi

    for PATTERN in "${SENSITIVE_PATTERNS[@]}"; do
        MATCHES=$(git diff --cached "$FILE" | grep -E "$PATTERN")
        if [ ! -z "$MATCHES" ]; then
            echo "❌ ERROR: Potential secret leak detected in '$FILE' (Pattern: $PATTERN)"
            EXIT_CODE=1
        fi
    done
done

if [ $EXIT_CODE -ne 0 ]; then
    echo "⚠️ Secret check failed. Commit aborted."
    exit $EXIT_CODE
fi

# 2. Automated Formatting and Linting (Style)
echo "🧹 Running lint-staged (Format & Lint)..."
pnpm exec lint-staged
if [ $? -ne 0 ]; then EXIT_CODE=1; fi

if [ $EXIT_CODE -ne 0 ]; then
    echo "⚠️ Lint/Format failed. Commit aborted."
    exit $EXIT_CODE
fi

# Formatting can change files after the interactive lint run. Check the entire
# project here, including tooling .mjs files that lint-staged does not lint.
echo "🔍 Running full lint after formatting..."
pnpm lint
if [ $? -ne 0 ]; then
    echo "⚠️ Lint failed after formatting. Commit aborted."
    exit 1
fi

# 3. Type Consistency Check (Reliability)
# 全パッケージの整合性を確認するため、変更ファイルだけでなく全体をチェックします
echo "⌨️  Running typecheck..."
pnpm typecheck
if [ $? -ne 0 ]; then EXIT_CODE=1; fi

if [ $EXIT_CODE -ne 0 ]; then
    echo "⚠️ Typecheck failed. Commit aborted."
    exit $EXIT_CODE
fi

# 4. Build Verification (Correctness)
echo "🏗️  Running build verification..."
pnpm build
if [ $? -ne 0 ]; then EXIT_CODE=1; fi

if [ $EXIT_CODE -ne 0 ]; then
    echo "⚠️ Build failed. Commit aborted."
    exit $EXIT_CODE
fi

# 5. Unit Tests (Functionality)
echo "🧪 Running unit tests..."
pnpm test
if [ $? -ne 0 ]; then EXIT_CODE=1; fi

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ All checks passed! Proceeding with commit."
    
    # Auto-generate masked example config if needed
    if [[ "$STAGED_FILES" == *"mcp_config.json"* ]]; then
        echo "💡 Updating mcp_config.example.json..."
        pnpm mcp:mask
        git add mcp_config.example.json
    fi
else
    echo "⚠️ Quality gate failed. Please fix the issues and try again."
fi

exit $EXIT_CODE
