---
name: changeset-management
description: A skill for automating package versioning, changelog generation, and tagging using Changesets in a Monorepo environment.
version: 1.0.0
author: multi-game-engines contributors
---

# Changeset Management Skill

This skill streamlines version control and release processes in the monorepo, utilizing [Changesets](https://github.com/changesets/changesets).

## Core Capabilities

1.  **Add Changeset**: Quickly generate a changeset file to document changes.
2.  **Version Bump**: Apply changesets to update package versions.
3.  **Changelog Update**: Automatically update `CHANGELOG.md` files.
4.  **Release Tagging**: Create and push git tags corresponding to package releases.

## Workflow

1.  **When making changes**:
    Run `pnpm changeset` and select the affected packages. Choose the semver bump type (patch, minor, major) and write a summary.
2.  **Release Preparation**:
    When ready to release, run `pnpm changeset version` (or CI equivalent) to consume changesets and update `package.json` versions and changelogs.
3.  **Publishing**:
    Run `pnpm changeset publish` after successfully building and testing.

## CI Integration Best Practices

- [ ] **Automated Version PR**: Configure a GitHub Action that runs `changeset version` and opens a "Version Packages" PR.
- [ ] **Release Trigger**: On merging the Version PR to `main`, trigger the `publish` workflow.
- [ ] **Token Permissions**: Ensure the `GITHUB_TOKEN` has write permissions for contents and pull requests.

## Common commands

- `pnpm changeset`: Interact with the CLI to create a new changeset.
- `pnpm changeset version`: Bump versions based on changesets.
- `pnpm changeset publish`: Publish packages to npm (requires authentication).

## Troubleshooting

- **"No changesets found"**: Ensure you have committed the changeset file `.changeset/*.md`.
- **"Access restricted"**: Verify NPM token permissions and scope.
