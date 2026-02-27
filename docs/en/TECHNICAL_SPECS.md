# Technical Specifications (TECHNICAL_SPECS.md)

## 1. Core Types

The Core package provides only abstract definitions independent of specific games or protocols.

### 1-1. Abstract Foundation

- **Brand<K, T>**: Common helper for creating Branded Types.
- **EngineStatus**: Lifecycle states (`loading`, `ready`, `busy`, etc.).
- **EngineErrorCode**: Standardized error codes.

### 1-2. Domain-Specific Branded Types

Game-specific types are centralized in `@multi-game-engines/core`'s `types.ts` to avoid circular dependencies and ensure cross-package consistency.

- **FEN**: Chess position notation (Branded string). Validated via `createFEN`.
- **SFEN**: Shogi position notation (Branded string). Validated via `createSFEN`.
- **Move**: Move notation (Branded string). Supports UCI/USI formats, validated via `createMove`.
- **PositionString**: Generic game-agnostic position string.

### 1-3. Loading Strategy

- `manual`: Requires explicit `load()`.
- `on-demand`: Auto-loads if not ready when `search()` is called.
- `eager`: Starts loading immediately upon engine creation.

## 2. Engine Facade (IEngine)

The main consumer API.

- **EngineRegistry-based Inference**: Automatic type inference for `bridge.getEngine('id')`.
- `load()`: Initialization with SRI validation and cache loading.
- `search(options)`: Asynchronous search with middleware support. Sequential task management stops previous tasks.
- `onInfo(callback)`: Real-time thinking stream subscription.
- `stop()`: Safely aborts current search.
- `dispose()`: Releases individual engine resources and clears managed subscriptions.

## 3. Security & Infrastructure

### 3-1. EngineLoader (Modern Security)

- **Mandatory SRI**: Force hash validation for all resources. Supports W3C standard multi-hash formats.
- **Atomic Multi-load**: Loads multiple related resources (e.g., WASM + NNUE weights) atomically via `loadResources()`.
- **Auto-Revocation**: Prevents memory leaks by revoking old Blob URLs on reload.
- **30s Timeout**: Prevents fetch hangs with detailed `Error Cause API` tracking.

### 3-2. File Storage (2026 Best Practice)

- **Environment Adaptation**: Auto-switches between `OPFSStorage` (Fast) and `IndexedDBStorage`.
- **Robust Connections**: Auto-recovery from browser disconnects in `IndexedDBStorage`.

### 3-3. WorkerCommunicator (Race-condition Free)

- **Message Buffering**: Handles messages arriving before `expectMessage` is called.
- **Exception Propagation**: Forwards internal Worker errors and terminates pending tasks correctly.

## 4. Protocol Parsing (2026 Best Practice)

- **Structural Standardization**: All adapters follow the separation of `{Name}Adapter.ts` (lifecycle) and `{Name}Parser.ts` (logic), with UI components consolidated into `src/components/` (ADR-046).
- **UCIParser**: Chess protocol with factor 10,000 `mate` score conversion.
- **USIParser**: Shogi protocol with time control and `startpos` keyword support.
- **GTPParser**: Go protocol supporting `genmove`, `visits`, and `winrate`.
- **JSONParser (Mahjong)**: Structured message parsing with recursive injection validation.
- **Generic Text Parsers**: Flexible regex-based parsers for custom text protocols like Edax (Reversi), gnubg, etc.
- **Injection Protection**: Illegal control characters trigger immediate `SECURITY_ERROR` rejection.

### 4-1. Board & Move Parsers

Lightweight parsers for UI-layer reuse.

- **parseFEN**: Extracts 8x8 grid and turn metadata from FEN strings.
- **parseSFEN**: Extracts 9x9 grid, turn, and hand counts from SFEN strings.

## 5. Telemetry & Observability

- **Structured Telemetry**: Automatic measurement of search performance via `DefaultTelemetryMiddleware`.
- **Privacy-First Logging (ADR-038)**: To prevent PII leakage in logs, `truncateLog` utility automatically limits position-related strings to the first ~20 characters while maintaining context for debugging.
- **Remediation**: All errors include `remediation` fields with specific recovery actions.

## 6. UI & Presentation Foundation

### 6-0. Resource Loading Strategy (EngineLoader)

To bypass the "Blob Origin" constraint that prohibits relative URL resolution inside Workers in certain browsers:

- **Dependency Injection**: Engines do not use `importScripts` or `fetch` for their own binary files (.wasm, .nnue).
- **Blob Injection**: The `EngineLoader` fetches and hashes all resources at the main-thread level, then injects the resulting Blob URLs directly into the Worker environment during initialization (ADR-043).
- **Auto-Revocation**: Loader automatically tracks Blob URL lifecycles to prevent memory leaks.

### 6-1. Reactive Engine Store (`ui-core`)

High-frequency state management foundation.

- **Modular Structure**:
  - `src/state/`: `EngineStore`, `SearchStateTransformer`, `SubscriptionManager`.
  - `src/monitor/`: `SearchMonitor`, `MonitorRegistry`, `EvaluationPresenter`.
  - `src/dispatch/`: `CommandDispatcher`, `Middleware`.
  - `src/validation/`: Zod contract definitions.
  - `src/styles/`: Shared theme foundation (`theme.css`).
- **Adaptive Throttling**:
  Synchronizes with `requestAnimationFrame` by default.
- **Deterministic Snapshots**: Full compatibility with React `useSyncExternalStore` to prevent rendering tears.
- **Zod Contract Validation**: Validates all engine messages via `SearchInfoSchema` at runtime.
- **EvaluationPresenter**: Separates display logic (colors, labels) from UI frameworks.

### 6-2. React Adapters

- **`ui-react-core`**: Core React context and Provider.
- **`ui-react-monitor`**: Monitoring components and `useEngineMonitor` hook.
- **`ui-chess-react`, `ui-shogi-react`**: Domain-specific components.
- **`ui-react` (Hub)**: All-in-one package for convenience.
- **Storybook 10**: Fully compatible with Vite 6 and Tailwind CSS v4.
- **Deterministic Lifecycle**: Ref-based monitor persistence and Strict Mode safety.
- **A11y (WCAG 2.2 AA)**: Landmark roles and intelligent live regions.

### 6-3. Vue Adapters

- **`ui-vue-core`**: Core Vue context and Provider.
- **`ui-vue-monitor`**: Monitoring components and `useEngineMonitor` composable.
- **`ui-chess-vue`, `ui-shogi-vue`**: Domain-specific components.
- **`ui-vue` (Hub)**: All-in-one package for convenience.
- **Vue 3 Composition API**: `useEngineMonitor` composable for reactive state.
- **Storybook 10**: Storybook integration in Vue 3 + Vite.

### 6-4. Web Components Adapter (`ui-elements`)

- **Lit Implementation**: Standard-compliant lightweight Web Components.
- **Board Components**: Efficient CSS Grid rendering with move highlighting and accessible localized piece names.

### 6-5. Federated i18n Architecture (Zenith Tier)

Localization resources are physically isolated by domain to ensure maximum type safety and performance.

- **Physical Package Separation**:
  - `i18n-core`: Core translation engine logic.
  - `i18n-common`: Shared error codes, common status definitions.
  - `i18n-{domain}`: Game-specific (Chess, Shogi, etc.) vocabulary and messages.
- **Zero-Any Type Safety**:
  - `DeepRecord`: A recursive Record type for dynamic, type-safe access to nested translation data, eliminating `unknown` rendering issues.
  - `I18nKey`: A Branded string defined in the `core` package, allowing adapters to propagate errors without knowledge of specific language implementations.
- **Pay-as-you-go Optimization**:
  - Consumers only import the specific i18n modules they need, reducing the bundle size to nearly zero for unused domains.

## 7. Quality Assurance (Testing Philosophy)

- **140+ Unit Tests**: Comprehensive coverage across Core, Adapters, and UI.
- **Deterministic Time**: Mocks `performance.now()` for environment-independent telemetry validation.
- **Zero-Any Policy**: Strict elimination of `any` using `satisfies` and explicit interfaces.
