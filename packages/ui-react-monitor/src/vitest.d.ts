// Extend Vitest's `expect` matchers with @testing-library/jest-dom assertions.
//
// The `Assertion` interface is declared in `@vitest/expect` (re-exported by
// `vitest`), so the augmentation must target `@vitest/expect`, not `vitest`.
// Importing `@testing-library/jest-dom/vitest` alone is insufficient in
// TypeScript 6 with NodeNext resolution because the augmentation is not
// propagated through re-exports.
//
// The interfaces below intentionally have no own members — they inherit all
// matchers from TestingLibraryMatchers via `extends`. The no-empty-object-type
// rule is disabled because this is the canonical pattern for module augmentation.

/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";

declare module "@vitest/expect" {
  interface Assertion<T = any> extends TestingLibraryMatchers<any, T> {}
  interface AsymmetricMatchersContaining extends TestingLibraryMatchers<
    any,
    any
  > {}
}
