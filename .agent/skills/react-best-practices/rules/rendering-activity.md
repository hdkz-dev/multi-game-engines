---
title: Use Activity Component for Show/Hide
impact: MEDIUM
impactDescription: preserves state/DOM
tags: rendering, activity, visibility, state-preservation
---

## Use Activity Component for Show/Hide

Use React's `<Activity>` (Experimental/Canary, React 19.2+) to preserve state/DOM for expensive components that frequently toggle visibility.

> **Warning:** This is an **experimental** API available in React Canary/19.2+. Do not use in Stable builds without checking support.

**Usage:

```tsx
import { Activity } from "react";

function Dropdown({ isOpen }: Props) {
  return (
    <Activity mode={isOpen ? "visible" : "hidden"}>
      <ExpensiveMenu />
    </Activity>
  );
}
```

Avoids expensive re-renders and state loss.
