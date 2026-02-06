# TypeScript & Monorepo Style Guide

## General Principles
- Use TypeScript for all source code.
- Prefer Interfaces over Types for public APIs.
- Export all shared types from `@multi-game-engines/core`.

## Monorepo Rules
- Do not import directly from `../package-name`. Use the workspace name `@multi-game-engines/package-name`.
- Keep dependencies lean in `core`.

## Comments
- Write comments in **Japanese**.
- Use JSDoc for public methods and interfaces.
