/**
 * @multi-game-engines/ui-elements
 *
 * Framework-agnostic Web Components for the Multi-Game Engines ecosystem.
 * Built with Lit, these components can be dropped into any HTML page, React, Vue, Svelte, or Angular app.
 */

// Components
export * from "./components/score-badge.js";
export * from "./components/evaluation-graph.js";
export * from "./components/engine-stats.js";
export * from "./components/pv-list.js";
export * from "./components/search-log.js";
export * from "./components/engine-monitor.js";

// Re-exports from domain-specific element packages
export * from "@multi-game-engines/ui-chess-elements";
export * from "@multi-game-engines/ui-shogi-elements";
