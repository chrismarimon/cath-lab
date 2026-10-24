// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const render = vi.fn();
const resetView = vi.fn();
const dispose = vi.fn();

vi.mock("../src/scene/renderer", () => ({
  createSceneController: vi.fn(() => ({ render, resetView, dispose })),
}));

beforeEach(() => {
  document.body.innerHTML = '<div id="app"></div>';
  vi.stubGlobal("fetch", vi.fn());
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn(() => 1),
  );
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  render.mockClear();
  resetView.mockClear();
  dispose.mockClear();
});

it("initializes the complete application without contacting a backend", async () => {
  await import("../src/main");
  expect(document.querySelector(".app-shell")).not.toBeNull();
  expect(document.querySelector("#viewport")).not.toBeNull();
  expect(document.querySelector(".information")).not.toBeNull();
  expect(fetch).not.toHaveBeenCalled();
  expect(requestAnimationFrame).toHaveBeenCalledOnce();
});

it("connects the single reset control to the scene controller", async () => {
  await import("../src/main");
  document.querySelector<HTMLButtonElement>("#reset-view")?.click();
  expect(resetView).toHaveBeenCalledOnce();
});
