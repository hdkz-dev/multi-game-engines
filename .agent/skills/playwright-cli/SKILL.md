---
name: playwright-cli
description: Browser automation and E2E testing using Playwright CLI. Use when automating user flows, taking screenshots, or verifying dashboard UI behavior.
---

# Playwright CLI Skill

This skill enables Gemini CLI to perform browser automation and end-to-end (E2E) testing using the `playwright-cli` tool.

## Key Capabilities

- **Browser Interaction**: `open`, `click`, `type`, `fill`, `press`, `hover`.
- **Validation**: `eval` to execute JS and check state, `screenshot` for visual checks.
- **Session Management**: Manage multiple tabs and sessions with `-s` flag.
- **Network Mocking**: `route` to intercept and mock API calls.

## Standard Workflow

### 1. Initialize E2E Environment

When setting up testing for a dashboard:

- Ensure the dev server is running.
- Use `playwright-cli open <url>` to start a session.

### 2. Automate User Flows

- Use `click` and `type` to simulate user actions.
- Use `eval` to wait for elements or verify data in the DOM.

### 3. Take Screenshots

- Use `screenshot --full-page` to capture the UI state for visual regression.

## Tool Integration

| Command      | Usage Example                                          |
| :----------- | :----------------------------------------------------- |
| `open`       | `npx playwright-cli open http://localhost:3000`        |
| `click`      | `npx playwright-cli click "button:has-text('Search')"` |
| `eval`       | `npx playwright-cli eval "() => document.title"`       |
| `screenshot` | `npx playwright-cli screenshot dashboard.png`          |

## Pattern: Recursive UI Verification

To verify complex state (like a game board):

1. Navigate to the dashboard.
2. Use `eval` to extract the serialized board state from the component.
3. Compare against expected domain types.
