#!/bin/bash

# pre-commit-check.sh
# Checks for accidental token leaks in staged files.

SENSITIVE_PATTERNS=(
    "GITHUB_PERSONAL_ACCESS_TOKEN"
    "VERCEL_TOKEN"
    "BRAVE_API_KEY"
    "GOOGLE_API_KEY"
    "ghp_[a-zA-Z0-9]{36}" # GitHub PAT format
)

EXIT_CODE=0

echo "🔍 Checking for sensitive tokens in staged files..."

# List staged files (excluding deletions)
STAGED_FILES=$(git diff --cached --name-only --diff-filter=d)

for FILE in $STAGED_FILES; do
    # Skip binary files
    if [[ $(file --mime "$FILE") == *"binary"* ]]; then
        continue
    fi

    # Skip the scripts themselves to avoid false positives on variable names
    if [[ "$FILE" == scripts/* ]]; then
        continue
    fi

    for PATTERN in "${SENSITIVE_PATTERNS[@]}"; do
        # Search for pattern in staged changes of the file
        MATCHES=$(git diff --cached "$FILE" | grep -E "$PATTERN")
        
        if [ ! -z "$MATCHES" ]; then
            echo "❌ ERROR: Potential secret leak detected in '$FILE' (Pattern: $PATTERN)"
            echo "Matches found:"
            echo "$MATCHES"
            EXIT_CODE=1
        fi
    done
done

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ No sensitive tokens detected in staged files."
    
    # Auto-generate masked example config
    if [[ "$STAGED_FILES" == *"mcp_config.json"* ]]; then
        echo "💡 mcp_config.json changed. Updating example config..."
        npm run mcp:mask
        git add mcp_config.example.json
    fi
else
    echo "⚠️ Commit aborted. Please remove the secrets and try again."
fi

exit $EXIT_CODE
