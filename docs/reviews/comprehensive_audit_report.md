# Comprehensive Audit Report: multi-game-engines

Date: 2026-02-12
Status: Post-PR #8 Deep Review Analysis

## 1. Security & Integrity (Critical)
- [ ] **SRI Validation Bypass**: Current `EngineLoader.loadResource` only checks for SRI presence. Empty strings bypass the check. MUST enforce non-empty SRI in production.
- [ ] **UCI Command Injection**: Potential risk if raw commands are not sanitized. Although current implementation is mostly internal, the Facade should ensure commands are valid UCI.
- [ ] **Stockfish SRI**: `packages/adapter-stockfish/src/stockfish.ts` has SRI and size. Need to verify these are accurate and not placeholders. (Current values: `sha384-EUJMxvxCASaeLnRP7io1aDfkBp2KloJPummBkV0HAQcG4B+4mCEYqP1Epy2E8ocv`, size: 38415).

## 2. Resource & Lifecycle Management (Major)
- [ ] **Unsubscribe Leaks**: `EngineBridge.registerAdapter` subscribes to adapter events but never unsubscribes. Re-registering or removing adapters will lead to memory leaks and duplicate events.
- [ ] **Worker Termination Hanging**: `WorkerCommunicator.terminate()` clears pending expectations without rejecting them. Awaiting callers will hang.
- [ ] **Expectation Timeouts**: `WorkerCommunicator.expectMessage` lacks a built-in timeout or `AbortSignal` support.
- [ ] **Search Task Cleanup**: `StockfishAdapter.searchRaw` overwrites `pendingResolve`/`pendingReject` without cleaning up previous tasks. `infoController` must be closed to avoid hanging consumers.

## 3. Type Safety & API Design (Major)
- [ ] **Forbidden 'any'**: Multiple instances of `any` in `CapabilityDetector`, `EngineBridge`, `EngineError`, and tests. Use `unknown` + type guards or specific interfaces.
- [ ] **Branded Types**: `FEN` branded type should be used consistently instead of `string` or `any` in tests (`UCIParser.test.ts`).
- [ ] **EngineBridge Listener Return Types**: `onGlobalStatusChange` and `onGlobalTelemetry` in `IEngineBridge` interface should return `() => void` (unsubscribe function) but are currently typed as `void`.

## 4. Robustness & Stability (Minor)
- [ ] **Storage Error Handling**: `OPFSStorage` and `EngineBridge.getLoader` cache rejected promises, causing permanent failure until page reload.
- [ ] **IndexedDB Connection**: Lack of `onclose`/`onversionchange` handlers to invalidate cached DB connection.
- [ ] **Fetch Failures**: `EngineLoader.loadResource` lacks comprehensive try/catch around `fetch` and `arrayBuffer()`, and lacks timeouts.

## 5. Documentation & CI (Minor)
- [ ] **Bilingual Inconsistency**: README says "Coming soon" for docs that already exist.
- [ ] **CI Reproducibility**: `pnpm install` in CI should use `--frozen-lockfile`.
- [ ] **Actionable Comments**: Address the 16+ actionable comments from CodeRabbit specifically identifying script ESM issues and `process.exit(1)` usage.
