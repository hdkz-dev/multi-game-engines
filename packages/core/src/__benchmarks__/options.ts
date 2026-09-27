import type { BenchCompareOptions } from "vitest";

// Bound the sample count: sub-microsecond operations can otherwise allocate
// millions of samples during a time-based run and exhaust the worker heap.
// Keep warmup enabled and use the same workload on local and CI machines.
export const BENCHMARK_OPTIONS = {
  time: 0,
  iterations: 10_000,
  warmupTime: 0,
  warmupIterations: 1_000,
} satisfies BenchCompareOptions;
