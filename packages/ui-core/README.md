# @multi-game-engines/ui-core

Framework-agnostic business logic foundation for multi-game-engines UI ecosystem.
Implements the "Zenith Tier" architecture for 2026 standards.

## Features

- **Reactive Engine Store**: `useSyncExternalStore` compatible state management with RAF throttling.
- **Contract-Driven Validation**: Zod schemas (`SearchInfoSchema`) ensure runtime type safety for engine messages.
- **Presentation Logic**: `EvaluationPresenter` unifies score display logic across all frameworks.
- **I18n**: Type-safe localization support.
- **Middleware**: `UINormalizerMiddleware` for data normalization.

## Usage

```typescript
import {
  EngineStore,
  SearchMonitor,
  EvaluationPresenter,
  createInitialState,
} from "@multi-game-engines/ui-core";
import { createPositionString } from "@multi-game-engines/core";

// Initialize monitor
const monitor = new SearchMonitor(
  engine,
  createInitialState(createPositionString("startpos")),
  transformer,
);
monitor.startMonitoring();

// Get formatted score color
const colorClass = EvaluationPresenter.getColorClass(score);
```
