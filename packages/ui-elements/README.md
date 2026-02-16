# @multi-game-engines/ui-elements

Framework-agnostic Web Components (Lit) for multi-game-engines.
Portable, high-performance UI components that work anywhere HTML works.

## Features

- **Portable**: Works in React, Vue, Svelte, or vanilla HTML.
- **Components**: `<engine-monitor>`, `<score-badge>`, `<engine-stats>`, `<pv-list>`.
- **Shadow DOM**: Encapsulated styling immune to external CSS conflicts.
- **Performance**: Lit-based efficient rendering.

## Usage

```html
<script type="module" src="...">
  import "@multi-game-engines/ui-elements";
</script>

<engine-monitor id="monitor" panel-title="Stockfish 16.1"> </engine-monitor>

<script>
  const monitor = document.querySelector("engine-monitor");
  monitor.engine = myEngineInstance;
  monitor.searchOptions = { fen: "startpos" };
</script>
```
