---
name: security-auditor
description: An advanced security auditing skill focusing on project-specific vulnerabilities, dependency risks, and CSP misconfigurations.
version: 1.0.0
author: multi-game-engines contributors
---

# Security Auditor Skill (Extended)

This skill provides a framework for conducting security audits, focusing on risks specific to game engines and web applications.

## Audit Scope

1.  **Content Security Policy (CSP)**:
    - Verify removal of `unsafe-inline` and `unsafe-eval`.
    - Check that `wasm-unsafe-eval` is only used where strictly necessary (e.g., specific game engine adapters).
2.  **Dependency Vulnerabilities**:
    - Run `pnpm audit` regularly.
    - Review `npm` package overrides or resolutions.
3.  **Wasm Security**:
    - Validate the source and integrity of `.wasm` binaries.
    - Ensure isolation (e.g., running untrusted Wasm in a sandboxed Worker or iframe).
4.  **Input Validation**:
    - Sanitize all user inputs, especially those passed to game engines (FEN strings, moves).
5.  **Headers**:
    - Check for security headers: `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security`, `COOP`, `COEP`.

## Routine Checks

- [ ] **CSP Review**: Are directives as strict as possible?
- [ ] **Dependencies**: Are all critical security updates applied?
- [ ] **Secrets**: Scan for accidentally committed secrets (`.env` files, keys) using `git-secrets` or similar.
- [ ] **Cross-Origin Isolation**: Is the site properly isolated to allow `SharedArrayBuffer` usage if needed for Wasm threads?

## Remediation

- **CSP Violation**: Identify the source script/style. Move inline code to external files or use a nonce/hash.
- **Vulnerable Package**: explicit `pnpm update <package>` or use `pnpm.overrides` in `package.json` to force a secure version.
