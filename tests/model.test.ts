import { describe, it, expect } from "vitest";
import { CASE } from "../src/config/anatomy";
import {
  initialState,
  step,
  coverage,
  compliantDiameter,
  timi,
  transit,
  type State,
  type Action,
} from "../src/physics/model";
import { runDemo, demoActions } from "../src/procedure/demo";
import { debrief } from "../src/procedure/debrief";
const apply = (s: State, ...a: Action[]) => a.reduce(step, s);
const wait = (s: State, seconds: number) => {
  for (let i = 0; i < seconds * 10; i++) s = step(s, { type: "tick", dt: 0.1 });
  return s;
};
function engaged() {
  return apply(
    initialState(),
    { type: "move", delta: 100 },
    { type: "rotate", delta: 20 },
    { type: "move", delta: 0.25 },
  );
}
function positioned(device: "balloon" | "stent" = "balloon") {
  return apply(
    engaged(),
    { type: "select", device: "wire" },
    { type: "move", delta: 60 },
    { type: "select", device },
    { type: "move", delta: CASE.center },
  );
}
describe("pressure, sizing and coverage", () => {
  it("calculates nominal compliance and bounds", () => {
    const spec = { diameter: 3, length: 18, rbp: 16 };
    expect(compliantDiameter(spec, 10)).toBeCloseTo(3);
    expect(compliantDiameter(spec, 12)).toBeCloseTo(3.06);
    expect(compliantDiameter(spec, 100)).toBeCloseTo(3.6);
  });
  it("covers the lesion and detects both edge misses", () => {
    expect(coverage(38, 18)).toBe(1);
    expect(coverage(38, 8)).toBeCloseTo(8 / 14);
    expect(coverage(46, 18)).toBeLessThan(1);
    expect(coverage(0, 18)).toBe(0);
  });
  it("rejects nonfinite sizes without poisoning state", () => {
    const s = step(initialState(), {
      type: "size",
      device: "stent",
      diameter: NaN,
      length: 18,
    });
    expect(s.stent.diameter).toBe(3);
  });
  it("flags geographic miss for a short deployed stent", () => {
    const s = apply(
      positioned("stent"),
      { type: "size", device: "stent", diameter: 3, length: 8 },
      { type: "pressure", delta: 12 },
    );
    expect(s.geographicMiss).toBe(true);
  });
  it("pre-dilation improves the lesion then recoils after deflation", () => {
    let s = step(positioned(), { type: "pressure", delta: 10 });
    s = wait(s, 12);
    expect(s.predilated).toBe(true);
    expect(s.residual).toBe(40);
    s = step(s, { type: "pressure", delta: -10 });
    expect(s.residual).toBe(55);
  });
  it("stent is permanent and has bounded residual recoil", () => {
    const s = apply(
      positioned("stent"),
      { type: "pressure", delta: 12 },
      { type: "pressure", delta: -12 },
      { type: "move", delta: 10 },
      { type: "size", device: "stent", diameter: 4, length: 12 },
    );
    expect(s.deployedPosition).toBe(38);
    expect(s.position).toBe(38);
    expect(s.deployedSpec?.diameter).toBe(3);
    expect(s.residual).toBe(8);
  });
});
describe("guide and coronary wire", () => {
  it("guide must reach the aortic root", () => {
    const s = step(initialState(), { type: "move", delta: 100 });
    expect(s.completed[0]).toBe(true);
    expect(s.engaged).toBe(false);
  });
  it("engages after fine advance with aligned rotation", () => {
    expect(engaged().engaged).toBe(true);
    expect(engaged().completed[1]).toBe(true);
  });
  it("does not engage away from left cusp", () => {
    const s = apply(
      initialState(),
      { type: "rotate", delta: 90 },
      { type: "move", delta: 100 },
    );
    expect(s.engaged).toBe(false);
  });
  it("pops out with excessive torque", () => {
    const s = step(engaged(), { type: "rotate", delta: 70 });
    expect(s.engaged).toBe(false);
    expect(s.guide).toBe(90);
  });
  it("does not advance a wire without engagement", () => {
    const s = apply(
      initialState(),
      { type: "select", device: "wire" },
      { type: "move", delta: 40 },
    );
    expect(s.wire).toBe(0);
  });
  it.each(["LAD", "LCx", "D1", "D2"] as const)("steers into %s", (branch) => {
    const s = apply(
      engaged(),
      { type: "select", device: "wire" },
      { type: "branch", branch },
      { type: "move", delta: 20 },
    );
    expect(s.branch).toBe(branch);
    expect(s.wire).toBe(20);
  });
  it("requires retraction to change branches", () => {
    const s = apply(
      engaged(),
      { type: "select", device: "wire" },
      { type: "move", delta: 20 },
      { type: "branch", branch: "LCx" },
    );
    expect(s.branch).toBe("LAD");
  });
  it("wire force raises resistance and causes dissection", () => {
    let s = apply(
      engaged(),
      { type: "select", device: "wire" },
      { type: "move", delta: 32 },
      { type: "rotate", delta: 40 },
    );
    for (let i = 0; i < 6; i++) s = step(s, { type: "move", delta: 3 });
    expect(s.wire).toBe(32);
    expect(s.resistance).toBe(0.9);
    expect(s.force).toBe(18);
    expect(s.dissection).toBeGreaterThan(0);
  });
  it("warns about distal advancement", () => {
    const s = apply(
      engaged(),
      { type: "select", device: "wire" },
      { type: "move", delta: 90 },
    );
    expect(s.distal).toBe(true);
    expect(s.message).toContain("Distal");
  });
});
describe("device safety and branch flow", () => {
  it("locks translation, rotation, sizing and device selection while inflated", () => {
    const s = apply(
      positioned(),
      { type: "pressure", delta: 10 },
      { type: "move", delta: 10 },
      { type: "rotate", delta: 20 },
      { type: "size", device: "balloon", diameter: 4, length: 12 },
      { type: "select", device: "stent" },
    );
    expect(s.position).toBe(38);
    expect(s.rotation).toBe(20);
    expect(s.balloon.diameter).toBe(2.5);
    expect(s.active).toBe("balloon");
  });
  it("ruptures only above RBP + 4", () => {
    let s = step(positioned(), { type: "pressure", delta: 18 });
    expect(s.rupture).toBe(false);
    s = step(s, { type: "pressure", delta: 1 });
    expect(s.rupture).toBe(true);
    expect(s.pressure).toBe(0);
    expect(s.dissection).toBeGreaterThan(0);
  });
  it("balloon inflation reduces downstream flow", () => {
    const before = positioned();
    const during = step(before, { type: "pressure", delta: 10 });
    expect(during.flow).toBeLessThan(before.flow);
  });
  it("oversizing causes dissection and D2 occlusion with intact D1", () => {
    const s = apply(
      positioned("stent"),
      { type: "size", device: "stent", diameter: 4.5, length: 18 },
      { type: "pressure", delta: 18 },
      { type: "pressure", delta: -18 },
    );
    expect(s.dissection).toBeGreaterThan(0.3);
    expect(s.d2).toBe(0);
    expect(s.d1).toBe(1);
    expect(timi(s.flow)).toBeLessThan(3);
  });
  it("a stent proximal to D2 does not occlude it", () => {
    const s = apply(
      positioned("stent"),
      { type: "move", delta: -12 },
      { type: "size", device: "stent", diameter: 4.5, length: 8 },
      { type: "pressure", delta: 18 },
    );
    expect(s.d2).toBe(1);
  });
  it("improves flow after ideal stenting", () => {
    expect(runDemo().flow).toBeGreaterThan(initialState().flow);
    expect(timi(runDemo().flow)).toBe(3);
  });
});
describe("contrast and physiologic teaching model", () => {
  it.each([
    [0, 0],
    [0.1, 1],
    [0.5, 2],
    [0.9, 3],
  ])("TIMI grade for %s", (flow, grade) => expect(timi(flow)).toBe(grade));
  it("contrast has transit delay and washout", () => {
    expect(transit(0.2, 1)).toBe(0);
    expect(transit(0.6, 1)).toBeGreaterThan(0);
    expect(transit(0.6, 0.1)).toBe(0);
    expect(transit(8, 1)).toBe(0);
  });
  it("requires exposure for injection", () => {
    expect(step(engaged(), { type: "contrast" }).contrast).toBe(0);
  });
  it("distinguishes selective and nonselective injections", () => {
    const a = apply(
      engaged(),
      { type: "fluoro", on: true },
      { type: "contrast" },
    );
    const b = apply(
      initialState(),
      { type: "fluoro", on: true },
      { type: "contrast" },
    );
    expect(a.injections[0].selective).toBe(true);
    expect(b.injections[0].selective).toBe(false);
    expect(a.contrast).toBe(6);
    expect(b.contrast).toBe(10);
  });
  it("delays final view credit until contrast arrives; repeated view counts once", () => {
    let s = apply(
      positioned("stent"),
      { type: "pressure", delta: 12 },
      { type: "pressure", delta: -12 },
      { type: "fluoro", on: true },
      { type: "contrast" },
    );
    expect(s.finalViews).toHaveLength(0);
    s = wait(s, 2);
    expect(s.finalViews).toEqual([0]);
    s = wait(step(s, { type: "contrast" }), 2);
    expect(s.finalViews).toHaveLength(1);
  });
  it("prolonged occlusion causes ST elevation, tachycardia, BP decline, PVCs and instability", () => {
    const s = wait(step(positioned(), { type: "pressure", delta: 10 }), 48.1);
    expect(s.st).toBeGreaterThan(0);
    expect(s.hr).toBeGreaterThan(90);
    expect(s.bp).toBeLessThan(110);
    expect(s.pvc).toBe(true);
    expect(s.unstable).toBe(true);
  });
  it("recovers when flow returns", () => {
    let s = wait(step(positioned(), { type: "pressure", delta: 10 }), 45);
    s = wait(step(s, { type: "pressure", delta: -10 }), 40);
    expect(s.ischemia).toBe(0);
    expect(s.hr).toBe(72);
    expect(s.bp).toBe(124);
    expect(s.st).toBe(0);
  });
  it("heparin raises ACT once", () => {
    const s = apply(initialState(), { type: "heparin" }, { type: "heparin" });
    expect(s.act).toBe(285);
    expect(s.heparin).toBe(true);
  });
  it("actions do not mutate inputs", () => {
    const s = initialState();
    step(s, { type: "heparin" });
    expect(s.heparin).toBe(false);
    step(s, { type: "move", delta: 100 });
    expect(s.completed[0]).toBe(false);
  });
});
describe("complete cases using the public action API", () => {
  it("ideal demonstration completes all six stages with Excellent grade", () => {
    const s = runDemo();
    expect(s.completed).toEqual([true, true, true, true, true, true]);
    expect(s.stage).toBe(6);
    expect(debrief(s).grade).toBe("Excellent");
    expect(s.longestInflation).toBeCloseTo(12);
    expect(s.balloon).toMatchObject({ diameter: 2.5, length: 15 });
    expect(s.deployedSpec).toMatchObject({ diameter: 3, length: 18 });
    expect(s.finalViews).toEqual([0, 2]);
  });
  it("demo uses only valid public actions", () => {
    expect(
      demoActions().some((a) => a.type === "pressure" && a.delta === 12),
    ).toBe(true);
    expect(
      demoActions().some((a) => a.type === "pressure" && a.delta === 10),
    ).toBe(true);
  });
  it("oversized short high-pressure stent causes dissection, reduced flow and Needs work", () => {
    let s = apply(
      positioned("stent"),
      { type: "size", device: "stent", diameter: 4.5, length: 8 },
      { type: "pressure", delta: 20 },
      { type: "pressure", delta: -20 },
    );
    s = wait(s, 5);
    expect(s.dissection).toBeGreaterThan(0.5);
    expect(s.geographicMiss).toBe(true);
    expect(timi(s.flow)).toBeLessThan(3);
    expect(debrief(s).grade).toBe("Needs work");
  });
});
it("a large misaligned wire step stops at the lesion instead of skipping resistance", () => {
  const s = apply(
    engaged(),
    { type: "select", device: "wire" },
    { type: "rotate", delta: 40 },
    { type: "move", delta: 60 },
  );
  expect(s.wire).toBe(30);
  expect(s.crossed).toBe(false);
});
it("stent retains benefit but recoils after pressure is released", () => {
  const inflated = step(positioned("stent"), { type: "pressure", delta: 12 });
  const deflated = step(inflated, { type: "pressure", delta: -12 });
  expect(inflated.residual).toBe(5);
  expect(deflated.residual).toBe(8);
});
