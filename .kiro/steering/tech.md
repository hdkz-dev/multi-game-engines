# Tech Stack & Standards

## Languages & Frameworks

- **Language**: TypeScript (Strict Mode)
- **Monorepo Manager**: pnpm Workspaces
- **Testing**: Vitest
- **Linting**: ESLint, Prettier
- **Build Tool**: tsup

## Coding Standards

- **Zero-Any Policy**: Use `unknown` and strict type guards instead of `any`.
- **Branded Types**: Mandatory for critical domain strings (e.g., `SFEN`, `UCI_MOVE`).
- **POSIX Compliance**: All text files must end with a newline (`
`).
- **Command Injection Prevention**: Use `ProtocolValidator` to sanitize all engine inputs.
- **Generic Ordering**: Maintain consistent order: `T_OPTIONS`, `T_INFO`, `T_RESULT`.

## Architectural Patterns

- **Facade Pattern**: `IEngine` as the primary interface.
- **Adapter Pattern**: Specialized adapters for each engine (Stockfish, etc.).
- **Middleware**: Telemetry and security hooks.
