import { describe, it, expect, beforeEach } from "vitest";
import "../engine-monitor.js";
import { EngineMonitorElement } from "../engine-monitor.js";

describe("EngineMonitorElement", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should be defined as a custom element", () => {
    expect(customElements.get("engine-monitor")).toBeDefined();
  });

  it("should render placeholder text when no engine is provided", async () => {
    const el = document.createElement("engine-monitor") as EngineMonitorElement;
    el.locale = "en";
    document.body.appendChild(el);

    // 2026 Best Practice: Lit の非同期レンダリングを待機
    await el.updateComplete;

    expect(el.shadowRoot?.textContent).toContain("Initializing...");
  });
});
