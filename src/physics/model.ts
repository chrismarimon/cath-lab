import { CASE } from "../config/anatomy";
export type Device = "guide" | "wire" | "balloon" | "stent";
export type Branch = "LAD" | "LCx" | "D1" | "D2";
export interface Spec {
  diameter: number;
  length: number;
  rbp: number;
}
export interface State {
  time: number;
  stage: number;
  completed: boolean[];
  active: Device;
  guide: number;
  rotation: number;
  engaged: boolean;
  wire: number;
  branch: Branch;
  crossed: boolean;
  force: number;
  resistance: number;
  distal: boolean;
  position: number;
  pressure: number;
  balloon: Spec;
  stent: Spec;
  deployed: boolean;
  deployedSpec: Spec | null;
  deployedPosition: number;
  expansion: number;
  predilated: boolean;
  predilationSeconds: number;
  rupture: boolean;
  dissection: number;
  geographicMiss: boolean;
  residual: number;
  flow: number;
  d1: number;
  d2: number;
  ischemia: number;
  hr: number;
  bp: number;
  st: number;
  pvc: boolean;
  unstable: boolean;
  act: number;
  heparin: boolean;
  inflation: number;
  longestInflation: number;
  contrast: number;
  injections: {
    at: number;
    selective: boolean;
    view: number;
    final: boolean;
  }[];
  opacification: number;
  fluoro: boolean;
  fluoroTime: number;
  projection: number;
  finalViews: number[];
  qca: boolean;
  message: string;
}
export type Action =
  | { type: "select"; device: Device }
  | { type: "move"; delta: number }
  | { type: "rotate"; delta: number }
  | { type: "branch"; branch: Branch }
  | { type: "pressure"; delta: number }
  | {
      type: "size";
      device: "balloon" | "stent";
      diameter: number;
      length: number;
    }
  | { type: "tick"; dt: number }
  | { type: "contrast" }
  | { type: "heparin" }
  | { type: "fluoro"; on: boolean }
  | { type: "projection"; index: number }
  | { type: "qca" };
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
export function initialState(): State {
  return {
    time: 0,
    stage: 0,
    completed: Array<boolean>(6).fill(false),
    active: "guide",
    guide: 0,
    rotation: 0,
    engaged: false,
    wire: 0,
    branch: "LAD",
    crossed: false,
    force: 0,
    resistance: 0,
    distal: false,
    position: 0,
    pressure: 0,
    balloon: { diameter: 2.5, length: 15, rbp: 14 },
    stent: { diameter: 3, length: 18, rbp: 16 },
    deployed: false,
    deployedSpec: null,
    deployedPosition: 0,
    expansion: 0,
    predilated: false,
    predilationSeconds: 0,
    rupture: false,
    dissection: 0,
    geographicMiss: false,
    residual: 90,
    flow: 0.35,
    d1: 1,
    d2: 1,
    ischemia: 0,
    hr: 72,
    bp: 124,
    st: 0,
    pvc: false,
    unstable: false,
    act: 120,
    heparin: false,
    inflation: 0,
    longestInflation: 0,
    contrast: 0,
    injections: [],
    opacification: 0,
    fluoro: false,
    fluoroTime: 0,
    projection: 0,
    finalViews: [],
    qca: false,
    message: "Advance the guide from right radial access.",
  };
}
export function compliantDiameter(spec: Spec, pressure: number): number {
  return spec.diameter * clamp(0.9 + 0.01 * pressure, 0.9, 1.2);
}
export function coverage(position: number, length: number): number {
  const a = CASE.center - CASE.length / 2,
    b = CASE.center + CASE.length / 2;
  return clamp(
    (Math.min(b, position + length / 2) - Math.max(a, position - length / 2)) /
      CASE.length,
    0,
    1,
  );
}
export function timi(flow: number): number {
  return flow >= 0.85 ? 3 : flow >= 0.45 ? 2 : flow > 0.05 ? 1 : 0;
}
export function transit(age: number, flow: number): number {
  const arrival = 0.5 + 0.8 * (1 - flow);
  return age < arrival ? 0 : Math.max(0, 1 - (age - arrival) / 3);
}
export function reduceFlow(s: State): number {
  return clamp(
    (1 - s.residual / 100) *
      (1 - s.dissection * 0.7) *
      (s.pressure > 0 ? 0.06 : 1),
    0,
    1,
  );
}
export function step(previous: State, action: Action): State {
  const s: State = structuredClone(previous);
  s.message = "";
  switch (action.type) {
    case "select":
      if (s.pressure > 0) s.message = "Deflate before changing devices.";
      else s.active = action.device;
      break;
    case "size":
      if (s.pressure > 0 || (action.device === "stent" && s.deployed)) {
        s.message = "Device sizing locked.";
        break;
      }
      if (!Number.isFinite(action.diameter) || !Number.isFinite(action.length))
        break;
      s[action.device] = {
        ...s[action.device],
        diameter: clamp(action.diameter, 1.5, 5),
        length: clamp(action.length, 8, 38),
      };
      break;
    case "branch":
      if (s.pressure > 0 || s.wire > 15)
        s.message = "Retract wire to the bifurcation before steering.";
      else s.branch = action.branch;
      break;
    case "move": {
      if (!Number.isFinite(action.delta)) break;
      if (s.pressure > 0) {
        s.message = "Movement locked while inflated.";
        break;
      }
      if (s.active === "guide") {
        s.guide = clamp(s.guide + action.delta, 0, 100);
        if (s.guide < 98) s.engaged = false;
        if (s.guide >= 98 && Math.abs(s.rotation - 20) <= 8) {
          s.engaged = true;
          s.message = "Left main selectively engaged.";
        }
      } else if (s.active === "wire") {
        if (!s.engaged) {
          s.message = "Engage the left main first.";
          break;
        }
        const blocked =
          s.branch === "LAD" &&
          s.wire >= 30 &&
          s.wire < 46 &&
          Math.abs(s.rotation - 20) > 25;
        s.resistance = blocked ? 0.9 : 0.15;
        if (blocked && action.delta > 0) {
          s.force += Math.abs(action.delta);
          s.message = "Resistance: align the wire; do not force.";
          if (s.force > 10) s.dissection = clamp(s.dissection + 0.15, 0, 1);
        } else {
          const target = clamp(s.wire + action.delta, 0, 100);
          s.wire =
            s.branch === "LAD" &&
            Math.abs(s.rotation - 20) > 25 &&
            s.wire < 30 &&
            target > 30
              ? 30
              : target;
        }
        s.distal = s.wire > 85;
        if (s.distal) s.message = "Distal wire: perforation risk. Retract.";
        if (s.branch === "LAD" && s.wire >= 48) s.crossed = true;
      } else {
        if (!s.crossed || s.branch !== "LAD") {
          s.message = "Cross the LAD lesion first.";
          break;
        }
        if (s.active === "stent" && s.deployed) {
          s.message = "Stent is permanently deployed.";
          break;
        }
        s.position = clamp(s.position + action.delta, 0, s.wire);
      }
      break;
    }
    case "rotate":
      if (s.pressure > 0) {
        s.message = "Deflate before rotation.";
        break;
      }
      s.rotation = clamp(s.rotation + action.delta, -180, 180);
      if (s.engaged && Math.abs(s.rotation - 20) > 65) {
        s.engaged = false;
        s.guide = 90;
        s.message = "Guide pop-out: excessive torque.";
      }
      break;
    case "pressure": {
      if (s.active !== "balloon" && s.active !== "stent") {
        s.message = "Select a balloon or stent.";
        break;
      }
      if (
        action.delta > 0 &&
        (!s.engaged ||
          !s.crossed ||
          s.branch !== "LAD" ||
          s.wire < s.position ||
          s.position < 10 ||
          s.rupture)
      ) {
        s.message = "Check engagement, wire and device position.";
        break;
      }
      s.pressure = clamp(s.pressure + action.delta, 0, 26);
      const spec = s[s.active];
      if (s.pressure > spec.rbp + 4) {
        s.rupture = true;
        s.pressure = 0;
        s.dissection = clamp(s.dissection + 0.35, 0, 1);
        s.message = "Balloon rupture above rated burst pressure + 4 atm.";
      }
      if (s.pressure > 0) {
        const diameter = compliantDiameter(spec, s.pressure);
        if (diameter / CASE.reference > 1.15)
          s.dissection = clamp(
            Math.max(s.dissection, (diameter / CASE.reference - 1) * 1.6),
            0,
            1,
          );
        if (s.active === "stent" && s.pressure >= 8 && !s.deployed) {
          s.deployed = true;
          s.deployedSpec = { ...spec };
          s.deployedPosition = s.position;
          s.geographicMiss = coverage(s.position, spec.length) < 1;
        }
        if (s.active === "stent" && s.deployed) {
          s.expansion = Math.max(
            s.expansion,
            clamp(diameter / CASE.reference, 0, 1),
          );
          s.residual = clamp(
            100 * (1 - s.expansion) + (s.geographicMiss ? 45 : 5),
            5,
            95,
          );
        }
      }
      if (s.pressure === 0) {
        s.inflation = 0;
        if (s.deployed) s.residual = Math.max(s.residual, 8);
        else if (s.predilated) s.residual = 55;
      }
      break;
    }
    case "heparin":
      if (!s.heparin) {
        s.heparin = true;
        s.act = 285;
        s.message = "Simulated heparin administered; ACT 285 s.";
      }
      break;
    case "qca":
      s.qca = true;
      s.message = "QCA: reference ≈3.0 mm; lesion length 14 mm.";
      break;
    case "fluoro":
      s.fluoro = action.on;
      break;
    case "projection":
      s.projection = ((action.index % 6) + 6) % 6;
      break;
    case "contrast":
      if (!s.fluoro) {
        s.message = "Enable fluoroscopy for injection.";
        break;
      }
      s.contrast += s.engaged ? 6 : 10;
      s.injections.push({
        at: s.time,
        selective: s.engaged,
        view: s.projection,
        final: s.deployed && s.pressure === 0,
      });
      s.message = s.engaged
        ? "Selective left coronary injection."
        : "Non-selective aortic injection.";
      break;
    case "tick": {
      const dt = clamp(action.dt, 0, 1);
      s.time += dt;
      if (s.fluoro) s.fluoroTime += dt;
      if (s.pressure > 0) {
        s.inflation += dt;
        s.longestInflation = Math.max(s.longestInflation, s.inflation);
        if (
          s.active === "balloon" &&
          s.pressure >= 8 &&
          coverage(s.position, s.balloon.length) > 0.9
        ) {
          s.predilationSeconds += dt;
          if (s.predilationSeconds >= 10) {
            s.predilated = true;
            s.residual = 40;
          }
        }
      }
      s.flow = reduceFlow(s);
      s.ischemia = clamp(s.ischemia + (s.flow < 0.15 ? dt : -dt * 1.5), 0, 120);
      s.st = Math.max(0, (s.ischemia - 8) * 0.09);
      s.hr = 72 + s.ischemia * 0.65;
      s.bp = 124 - s.ischemia * 0.6;
      s.pvc = s.ischemia > 25 && Math.floor(s.time) % 4 === 0;
      s.unstable = s.ischemia > 40;
      s.opacification = 0;
      for (const injection of s.injections) {
        const amount = transit(s.time - injection.at, s.flow);
        s.opacification = Math.max(
          s.opacification,
          amount * (injection.selective ? 1 : 0.25),
        );
        if (
          amount > 0 &&
          injection.final &&
          injection.selective &&
          !s.finalViews.includes(injection.view)
        )
          s.finalViews.push(injection.view);
      }
      break;
    }
  }
  s.flow = reduceFlow(s);
  s.d1 = 1;
  s.d2 =
    s.deployed &&
    s.deployedSpec &&
    s.deployedPosition + s.deployedSpec.length / 2 >= 43
      ? s.dissection > 0.3
        ? 0
        : 0.75
      : 1;
  const flags = [
    s.guide >= 98,
    s.engaged,
    s.crossed,
    s.predilated,
    s.deployed,
    s.finalViews.length >= 2,
  ];
  s.completed = s.completed.map((done, i) => done || flags[i]);
  s.stage = s.completed.findIndex((v) => !v);
  if (s.stage < 0) s.stage = 6;
  return s;
}
