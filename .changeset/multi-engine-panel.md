---
"@multi-game-engines/ui-react-monitor": minor
"@multi-game-engines/ui-vue-monitor": minor
---

Add `MultiEnginePanel` for simultaneous multi-engine analysis

A new top-level component that renders multiple engines side-by-side:

- **Score comparison bar** (`role="group"`) shows live evaluation and status dot for each engine
- **Responsive grid** layout: `grid-cols-1` → `md:grid-cols-2` → `xl:grid-cols-3` based on engine count
- **`EngineEntry[]` prop**: `{ engine, label?, searchOptions }` — `label` falls back to `engine.name`
- **`onMoveClick(move, engineId)`** callback for React; `@moveClick(move, engineId)` event for Vue
- Full ARIA roles (`list` / `listitem` / `group`) and 10 Playwright CT tests per framework
