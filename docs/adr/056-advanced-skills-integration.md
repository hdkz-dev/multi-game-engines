# ADR-056: Advanced Agent Skills Integration and Standardization

## Status
Accepted (2026-03-01)

## Context
As the project scales to 2026 Zenith Tier quality standards, the AI development workflow requires modular, reusable, and standardized instruction sets ("Skills"). Previously, skills were scattered and used non-standard patterns. Inspired by the [Agent Skills specification](https://github.com/kepano/obsidian-skills), we need a centralized and automated way to manage AI agent capabilities.

## Decision
We will standardize all AI capabilities into a unified "Skills" framework.

1.  **Standardized Directory Structure**:
    - All project-specific skills will reside in the `skills/` root directory.
    - Format: `skills/<skill-name>/SKILL.md`.
    - Redundant `.agents/skills/` or individual file pointers will be deprecated and unified.

2.  **Core Skills Integration**:
    - **`zenith-audit`**: A high-fidelity auditing skill focusing on Zero-Any, security, and physical resilience.
    - **`doc-sync`**: A skill to maintain 1:1 parity between Japanese and English documentation.
    - **`code-review`**: Updated integration with external tools (CodeRabbit).

3.  **Workflow Integration**:
    - `docs/AI_WORKFLOW.md` will be updated to treat "Skill Activation" as a mandatory step for complex tasks.
    - AI agents must prefer skills over ad-hoc instruction sets for recurring quality-critical operations.

## Consequences
- **Positive**: Modular instructions allow for easier maintenance and cross-agent compatibility.
- **Positive**: Guarantees consistent quality gates (e.g., Zenith Audit) regardless of which AI tool is performing the implementation.
- **Positive**: Clearer path for new developers/AI agents to join the project by "activating" established skills.
- **Neutral**: Requires initial overhead to migrate existing ad-hoc instructions to the SKILL.md format.
