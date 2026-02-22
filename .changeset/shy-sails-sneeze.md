---
"@multi-game-engines/core": patch
"@multi-game-engines/adapter-uci": patch
"@multi-game-engines/adapter-usi": patch
"@multi-game-engines/adapter-gtp": patch
"@multi-game-engines/adapter-ensemble": patch
"@multi-game-engines/domain-chess": patch
"@multi-game-engines/domain-shogi": patch
"@multi-game-engines/domain-go": patch
"@multi-game-engines/ui-core": patch
"@multi-game-engines/ui-vue-monitor": patch
"@multi-game-engines/ui-react-monitor": patch
"@multi-game-engines/i18n": patch
---

# Zenith Tier Update (Security, Reliability, & Type Safety)

## Core & Security

- **Security**: Introduced `SecurityAdvisor.assertSRI` for "Refuse by Exception" validation flow.
- **Reliability**: Implemented request aggregation in `EngineLoader` to prevent race conditions during multiple fetch requests.
- **Leak Prevention**: Added `revokeAll` to `EngineLoader` and ensured `EngineBridge.dispose()` clears all Blob URLs.
- **Safety**: Hardened `OPFSStorage` directory clearing with feature detection for non-standard iterators.

## Adapters & Domain

- **i18n**: Unified all validation errors in `domain-chess` and `domain-shogi` to use `EngineError` with i18n keys.
- **Protocol**: Standardized `UCIParser`, `USIParser`, and `GTPParser` to use `EngineError` instead of generic Errors or warnings.
- **Ensemble**: Fixed hardcoded error messages in `MajorityVoteStrategy`.

## UI & Types

- **Type Safety**: Enforced "Zero-Any Policy" across all packages, including Storybook files.
- **Ecosystem**: Downgraded `eslint-plugin-react-hooks` to 7.0.0 to resolve Flat Config compatibility issues.
- **DX**: Added `ValidI18nKey` type to `EngineError` for better autocomplete and type checking.
