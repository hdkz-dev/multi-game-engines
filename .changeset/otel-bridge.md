---
"@multi-game-engines/core": minor
---

Add `OtelBridge` — optional OpenTelemetry integration adapter

Bridges `ITelemetryEvent` from `engine.onTelemetry()` to OpenTelemetry spans
without requiring `@opentelemetry/api` as a hard dependency:

- `OtelBridge.fromGlobal()` — dynamically imports `@opentelemetry/api` only if installed; returns `null` otherwise (zero-install-cost for users who don't use OTel)
- `OtelBridge.record(event)` — maps performance / lifecycle / search events to named OTel spans with engine-scoped attributes
- `OtelBridge.asCallback()` — returns a callback ready to pass to `engine.onTelemetry()`
- `IOtelTracer` / `IOtelSpan` minimal interfaces for structural compatibility without the full OTel SDK
- `@opentelemetry/api >=1.9.0` added as optional `peerDependency`
