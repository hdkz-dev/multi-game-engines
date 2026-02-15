import React, { useMemo } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { useEngineMonitor } from "../useEngineMonitor.js";
import { MockEngine } from "../mocks/MockEngine.js";

// --- Component Layer ---
const EngineMonitorView = () => {
  const engine = useMemo(() => new MockEngine(), []);
  const { state, status, monitor } = useEngineMonitor(engine);

  return (
    <div
      style={{
        padding: "20px",
        fontFamily: "monospace",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    >
      <h2>Engine Monitor (ui-core + React Hook)</h2>
      <div style={{ marginBottom: "10px" }}>
        <strong>Status:</strong>{" "}
        <span style={{ color: status === "busy" ? "red" : "green" }}>
          {status}
        </span>
      </div>

      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button onClick={() => monitor.search({})} disabled={status === "busy"}>
          Start Search
        </button>
        <button onClick={() => monitor.stop()} disabled={status !== "busy"}>
          Stop
        </button>
      </div>

      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}
      >
        <section>
          <h3>Statistics</h3>
          <ul>
            <li>Depth: {state.stats.depth}</li>
            <li>Nodes: {state.stats.nodes.toLocaleString()}</li>
            <li>NPS: {state.stats.nps.toLocaleString()}</li>
            <li>Time: {state.stats.time}ms</li>
          </ul>
        </section>

        <section>
          <h3>Principal Variations</h3>
          {state.pvs.map((pv) => (
            <div
              key={pv.multipv}
              style={{
                marginBottom: "10px",
                padding: "8px",
                background: "#f0f0f0",
              }}
            >
              <strong>Score: {pv.score.value}</strong>
              <div style={{ fontSize: "0.9em", color: "#666" }}>
                {pv.moves.join(" ")}
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};

// --- Storybook Meta ---
const meta: Meta<typeof EngineMonitorView> = {
  title: "UI/SearchMonitor",
  component: EngineMonitorView,
};

export default meta;
type Story = StoryObj<typeof EngineMonitorView>;

export const Default: Story = {};
