# Coding Conventions

## Naming
- Packages: `@multi-game-engines/<name>`
- Interfaces: `I` prefix (e.g., `IEngine`, `IAdapterOptions`)
- Classes: PascalCase (e.g., `EngineBridge`)
- Files: kebab-case (e.g., `engine-bridge.ts`)

## Folder Structure
```
packages/<name>/
  src/
    index.ts
    types.ts
    __tests__/
  package.json
  tsconfig.json
```
