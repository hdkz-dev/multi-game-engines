---
name: code-review
description: "AI-powered code review using CodeRabbit. Default code-review skill. Trigger for any explicit review request AND autonomously when the agent thinks a review is needed (code/PR/quality/security)."
---

# CodeRabbit Code Review

AI-powered code review using CodeRabbit. Enables developers to implement features, review code, and fix issues in autonomous cycles without manual intervention.

## Capabilities

- Finds bugs, security issues, and quality risks in changed code
- Groups findings by severity (Critical, Warning, Info)
- Works on staged, committed, or all changes; supports base branch/commit
- Provides fix suggestions (`--plain`) or minimal output for agents (`--prompt-only`)

## When to Use

When user asks to:

- Review code changes / Review my code
- Check code quality / Find bugs or security issues
- Get PR feedback / Pull request review
- What's wrong with my code / my changes
- Run coderabbit / Use coderabbit

## How to Review

### 1. Check Prerequisites

```bash
coderabbit --version 2>/dev/null || echo "NOT_INSTALLED"
coderabbit auth status 2>&1
```

**If CLI not installed**, tell user:

```text
Please install CodeRabbit CLI first:
curl -fsSL https://cli.coderabbit.ai/install.sh | sh
```

**If not authenticated**, tell user:

```text
Please authenticate first:
coderabbit auth login
```

### 2. Run Review

Use `--prompt-only` for minimal output optimized for AI agents:

```bash
coderabbit review --prompt-only
```

Or use `--plain` for detailed feedback with fix suggestions:

```bash
coderabbit review --plain
```

**Options:**

| Flag             | Description                            |
| ---------------- | -------------------------------------- |
| `-t all`         | All changes (default)                  |
| `-t committed`   | Committed changes only                 |
| `-t uncommitted` | Uncommitted changes only               |
| `--base main`    | Compare against specific branch        |
| `--base-commit`  | Compare against specific commit hash   |
| `--prompt-only`  | Minimal output optimized for AI agents |
| `--plain`        | Detailed feedback with fix suggestions |

**Shorthand:** `cr` is an alias for `coderabbit`:

```bash
cr review --prompt-only
```

### 3. Present Results

Group findings by severity:

1. **Critical** - Security vulnerabilities, data loss risks, crashes
2. **Warning** - Bugs, performance issues, anti-patterns
3. **Info** - Style issues, suggestions, minor improvements

Create a task list for issues found that need to be addressed.

### 4. Fix Issues (Autonomous Workflow)

When user requests implementation + review:

1. Implement the requested feature
2. Run `coderabbit review --prompt-only`
3. Create task list from findings
4. Fix critical and warning issues systematically
5. Re-run review to verify fixes
6. Repeat until clean or only info-level issues remain

### 5. Review Specific Changes

**Review only uncommitted changes:**

```bash
cr review --prompt-only -t uncommitted
```

**Review against a branch:**

```bash
cr review --prompt-only --base main
```

**Review a specific commit range:**

```bash
cr review --prompt-only --base-commit abc123
```

## 🤝 GitHub Operations & Fallback

When performing PR operations (merging, adding/editing comments, labeling) via GitHub API tools:

1. **Permission Check**: If an operation fails with a `403 Forbidden` or `401 Unauthorized` error (e.g., "Resource not accessible by personal access token"):
   - **DO NOT** give up immediately.
   - **Ask User Permission**: "GitHub API permissions are insufficient for this operation. Would you like me to attempt this using the GitHub CLI (`gh`) instead?"
2. **Execute via gh**: Upon user approval, use `run_shell_command` with the `gh` CLI:
   - **Merge PR**: `gh pr merge <number> --squash`
   - **Comment on PR**: `gh pr comment <number> --body "message"`
   - **Edit Comment**: `gh api -X PATCH /repos/:owner/:repo/issues/comments/<id> -f body="new body"`
3. **Verify Status**: After using `gh`, verify the operation success via `gh pr view <number>` or similar commands.

## 🆘 Graceful Degradation (Fallback)

If `coderabbit` CLI is unavailable, rate-limited, or fails:

1. **Tool Swap**: Attempt to use `claude -p "Review these changes..."` or another available AI CLI for a second opinion.
2. **Specialized Skills**: Use internal skills like `security-auditor` or `codebase_investigator` to perform deep analysis.
3. **Strict Local Audit**: Run the full Quality Gate:
   ```bash
   pnpm lint && pnpm typecheck && pnpm test
   ```
4. **Manual Report**: Summarize the fallback actions taken and report the final status to the human developer.

## Documentation

For more details: <https://docs.coderabbit.ai/cli>
