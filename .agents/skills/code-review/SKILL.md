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
# Verify inside a Git repository first
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "NOT_A_GIT_REPO"; exit 1; }

coderabbit --version 2>/dev/null || echo "NOT_INSTALLED"
coderabbit auth status 2>&1
```

**If not in a Git repo**, tell user:
"CodeRabbit CLI must be run from within an initialized Git repository. Please run this command from inside your project directory."

**If CLI not installed**, tell user:
"Please install CodeRabbit CLI first: curl -fsSL https://cli.coderabbit.ai/install.sh | sh"

**If not authenticated**, tell user:
"Please authenticate first: coderabbit auth login"

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

| Flag                | Description                             |
| ------------------- | --------------------------------------- |
| --type all          | All changes (default)                   |
| --type committed    | Committed changes only                  |
| --type uncommitted  | Uncommitted (staged + unstaged) changes |
| --base <branch>     | Compare against specific branch         |
| --base-commit <sha> | Compare against specific commit hash    |
| --prompt-only       | Minimal output optimized for AI agents  |
| --plain             | Detailed feedback with fix suggestions  |

**Shorthand:** `cr` is an alias for `coderabbit` (manually configured via `alias cr=coderabbit`):

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
6. **Limit:** Repeat the cycle at most **2 times**. If minor issues remain after the second run, complete the task and notify the user.

### 5. Review Specific Changes

**Review uncommitted changes (staged and unstaged):**

```bash
cr review --prompt-only --type uncommitted
```

**Review against a branch:**

```bash
cr review --prompt-only --base main
```

**Review a specific commit range:**

```bash
# Note: Use --type committed to focus on commit history
cr review --prompt-only --type committed --base-commit abc123
```

## Documentation

For more details: <https://docs.coderabbit.ai/cli>
