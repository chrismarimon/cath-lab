// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PHASES } from "../src/config/cardiovascular";
import { createInterface, PATHWAY_STEP_COUNT } from "../src/ui/interface";

describe("educational viewer interface", () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
  });

  it("initializes the complete interface without a backend request", () => {
    const fetchSpy = vi.spyOn(window, "fetch");
    const root = document.getElementById("app")!;
    const ui = createInterface(root);
    expect(ui.viewport).toBeInstanceOf(HTMLElement);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(document.querySelectorAll(".pathway li")).toHaveLength(13);
    expect(PATHWAY_STEP_COUNT).toBe(17);
  });

  it("shows the exact educational disclaimer persistently in two regions", () => {
    createInterface(document.getElementById("app")!);
    const disclaimer =
      "For education and demonstration only. Not for clinical training or medical advice.";
    expect(document.body.textContent?.split(disclaimer)).toHaveLength(3);
  });

  it("exposes only the reset-view control", () => {
    createInterface(document.getElementById("app")!);
    const buttons = [...document.querySelectorAll("button")];
    expect(buttons).toHaveLength(1);
    expect(buttons[0].id).toBe("reset-view");
    expect(buttons[0].getAttribute("aria-label")).toContain("Reset");
  });

  it("updates automatic circulation phase status accessibly", () => {
    const ui = createInterface(document.getElementById("app")!);
    ui.updatePhase(PHASES[2]);
    expect(ui.phaseTitle.textContent).toBe("Left heart");
    expect(ui.phaseSummary.textContent).toContain("oxygenated");
    expect(ui.phaseMarker.textContent).toBe("03");
    expect(
      document.querySelector('[data-phase="left-heart"]')?.classList,
    ).toContain("active");
    expect(
      document.querySelector(".phase-card")?.getAttribute("aria-live"),
    ).toBe("polite");
  });

  it("includes concise right, pulmonary, left, systemic, and valve explanations", () => {
    createInterface(document.getElementById("app")!);
    const text = document.querySelector(".clinical-notes")?.textContent ?? "";
    ["Right heart", "Pulmonary", "Left heart", "Systemic", "Valves"].forEach(
      (term) => expect(text).toContain(term),
    );
  });
});
