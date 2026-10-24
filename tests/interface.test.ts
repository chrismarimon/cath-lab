// @vitest-environment jsdom
import { beforeEach, afterEach, it, expect, vi } from "vitest";
vi.mock("../src/scene/renderer", () => ({
  createViewport: () => ({
    render: vi.fn(),
    adjust: vi.fn(),
    dispose: vi.fn(),
  }),
}));
let callback: FrameRequestCallback;
let clock = 0;
const click = (id: string) =>
  (document.getElementById(id) as HTMLButtonElement).click();
const flush = () => {
  for (let i = 0; i < 3; i++) {
    clock += 100;
    callback(clock);
  }
};
beforeEach(async () => {
  vi.resetModules();
  vi.spyOn(window, "addEventListener");
  document.body.innerHTML = '<div id="app"></div>';
  clock = performance.now();
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn((fn: FrameRequestCallback) => {
      callback = fn;
      return 1;
    }),
  );
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
    scale: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
  } as unknown as CanvasRenderingContext2D);
  await import("../src/main");
});
afterEach(() => {
  const add = vi.mocked(window.addEventListener);
  for (const [name, listener, options] of add.mock.calls)
    window.removeEventListener(name, listener, options);
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
it("shows exact disclaimer and gates start with a dialog", () => {
  expect(document.querySelector("#start[open]")).not.toBeNull();
  expect(document.body.textContent).toContain(
    "For education and demonstration only. Not for clinical training or medical advice.",
  );
  click("begin");
  expect(document.querySelector("#start[open]")).toBeNull();
});
it("wires keyboard heparin and pause to the same state", () => {
  click("begin");
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "g" }));
  flush();
  expect(document.getElementById("hud")?.textContent).toContain("285 s");
  click("pause");
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "w" }));
  flush();
  expect(document.getElementById("instrument")?.textContent).toContain(
    "Guide 0.0%",
  );
});
it("switches views and exposure state through visible controls", () => {
  click("begin");
  click("view");
  flush();
  expect(document.getElementById("view-title")?.textContent).toBe(
    "FLUOROSCOPY",
  );
  expect(document.getElementById("exposure")?.textContent).toBe(
    "LAST IMAGE HOLD",
  );
  click("fluoro");
  flush();
  expect(document.getElementById("exposure")?.textContent).toContain("15 PPS");
});
it("opens help and debrief, and resets a new case", () => {
  click("begin");
  click("help");
  expect(document.querySelector("#help-dialog[open]")).not.toBeNull();
  click("close-help");
  click("finish");
  expect(document.getElementById("report")?.textContent).toContain(
    "Needs work",
  );
  click("reset");
  expect(document.querySelector("#debrief[open]")).toBeNull();
  flush();
  expect(document.getElementById("hud")?.textContent).toContain("120 s");
});
it("plays the public-action demonstration through to the Excellent debrief", () => {
  click("begin-demo");
  for (let i = 0; i < 500; i++) {
    clock += 100;
    callback(clock);
  }
  expect(document.querySelector("#debrief[open]")).not.toBeNull();
  expect(document.getElementById("report")?.textContent).toContain("Excellent");
  expect(document.getElementById("report")?.textContent).toContain(
    "completed Stages6",
  );
});
