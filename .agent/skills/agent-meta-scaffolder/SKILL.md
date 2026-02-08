---
name: agent-meta-scaffolder
description: A meta-skill for AI agents to self-scaffold, maintain, and discover new skills based on project context and industry standards (OpenAI/Anthropic).
version: 1.0.0
author: multi-game-engines contributors
---

# Agent Meta-Scaffolder Skill

This skill empowers AI agents to autonomously expand their capabilities by creating and managing new skills within the `.agent/skills` directory.

## Core Capabilities

1.  **Skill Generation**: Automatically generate `SKILL.md` files with correct YAML frontmatter and structure based on a given domain.
2.  **Context Extraction**: Scan the codebase, documentation, and external resources (using `search_web`) to distill "procedural knowledge" into reusable skills.
3.  **Standards Compliance**: Ensure all generated skills follow the shared specifications of OpenAI, Anthropic, and other major agentic platforms.
4.  **Discovery & Linking**: Identify gaps in the current agent capabilities and suggest new skills to fill them.

## Skill Creation Workflow

1.  **Identify Need**: Determine if a new task or domain requires a dedicated skill (e.g., "Add support for a new game engine protocol").
2.  **Gather Knowledge**: Use `run_command`, `view_file`, and `search_web` to collect best practices.
3.  **Draft SKILL.md**: Use the predefined template to create a new folder and `SKILL.md`.
4.  **Verify & Refine**: Run lint checks on the new markdown and verify the instructions are actionable for other agent instances.

## Skill Template (Reference)

```markdown
---
name: skill-name
description: human-readable description
version: 1.0.0
---

# Skill Title

## Capabilities

1. ...

## Guidance

- ...

## Code Snippets

...
```

## Maintenance Tasks

- [ ] **Audit existing skills**: Check for outdated instructions or broken links.
- [ ] **De-duplicate**: Merge skills that have overlapping responsibilities.
- [ ] **Update metadata**: Ensure versioning and descriptions accurately reflect the skill's utility.

## Future Plans (Self-Evolution)

- Automated testing of skills in sandboxed environments.
- Usage tracking to prioritize which skills to keep and which to archieve.
