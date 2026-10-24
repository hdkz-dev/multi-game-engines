# 2026-10-24 development dependency and toolchain refresh

## Inspection

- Main: `2d9ffbc`, identical locally and on origin. Two existing personal configuration edits are outside this change.
- Open PRs: #276 (Unicorn), #280 (release proposal), #283 (routine dependencies), #284 (OSV Scanner).
- Zero open CodeQL alerts; one High and one Low markdown-it Dependabot alert. No running or queued Actions.
- After the markdown-it/launch-editor update, pnpm audit still reported 21 findings. The completed dependency update reports zero.

## Updates

Update 43 direct dependency families. Key versions: Next 16.4.3, React 19.3.1, Vue 3.5.44, Nuxt 4.6.2, Storybook 10.6.3, Vite 8.3.5, Vitest 5.0.5, ESLint 10.13.0, typescript-eslint 8.72.0, tsup 9.0.0, Turbo 2.11.10, Wrangler 4.152.0 and Playwright 1.64.1.

Migrate to pnpm 12.15.0 and consolidate settings in pnpm-workspace.yaml. Convert the same approved build packages to allowBuilds. Retain strictPeerDependencies and skipLibCheck: false. Select the latest releases older than 24 hours: Workers types 5.20261023.1, ESLint React 5.28.7 and Portless 0.15.9. Add no minimumReleaseAgeExclude, audit exclusions or lint suppressions.

Update transitive markdown-it to 14.3.3 and launch-editor to at least 2.14.2. Restrict compatible security lower bounds for zod, undici, serialize-javascript and fast-uri to vulnerable ranges. Reevaluate removal when upstream consumers permit and resolve safe releases.

Remove obsolete Storybook core, tsup and Nuxt DevTools patches. Port required framework declaration, Next and Nitropack patches. Add patch changesets for the two monitor UI packages whose published dependencies change. The React lint preset is already ignored by Changesets and is not included in the release plan.

## Remaining migrations

- TypeScript 7.0.2: typescript-eslint 8.72.0 requires `<6.1.0`; TypeDoc 0.28.20 supports through 6.0.x. Retain 6.0.3.
- Unicorn 79 is less than 24 hours old. Mature release 78 still produces 644 core findings involving boolean names, class order, promises and comments. Retain 64 and treat public API/runtime changes as a separate migration. Renaming the recommended preset alone is insufficient.
- Merging/publishing #280 and M1b/M1c remain incomplete.

## Validation

Passed: pnpm 12 frozen installation with publication-age verification; lint 98/98 including Oxlint and tooling ESLint; typecheck 99/99; build 56/56; 148 Vitest files with 1,697 tests and 12 tooling tests. Both full and production dependency audits report zero findings. TypeDoc with warnings treated as errors, document synchronization, Changesets status and formatting checks also passed. Check CodeRabbit and remote CI/E2E during PR preparation.
