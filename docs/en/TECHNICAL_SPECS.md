# Technical Specifications (TECHNICAL_SPECS.md)

## 1. Core Type Definitions

The `core` package provides abstract definitions independent of specific games.

### 1-1. Base Definitions

- **Brand<K, T>**: Common helper for generating Branded Types.
- **NormalizedScore**: Branded number mapped from -1.0 to 1.0.
- **EngineStatus**: Lifecycle states (`loading`, `ready`, `busy`, etc.).
- **EngineErrorCode**: Standardized error codes.

### 1-2. Search Info (IBaseSearchInfo)

Highly standardized structure for engine candidate data.

- **`positionId`**: Unique identifier for the board position, used for stale message filtering.
- **`score` (Standardized Score)**:
  - `raw`: Raw numeric value from engine.
  - `unit`: Evaluation unit (`cp`, `mate`, `points`, `winrate`, `diff`).
  - `normalized`: `NormalizedScore` (-1.0 to 1.0).
- **`pv` (Structured PV)**: Array of `Move[]` (Branded Types) instead of raw strings.
- **`depth`, `seldepth`, `nodes`, `nps`, `time`, `hashfull`**: Standard metrics.

### 1-3. Universal I/O & Flow Control

- **`AbortSignal`**: Required parameter for `loadResource`, `search`, and `analyze`.
- **`ILoadProgress`**: Standard object for progress notifications.
  - `status`: 'connecting', 'downloading', 'verifying', 'completed', 'aborted'.
  - `loadedBytes`: Current transferred bytes.
  - `totalBytes`: Expected total size.
- **`ProgressCallback`**: `(progress: ILoadProgress) => void`.

### 1-4. Environment-Agnostic Storage (IFileStorage)

- **`OPFSStorage`**: High-performance browser Origin Private File System (Primary).
- **`IndexedDBStorage`**: Browser-based fallback.
- **`NodeFSStorage`**: Node.js/Bun local file system.
- **`MemoryStorage`**: Ephemeral in-memory storage.
- **Custom Injection**: Users can inject custom `IFileStorage` via `IEngineBridgeOptions`.

## 2. Engine Facade (IEngine)

Primary API for application developers.

- **Auto-Type Inference**: `bridge.getEngine('stockfish')` automatically infers the correct generic types via the `EngineRegistry`.
- `load()`: Initialization with SRI validation and persistent cache loading.
- `search(options)`: Asynchronous search with automatic loading. **Middleware Isolation** protects the main process from crashes in individual middleware hooks using per-hook `try-catch`.
- `onInfo(callback)`: Real-time subscription to thinking info via normalization middleware.
- `consent()`: Resumes loading after explicit license agreement.
- `stop()`: Graceful search interruption (Async).
- `dispose()`: Releases engine resources and clears managed subscriptions.

## 3. Advanced Analysis

### 3-1. Batch Analysis (EngineBatchAnalyzer)

Efficiently analyzes entire game records (move lists).

- **Prioritized Interruption**: `analyzePriority` allows real-time analysis to preempt background batch processing.
- **Flow Control**: Supports `pause()`, `resume()`, and `abort()`.

### 3-2. Opening Book Provider (IBookProvider)

Manages huge book assets independently.

- **`loadBook(asset, options)`**: Loads book data and returns a Blob URL or physical path accessible to WASM.

## 4. Security & Infrastructure

### 4-1. EngineLoader (Zenith Tier)

- **SRI Mandatory**: Hash validation is enforced for all resources. Blank `sri` requires explicit `__unsafeNoSRI` flag.
- **Atomic Multi-load**: Fetches and validates multiple dependencies (WASM + NNUE) as a single atomic unit.
- **Auto-Revocation**: Automatically revokes old Blob URLs to prevent memory leaks.
- **30s Timeout**: Prevents hang-ups during network fetch with detailed Error Cause API tracking.

### 4-2. Protocol Validation (Structural Defense)

Parsers call `ProtocolValidator.assertNoInjection` before command generation.

- **Target**: `createSearchCommand` (positions), `createOptionCommand` (names/values).
- **Checks**: Control characters like `\n`, `\0`, `;`.
- **Circular Protection**: Uses `WeakSet` to detect and reject recursive objects, preventing stack overflow from malicious input.
- **Policy**: Reject (Throw) instead of Sanitize.

### 4-3. Hybrid Bridge

- **Environment Detection**: Determines runtime (Browser vs Node.js).
- **Interface Consistency**: `WebWorkerAdapter` and `NativeCommunicator` share the same `IEngineAdapter` interface.
- **Stream Buffering**: `NativeCommunicator` implements internal buffering to reassemble messages split across OS pipe packets (e.g., extremely long PV strings).

## 5. UI & Presentation Layer

### 5-1. Reactive Engine Store (`ui-core`)

- **Throttling**: Synchronizes with `requestAnimationFrame` (60/120fps) to prevent UI thread saturation from high-frequency engine data.
- **Deterministic Snapshots**: Full compatibility with React `useSyncExternalStore` to prevent rendering "tearing".
- **Zod Validation**: Validates all incoming engine messages at the UI boundary.

### 5-2. Federated i18n Architecture

- **Physical Isolation**: `i18n-chess`, `i18n-shogi`, etc., are separate packages.
- **Zero-Any Safety**: Recursive `DeepRecord` types ensure 100% type safety when accessing nested translation keys.
- **Pay-as-you-go**: Minimum bundle size by only including required language modules.

### 5-3. Web Accessibility (A11y) Standards

All UI components must strictly adhere to the following accessibility standards:

- **Compliance**: WCAG 2.2 Level AA.
- **ARIA Roles & Landmarks**:
  - Game boards must use `role="grid"` with squares as `role="gridcell"`.
  - Dynamic content updates (engine info) must use `aria-live="polite"`.
  - Error notifications must use `role="alert"`.
- **Keyboard Navigation**:
  - Proper `tabindex` management and visible focus indicators using `:focus-visible`.
  - Arrow key support for board navigation; Enter/Space for details.
  - Proper focus trapping for modal/overlay elements.
- **Visual & Layout**:
  - Minimum contrast ratio of 4.5:1 for text and 3:1 for UI elements.
  - Supports 400% zoom without horizontal scrolling (Reflow).
- **Automated Validation**: Mandatory `axe-core` scanning in CI/CD via Playwright.

## 6. Testing Philosophy

- **Empirical 98% Coverage**: Targets 98.41%+ line coverage in `core`, physically demonstrating resilience against network failures, storage locks, and timeout conditions using mocks.
- **Deterministic Telemetry**: Mocks `performance.now()` for environment-independent verification.
- **Zero-Any Policy**: 100% elimination of `any` in production and test code.

## 7. AI Agent Skills (Modular Capabilities)

Standardized framework for extending AI agent capabilities across the monorepo.

### 7-1. Skill Structure (SKILL.md)

Each skill is a self-contained directory in `skills/` containing:
- **`SKILL.md`**: Frontmatter metadata (name, description) and instructions.
- **`README.md`** (Optional): User-facing documentation.
- **`tools/`** (Optional): Scripts or local MCP tools associated with the skill.

### 7-2. Core Skills

- **`zenith-audit`**: Automated Grep-based auditing for Zero-Any and Branded Type compliance.
- **`doc-sync`**: Maintenance of Japanese/English documentation parity.
- **`code-review`**: Integration with external auditing tools like CodeRabbit.
