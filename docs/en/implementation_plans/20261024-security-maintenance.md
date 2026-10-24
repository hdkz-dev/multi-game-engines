# 2026-10-24 security maintenance

## Scope and evidence

The isolated checkout of main `2d9ffbc` returned 26 pnpm advisories (3 critical, 8 high, 11 moderate, 4 low), including Next.js, Storybook, Nuxt, Happy DOM and Undici beyond the GitHub markdown-it notifications.

- Update Next.js to 16.4.3, Nuxt to 4.6.2 and Storybook core to 10.6.3 within compatible ranges.
- Update jsdom to 30.1.3, Happy DOM to 21.0.4, Wrangler to 4.152.0 and its matching workers-types peer.
- Align Vue and compiler-dom at 3.5.44 throughout the workspace after the Nuxt update exposed duplicate Vue 3.5.43/3.5.44 type identities. No type-check suppression is added.
- Resolve safe markdown-it 14.3.3, launch-editor 2.14.2, fast-uri 3.1.9, Zod, Undici and serialize-javascript versions in the lockfile.
- Remove the Storybook core events.js patch: 10.6.3 imports FireObject from the testing-library public export.
- Remove the obsolete Nuxt DevTools compatibility patch: 3.4.4 replaces simple-git with tinyexec.
- Port the existing ZipArchive compatibility patch to Nitro 2.13.5, which still imports archiver's old default API.

## Vue declaration compatibility

After Vue alignment, the Storybook-inclusive ui-vue-monitor type check exposed TS2313 in Vue 3.5.44 ExtractDefaultPropTypes. A one-line patch replaces `keyof Pick<O, DefaultKeys<O>>` with a homomorphic mapped type over `keyof O` that retains only `DefaultKeys<O>`, preserving readonly and optional modifiers. InferPropType, public APIs and check strength remain unchanged. Independent review confirmed equivalence for normal runtime prop-options objects, and the previously failing target now passes. For a readonly tuple type argument, the old declaration creates a phantom property at the tuple length, which the new declaration excludes. Array-form props do not declare defaults; validation covers object-form default inference. Remove this patch when upstream provides an equivalent declaration and all type checks pass without it.

## Required dependency exception

Registry metadata confirms that the latest Wrangler 4.152.0 uses Miniflare `5.20261019.2-beta`, which pins Undici `7.29.1`. Apply `undici@>=7.18.0 <7.30.1: >=7.30.1 <8` only to vulnerable 7.x versions. This is neither an audit exclusion nor an exact version pin. Remove it after Miniflare requires a safe version and installation, audit and Cloudflare type checks pass without the override. No persistent overrides are added for the other transitive updates.

## Validation

- `pnpm install --frozen-lockfile`: passed, retaining strict peers and the existing build allowlist.
- `pnpm audit`: zero advisories, including development dependencies.
- `pnpm lint`: passed with warning rejection retained.
- `pnpm exec turbo typecheck --force`: all 99 tasks passed, zero cached.
- `pnpm build`: all 56 tasks passed.
- `pnpm test`: all workspace tests and 13 tooling tests passed.
- `pnpm --filter @multi-game-engines/core test:coverage`: passed, 98.47% lines.
- CodeRabbit: two reviews. The initial two record-link issues were fixed. The second lockfile-consistency request is checked by frozen installation and CI. The final Vue patch received independent review and a real compiler regression test for readonly and value types.
- `pnpm doc-sync` and `git diff --check`: passed. Remote CI/E2E remain to be checked after PR creation.

Public APIs and communication boundaries are unchanged. Main integration and npm publication have not occurred. M1b/M1c remain separate work.
