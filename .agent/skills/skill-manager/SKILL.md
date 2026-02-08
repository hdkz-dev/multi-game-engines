---
name: skill-manager
description: Manage and discover AI agent skills using the `ai-agent-skills` CLI. Use this skill to search for, list, install, and update skills that extend the agent's capabilities.
---

# Skill Manager

This skill allows the agent to self-manage its capabilities by installing new skills from the community registry using `npx ai-agent-skills`.

## Capabilities

- **Search**: Find new skills by keyword
- **Browse**: List available skills by category
- **Install**: Add new skills to the agent's toolkit
- **Update**: Keep existing skills up-to-date
- **List**: Show currently installed skills

## Usage Instructions

### 1. Searching for Skills

When the user asks for a capability you don't have, search for it:

```bash
npx -y ai-agent-skills search [keyword]
```

Example: `npx -y ai-agent-skills search testing`

### 2. Browsing Categories

To explore what's available in a specific domain:

```bash
npx -y ai-agent-skills list --category [category]
```

Categories: `development`, `document`, `creative`, `business`, `productivity`

### 3. Installing Skills

To install a discovered skill. Always use the `-y` flag for npx.
**IMPORTANT**: This tool installs to `.agent/skills` by default in the current project.

```bash
npx -y ai-agent-skills install [skill-name]
```

Example: `npx -y ai-agent-skills install pdf`

### 4. Updating Skills

To update all installed skills:

```bash
npx -y ai-agent-skills update --all
```

## Best Practices

- **Check First**: Before implementing a complex feature from scratch (e.g., PDF generation, specialized testing), search if a skill exists.
- **Verify Installation**: After installing, list the `.agent/skills` directory to confirm the new skill is present.
- **Explain to User**: When installing a new skill, explain _what_ it is and _why_ it helps with their request.
