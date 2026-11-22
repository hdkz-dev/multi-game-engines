# npm v12 Security Compliance and Trusted Publishing (OIDC) Migration Plan

- Date: 2026-11-22
- Governing ADR: [ADR 072](../adr/072-npm-trusted-publishing-and-install-security.md)
- Baseline: `main` (`8ce924b6`) / Local verified toolchain `Node v24.13.0`, `npm 11.21.3`, `pnpm 12.15.0`
- Key Deadlines:
  - **2026-12-16**: Current GitHub Secret `NPM_TOKEN` (30-day GAT) expires
  - **~January 2027**: Direct `npm publish` via 2FA-bypass GATs scheduled for removal ([official announcement](https://github.blog/changelog/2026-07-08-npm-install-time-security-and-gat-bypass2fa-deprecation/))

---

## 1. Pre-Migration Audit Summary

### 1-1. npm v12 Install-Time Security Audit (All 53 Public Packages)

| Check                                                | Result         | Notes                                                                                          |
| :--------------------------------------------------- | :------------- | :--------------------------------------------------------------------------------------------- |
| `preinstall` / `install` / `postinstall` / `prepare` | **0**          | Safe for consumers running npm v12 (`allowScripts` off by default)                             |
| Native addons (`binding.gyp`)                        | **0**          | No implicit `node-gyp rebuild` triggered                                                       |
| Git / remote URL dependencies                        | **0**          | Safe under default `--allow-git=none` and `--allow-remote=none`                                |
| Workspace-side controls (`pnpm-workspace.yaml`)      | **Configured** | Explicit `allowBuilds` (8 packages), `minimumReleaseAge: 1440`, `strictPeerDependencies: true` |

### 1-2. Public Packages Missing `repository` Field (12 of 53)

GitHub Actions OIDC trusted publishing and automatic provenance generation require `package.json` `repository.url` to match `git+https://github.com/hdkz-dev/multi-game-engines.git`. The remaining 41 public packages already have valid matching entries; these 12 do not:

1. `@multi-game-engines/adapter-janggi` (`packages/adapter-janggi/package.json`)
2. `@multi-game-engines/adapter-xiangqi` (`packages/adapter-xiangqi/package.json`)
3. `@multi-game-engines/domain-gomoku` (`packages/domain-gomoku/package.json`)
4. `@multi-game-engines/domain-janggi` (`packages/domain-janggi/package.json`)
5. `@multi-game-engines/domain-xiangqi` (`packages/domain-xiangqi/package.json`)
6. `@multi-game-engines/i18n-chess` (`packages/i18n-chess/package.json`)
7. `@multi-game-engines/i18n-common` (`packages/i18n-common/package.json`)
8. `@multi-game-engines/i18n-core` (`packages/i18n-core/package.json`)
9. `@multi-game-engines/i18n-dashboard` (`packages/i18n-dashboard/package.json`)
10. `@multi-game-engines/i18n-engines` (`packages/i18n-engines/package.json`)
11. `@multi-game-engines/i18n-shogi` (`packages/i18n-shogi/package.json`)
12. `@multi-game-engines/registry` (`packages/registry/package.json`)

> Note: 51 of 53 public packages omit `publishConfig.access`, currently relying on `@changesets/cli@3.0.3` passing `--access public` from `.changeset/config.json`. Consistency will be checked in Phase 0.

---

## 2. Phased Migration Plan

### Phase 0: Preparation (Completed 2026-11-22)

1. **Populated `repository` and common metadata across the 12 missing packages (Done)** — Added `author`, `repository`, `bugs`, and `homepage` matching the other 41 packages (all 53 public packages aligned).
2. **Upgraded `scripts/setup-trusted-publishers.mjs` (Done)** — Enforces `npm >= 11.15.0`, adds `--mode=direct|stage|both` (defaulting to `--allow-publish`), `--sleep-ms` (default `2000`), `--filter`, login-free `--dry-run`, `isTrustEntryConfigured` permission/expiry validation, 48-hour expiry warning, and `lint:tooling` integration.
3. **Retired legacy GAT automation & added permanent tests (Done)** — Removed `.github/workflows/initial-publish.yml`, clarified new-package scope in `scripts/initial-publish.mjs` / `scripts/sequential-publish.mjs`, and added permanent OIDC / npm v12 / CLI regression tests to `scripts/validation.test.mjs`.

### Phase 1: OIDC Cutover & 48-Hour Full-Validation Release (`Before 2026-12-16`)

1. **Prepare a coordinated patch release covering all 53 public packages** so every Trusted Publisher configuration completes its first OIDC publish within 48 hours and becomes permanently validated.
2. **Configure `.github/workflows/release.yml` for pure OIDC**:
   - Remove `NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}` from `changesets/action@v2` `env` and ensure `actions/setup-node` does not leave a conflicting placeholder `_authToken` in `.npmrc` that blocks native `pnpm 12` / `npm` OIDC exchange.
3. **Run `pnpm run npm:setup-oidc` right before merging the release PR** (user logs in interactively and enables npm's 5-minute 2FA skip checkbox on the first package).
4. **Verify**: Review and `--merge` the generated `Version Packages` PR, confirm all 53 packages publish with automatic provenance via OIDC, and verify validation status on `npmjs.com`.

### Phase 2: Token Decommission (`Immediately after Phase 1, before Jan 2027`)

1. Enable **`Require two-factor authentication and disallow tokens`** under Publishing access for all 53 packages.
2. Delete `NPM_TOKEN` from GitHub Secrets (`gh secret delete NPM_TOKEN --repo hdkz-dev/multi-game-engines`) and revoke the 2FA-bypass GAT on `npmjs.com`.
3. Mark ADR 072 as Accepted/Completed and close issue M8 in `TASKS.md` / `PROGRESS.md` / `ISSUES.md`.

---

## 3. Risks and Rollback

| Risk                                                                                         | Mitigation / Rollback                                                                                                                             |
| :------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------ |
| Unvalidated OIDC trust expires after 48 hours                                                | Execute `npm:setup-oidc` immediately before releasing; if expired, revoke and re-create the trust entry for a fresh 48h window                    |
| `setup-node` placeholder `.npmrc` interferes with `pnpm 12` OIDC auth (`E404` / `ENEEDAUTH`) | Remove `NODE_AUTH_TOKEN` from `release.yml`, and omit `registry-url` (or isolate registry config) if `.npmrc` `_authToken` triggers fallback bugs |
| 5-minute 2FA skip window expires mid-loop                                                    | 53 packages at 2s intervals take ~106s; `isAlreadyConfigured` resumes safely if interrupted                                                       |
| Unexpected failure during Phase 1 cutover                                                    | Defer "disallow tokens" enforcement and GitHub Secret deletion until Phase 2 so temporary rollback remains possible before `2026-12-16`           |
