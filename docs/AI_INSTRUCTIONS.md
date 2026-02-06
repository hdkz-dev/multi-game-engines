# AI Instructions

## Project Mission
To provide a unified, highly extensible bridge for various game engines while maintaining strict license separation.

## Technical Priorities
1. **Abstraction**: The Core should only know about the `IEngine` interface.
2. **Type Safety**: Use Generics to allow access to engine-specific features.
3. **Async first**: Engine operations (search, move) must be asynchronous (Promises).
4. **WASM readiness**: Design adapters to handle WASM instantiation and messaging.
