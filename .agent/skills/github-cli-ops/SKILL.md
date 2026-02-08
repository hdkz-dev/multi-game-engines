---
name: github-cli-ops
description: Best practices for safe and reliable GitHub CLI (`gh`) operations. Focuses on avoiding shell escaping issues and parsing errors.
---

# GitHub CLI Operations Strategy

This skill defines the mandatory workflow for using the GitHub CLI (`gh`) to ensure reliability and avoid common pitfalls like shell escaping issues and complex output parsing.

## 🚨 Core Rules: The "Safe-Path" Strategy

### 1. File-Based Input (Anti-Escaping)

**NEVER** pass complex strings (descriptions, PR bodies, large lists) directly as command-line arguments. Shell escaping is fragile and prone to failure.

- ❌ **Don't**: `gh pr create --body "Line 1\nLine 2 with 'quotes' and $symbols"`
- ✅ **Do**:
  1. Write raw content to a temporary file.
  2. Pass the file path to the command.

  ```bash
  # Create content safely
  cat <<'EOF' > dev_temp/pr_body.md
  This utilizes "safe" content:
  - No escaping needed
  - Multi-line works perfectly
  EOF

  # Use the file
  gh pr create --title "My PR" --body-file dev_temp/pr_body.md

  # Cleanup
  rm dev_temp/pr_body.md
  ```

### 2. Structured Output (Anti-Parsing)

**NEVER** try to parse the default human-readable text output of `gh` commands with regex. It is unstable and changes between versions.

- ❌ **Don't**: `gh pr list | grep "My Branch" | awk '{print $1}'`
- ✅ **Do**: Use `--json` and `jq` (or internal parsing) to extract exact data.

  ```bash
  gh pr list --json number,title,headRefName --state open
  ```

  - This returns reliable JSON that can be strictly typed and parsed.

### 3. Verification First

Always verify the state before performing mutation actions.

- Check auth status: `gh auth status`
- Check current branch matches expected PR head.

## Common Workflows

### Creating a Pull Request (Reliable Method)

1. **Draft the Content**: Create the PR title and body.
2. **Write to File**: Save the body to `dev_temp/pr_[timestamp].md`.
3. **Execute**:

   ```bash
   gh pr create --title "Title" --body-file dev_temp/pr_[timestamp].md --base main --head [current-branch]
   ```

4. **Validate**: Check the output URL to confirm success.

### Listing/Filtering PRs

Use strict filtering provided by the CLI, not shell pipes.

```bash
# Find a PR for the current branch
gh pr list --head $(git branch --show-current) --json number,url,state --limit 1
```

### Reviewing PRs

1. **Fetch details as context**:

   ```bash
   gh pr view [number] --json title,body,comments,reviews
   ```

2. **Perform actions (merge/close/approve)**:
   - Always use the PR number, not branch name, for these commands to be unambiguous.

## General Shell Safety (Beyond GitHub)

Apply the "File-Based Input" rule to ANY command that takes complex text input (e.g., `git commit -F`, `curl -d @file`).
If a command argument contains newlines, quotes, or special characters (`$`, `` ` ``, `!`), **always** prefer file-based input if the tool supports it.
