---
name: testing-automator-v2
description: Next-generation testing automation skill. Focuses on self-healing E2E tests, AI-driven bug triaging, and Cloudflare Workers testing strategies.
version: 1.0.0
author: multi-game-engines contributors
---

# Testing Automator V2 Skill

This skill takes testing automation to the next level by leveraging AI for maintenance and focusing on modern infrastructure like Cloudflare.

## Capabilities

1.  **Self-Healing Selectors**: When an E2E test fails due to a missing selector, analyze the DOM to find the most likely replacement and suggest a fix.
2.  **AI Bug Triaging**: Automatically categorize test failures into "Source Code Bug", "Test Flakiness", or "Environment Issue" by analyzing logs and screenshots.
3.  **Cloudflare Workers Testing**: Implement integration testing using `Miniflare` and `Vitest` to simulate the Edge environment.
4.  **Scenario Generation**: Autonomously generate new test cases based on user stories in `TASKS.md` or PR descriptions.

## Cloudflare Workers Testing Pattern

### Integration with Vitest & Miniflare

```typescript
// worker.test.ts
import { unstable_dev } from "wrangler";
import type { UnstableDevWorker } from "wrangler";
import { describe, expect, it, beforeAll, afterAll } from "vitest";

describe("Worker", () => {
  let worker: UnstableDevWorker;

  beforeAll(async () => {
    worker = await unstable_dev("src/index.ts", {
      experimental: { disableLocalPersistence: true },
    });
  });

  afterAll(async () => {
    await worker.stop();
  });

  it("should return 200 OK", async () => {
    const resp = await worker.fetch("/");
    expect(resp.status).toBe(200);
  });
});
```

## Self-Healing Strategy

- **Step 1**: Capture HTML snapshot on test failure.
- **Step 2**: Compare failed selector with snapshot to find similar elements (role, text, label).
- **Step 3**: Propose new selector in a follow-up action.

## Best Practices Checklist

- [ ] **Visual Regression**: Integrate visual testing for critical game UI elements.
- [ ] **Network Mocking**: Use `MSW` (Mock Service Worker) for consistent API responses.
- [ ] **A11y Checks**: Integrate `axe-core` into the automated testing pipeline.
- [ ] **Timeout Management**: Use dynamic waiting instead of hard timeouts.

## Troubleshooting

- **Flaky Workers Tests**: Ensure `Miniflare` instances are correctly cleaned up between tests.
- **Slow E2E**: Parallelize tests across multiple workers or CI shards.
