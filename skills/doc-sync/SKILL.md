---
name: doc-sync
description: "Maintains 1:1 parity between Japanese and English documentation in the multi-game-engines project. Ensures global architectural alignment."
---

# Documentation Parity Sync

This skill ensures that all architectural, technical, and operational documents are consistently maintained in both Japanese (root `docs/`) and English (`docs/en/`).

## Capabilities

- **Delta Detection**: Identifies files updated in one language but not the other.
- **Automated Translation**: Translates technical concepts while preserving Branded Types and project-specific terminology.
- **Structure Validation**: Verifies that headers, diagrams (Mermaid), and metadata are identical across languages.

## When to Use

- Whenever a file in `docs/` is modified.
- Before completing any task that involves architectural changes.
- When generating new ADRs.

## How to Sync

### 1. Identify Out-of-Sync Files

Compare timestamps or content of `docs/*.md` and `docs/en/*.md`.

```bash
ls docs/*.md
ls docs/en/*.md
```

### 2. Perform Sync

For each updated file in `docs/`:

1.  Read the updated content in Japanese.
2.  Identify key technical terms (Branded Types, interface names).
3.  Generate/Update the corresponding file in `docs/en/`.
4.  **Preserve Mermaid**: Diagrams must be identical.
5.  **Preserve Metadata**: ADR status and dates must match.

### 3. Verify Parity

Ensure that every link in the Japanese doc has a corresponding working link in the English doc.

## Terminology Map

| Japanese | English |
| :--- | :--- |
| 指し手 | Move |
| 局面 | Position |
| 評価値 | Evaluation / Score |
| 堅牢性 | Robustness / Resilience |
| 絶縁 | Isolation |
| 正規化 | Normalization |
| 整合性 | Integrity / Consistency |

## Quality Standard

English documentation must NOT be a rough machine translation. It must use formal, professional software engineering terminology consistent with the Zenith Tier standard.
