# @multi-game-engines/ui-react

React components and hooks for building advanced game engine analysis interfaces.

## Features

- **High Performance**: Throttled updates synchronized with `requestAnimationFrame` via `ui-core`.
- **Framework Agnostic Core**: Business logic is separated from view, ensuring long-term maintainability.
- **Accessible by Default**: Built with Radix UI primitives and ARIA best practices.
- **Customizable**: Styled with Tailwind CSS, easy to theme with CSS variables.

## Installation

```bash
pnpm add @multi-game-engines/core @multi-game-engines/ui-core @multi-game-engines/ui-react
```

## Basic Usage

### Using the Integrated Panel

The `EngineMonitorPanel` is a ready-to-use component that provides a full analysis dashboard.

```tsx
import { EngineMonitorPanel } from "@multi-game-engines/ui-react";
import { useEngine } from "./my-engine-hook";

function AnalysisView() {
  const engine = useEngine("stockfish");

  return (
    <div className="h-[600px] w-[400px]">
      <EngineMonitorPanel
        engine={engine}
        searchOptions={{ depth: 20 }}
        title="Stockfish 16.1"
        onMoveClick={(move) => console.log("User clicked move:", move)}
      />
    </div>
  );
}
```

### Using Custom Hooks

For full control over the UI, use the `useEngineMonitor` hook.

```tsx
import { useEngineMonitor } from "@multi-game-engines/ui-react";

function CustomMonitor({ engine }) {
  const { state, status, search, stop } = useEngineMonitor(engine);

  return (
    <div>
      <div>Status: {status}</div>
      <div>Depth: {state.stats.depth}</div>
      <button onClick={() => search({ movetime: 5000 })}>Analyze</button>
    </div>
  );
}
```

## Architecture

This package follows a **Headless UI** pattern where the state management and data normalization are handled by `@multi-game-engines/ui-core`. This ensures that:

1. Re-rendering is minimized even with high-frequency engine output.
2. The logic can be shared with other frameworks (Vue, Svelte, etc.) in the future.

## License

MIT
