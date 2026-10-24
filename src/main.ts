import "./style.css";
import { STAGES, PROJECTIONS } from "./config/anatomy";
import { timi, type Device, type Branch, type Action } from "./physics/model";
import { createStore } from "./state/store";
import { createViewport } from "./scene/renderer";
import { demoActions } from "./procedure/demo";
import { debrief } from "./procedure/debrief";
const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `
<header><div class="brand"><b>RADIAL<span> / </span>PCI</b><small>PROCEDURE LAB · EDUCATIONAL MODEL</small></div><div id="hud"></div><button id="pause">Pause</button><button id="help">? Help</button></header>
<main><aside class="steps"><div class="eyebrow">CASE 001 · RIGHT RADIAL</div><h2>Mid-LAD intervention</h2><p>68 years · 80 kg<br>Exertional angina · anterior ischemia</p><div class="case-data"><b>90%</b> stenosis <b>14 mm</b> length<br>Reference diameter ≈ 3.0 mm</div><h3>PROCEDURAL SEQUENCE</h3><ol id="steps"></ol><button id="qca">Measure / QCA</button><button id="heparin">Heparin · simulated dose</button><button id="finish">End case / debrief</button></aside>
<section class="center"><div class="viewbar"><div><b id="view-title">ANATOMY</b> <span id="exposure">LIVE 3D</span></div><button id="view">Switch view [Tab]</button></div><div id="viewport"><div class="collimation"></div><div class="noise"></div><div class="view-meta"><span id="projection-label"></span><span>SCHEMATIC · NOT TO SCALE</span></div><div id="render-error" hidden></div></div><div class="projection"><select id="projection" aria-label="Projection">${PROJECTIONS.map((p, i) => `<option value="${i}">${p}</option>`).join("")}</select><button id="labels">Labels [L]</button><button id="follow">Follow tip [F]</button></div><div id="mentor" class="mentor"></div><section class="monitor"><div><small>II · SYNTHETIC ECG</small><canvas id="ecg"></canvas></div><div id="vitals"></div></section></section>
<aside class="console"><div class="eyebrow">DEVICE CONSOLE</div><h2 id="device-title">Guide catheter</h2><label>Device<select id="device">${["guide", "wire", "balloon", "stent"].map((d) => `<option>${d}</option>`).join("")}</select></label><label>Wire target<select id="branch">${["LAD", "LCx", "D1", "D2"].map((d) => `<option>${d}</option>`).join("")}</select></label><div class="sizes"><label>Diameter / mm<input id="diameter" type="number" step="0.25" min="1.5" max="5" value="2.5"></label><label>Length / mm<input id="length" type="number" step="1" min="8" max="38" value="15"></label></div><button id="size">Apply device dimensions</button><div id="instrument"></div><div class="button-grid"><button data-move="-2">− Retract [S]</button><button data-move="2">Advance [W] +</button><button data-rotate="-5">↶ Rotate [A]</button><button data-rotate="5">Rotate [D] ↷</button><button data-pressure="-1">Deflate [Q]</button><button data-pressure="1">Inflate [E]</button></div><p class="hint">Hold Shift for fine movement. Wire resistance requires alignment. Engage near 100% guide travel and +20° rotation.</p><button id="contrast">Inject contrast [C]</button><button id="fluoro">Exposure on / off [Space]</button><button id="sound">Sound off [N]</button></aside></main>
<footer><div class="dock" id="dock">${["guide", "wire", "balloon", "stent"].map((d, i) => `<button data-device="${d}"><small>0${i + 1}</small> ${d.toUpperCase()}</button>`).join("")}<button id="demo">Run ideal demonstration</button><button id="mentor-toggle">Mentor [M]</button></div><p>For education and demonstration only. Not for clinical training or medical advice.</p></footer>
<dialog id="start"><div class="eyebrow">INTERACTIVE CASE · 001</div><h1>Right radial.<br>Mid-LAD. <span>One procedure.</span></h1><p>Explore a schematic catheter pathway, device behavior and the consequences of procedural decisions.</p><div class="case-data">68-year-old · exertional angina · anterior ischemia<br>90% mid-LAD lesion · 14 mm · ≈3 mm vessel</div><p class="warning">For education and demonstration only. Not for clinical training or medical advice.</p><button id="begin">Begin manual case</button><button id="begin-demo">Watch ideal demonstration</button></dialog>
<dialog id="help-dialog"><h2>Controls & teaching rules</h2><p>W/S advance/retract · A/D rotate · Shift fine movement<br>E/Q inflate/deflate · Space exposure toggle · C contrast<br>G heparin · Tab view · V projection · Arrows projection adjustment<br>L labels · F follow · M mentor · N sound · H help · Esc pause</p><p>Advance guide to 100%, rotate to +20°, then fine advance to engage. Select wire, keep +20° alignment, advance beyond 48. Select balloon, advance device center to 38, and use QCA to size. Inflate a 2.5 × 15 mm balloon to 10 atm for about 12 s, deflate; select 3 × 18 mm stent and inflate to 12 atm, then deflate. Obtain two distinct selective views with exposure on.</p><p>Rotation beyond ±65° from engagement causes pop-out. Retract wire to ≤15 before changing target. Selective contrast arrives after a modeled transit delay. All numbers are invented teaching approximations.</p><button id="close-help">Return to case</button></dialog><dialog id="debrief"><div id="report"></div><button id="export">Export JSON</button><button id="close-report">Return</button><button id="reset">New case</button></dialog><div id="paused" hidden>PAUSED · Escape to resume</div>`;
const el = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const store = createStore();
let paused = true,
  fluoroView = false,
  labels = true,
  follow = false,
  mentor = true,
  sound = false,
  demo: Action[] | null = null,
  demoIndex = 0,
  demoAccumulator = 0;
let viewport: ReturnType<typeof createViewport> | null = null;
try {
  viewport = createViewport(el("viewport"));
} catch (error) {
  el("render-error").hidden = false;
  el("render-error").textContent =
    `WebGL unavailable. Procedural controls remain available. ${error instanceof Error ? error.message : ""}`;
}
let playingAction = false;
const dispatch = (a: Action) => {
  if (!paused && (!demo || playingAction)) store.dispatch(a);
};
const button = (id: string, fn: () => void) =>
  el(id).addEventListener("click", fn);
function reset() {
  store.reset();
  demo = null;
  demoIndex = 0;
  paused = false;
}
function startDemo() {
  reset();
  if (!fluoroView) toggleView();
  demoAccumulator = 0;
  demo = demoActions();
}
function togglePause() {
  paused = !paused;
  el("paused").hidden = !paused;
  el("pause").textContent = paused ? "Resume" : "Pause";
}
function setDevice(d: Device) {
  dispatch({ type: "select", device: d });
  const s = store.get();
  el<HTMLSelectElement>("device").value = s.active;
  if (d === "balloon" || d === "stent") {
    el<HTMLInputElement>("diameter").value = String(s[d].diameter);
    el<HTMLInputElement>("length").value = String(s[d].length);
  }
}
function toggleView() {
  fluoroView = !fluoroView;
  el("view-title").textContent = fluoroView ? "FLUOROSCOPY" : "ANATOMY";
}
let audio: AudioContext | null = null;
let nextBeat = 0;
function tone(freq: number, duration: number, gain: number) {
  if (!audio) return;
  const o = audio.createOscillator(),
    g = audio.createGain();
  o.frequency.value = freq;
  g.gain.setValueAtTime(gain, audio.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + duration);
  o.connect(g).connect(audio.destination);
  o.start();
  o.stop(audio.currentTime + duration);
}
function toggleSound() {
  sound = !sound;
  if (sound) {
    audio ??= new AudioContext();
    void audio.resume();
  }
  el("sound").textContent = `Sound ${sound ? "on" : "off"} [N]`;
}
button("begin", () => {
  el<HTMLDialogElement>("start").close();
  paused = false;
});
button("begin-demo", () => {
  el<HTMLDialogElement>("start").close();
  startDemo();
});
button("demo", startDemo);
button("pause", togglePause);
button("help", () => {
  paused = true;
  el<HTMLDialogElement>("help-dialog").showModal();
});
button("close-help", () => {
  el<HTMLDialogElement>("help-dialog").close();
  paused = false;
});
button("view", toggleView);
button("heparin", () => dispatch({ type: "heparin" }));
button("qca", () => dispatch({ type: "qca" }));
button("contrast", () => dispatch({ type: "contrast" }));
button("fluoro", () => dispatch({ type: "fluoro", on: !store.get().fluoro }));
button("labels", () => (labels = !labels));
button("follow", () => (follow = !follow));
button("mentor-toggle", () => (mentor = !mentor));
button("sound", toggleSound);
el<HTMLSelectElement>("device").onchange = (e) =>
  setDevice((e.target as HTMLSelectElement).value as Device);
el<HTMLSelectElement>("branch").onchange = (e) =>
  dispatch({
    type: "branch",
    branch: (e.target as HTMLSelectElement).value as Branch,
  });
el<HTMLSelectElement>("projection").onchange = (e) =>
  dispatch({
    type: "projection",
    index: Number((e.target as HTMLSelectElement).value),
  });
button("size", () => {
  const d = store.get().active;
  if (d === "balloon" || d === "stent")
    dispatch({
      type: "size",
      device: d,
      diameter: el<HTMLInputElement>("diameter").valueAsNumber,
      length: el<HTMLInputElement>("length").valueAsNumber,
    });
});
document
  .querySelectorAll<HTMLButtonElement>("[data-device]")
  .forEach((b) => (b.onclick = () => setDevice(b.dataset.device as Device)));
for (const kind of ["move", "rotate", "pressure"] as const)
  document
    .querySelectorAll<HTMLButtonElement>(`[data-${kind}]`)
    .forEach(
      (b) =>
        (b.onclick = () =>
          dispatch({ type: kind, delta: Number(b.dataset[kind]) })),
    );
function showReport() {
  paused = true;
  const r = debrief(store.get());
  el("report").innerHTML =
    `<div class="eyebrow">CASE DEBRIEF</div><h1>${r.score}<small>/100</small> · ${r.grade}</h1><div class="report-grid">${Object.entries(
      r,
    )
      .filter(([k]) => k !== "explanations")
      .map(
        ([k, v]) =>
          `<div><small>${k.replace(/([A-Z])/g, " $1")}</small><b>${typeof v === "number" ? Number(v.toFixed(2)) : v ? "Yes" : "No"}</b></div>`,
      )
      .join("")}</div>${r.explanations.map((t) => `<p>${t}</p>`).join("")}`;
  el<HTMLDialogElement>("debrief").showModal();
}
button("finish", showReport);
button("close-report", () => {
  el<HTMLDialogElement>("debrief").close();
  paused = false;
});
button("reset", () => {
  el<HTMLDialogElement>("debrief").close();
  reset();
});
button("export", () => {
  const url = URL.createObjectURL(
    new Blob(
      [
        JSON.stringify(
          {
            disclaimer:
              "For education and demonstration only. Not for clinical training or medical advice.",
            ...debrief(store.get()),
          },
          null,
          2,
        ),
      ],
      { type: "application/json" },
    ),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "pci-case-debrief.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
for (const dialog of document.querySelectorAll("dialog"))
  dialog.addEventListener("cancel", (e) => {
    e.preventDefault();
    if (dialog.id !== "start") {
      dialog.close();
      paused = false;
    }
  });
window.addEventListener("keydown", (e) => {
  if (
    (e.target instanceof Element &&
      e.target.matches("input,select,textarea")) ||
    el<HTMLDialogElement>("start").open
  )
    return;
  const key = e.key.toLowerCase();
  if (
    ["tab", " ", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(
      key,
    )
  )
    e.preventDefault();
  if (key === "escape") {
    if (!document.querySelector("dialog[open]")) togglePause();
    return;
  }
  if (key === "h") {
    el("help").click();
    return;
  }
  if (paused) return;
  const delta = e.shiftKey ? 0.25 : 2;
  const actions: Record<string, () => void> = {
    w: () => dispatch({ type: "move", delta }),
    s: () => dispatch({ type: "move", delta: -delta }),
    a: () => dispatch({ type: "rotate", delta: -delta * 2.5 }),
    d: () => dispatch({ type: "rotate", delta: delta * 2.5 }),
    e: () => dispatch({ type: "pressure", delta: 1 }),
    q: () => dispatch({ type: "pressure", delta: -1 }),
    " ": () => el("fluoro").click(),
    c: () => dispatch({ type: "contrast" }),
    g: () => dispatch({ type: "heparin" }),
    tab: toggleView,
    v: () =>
      dispatch({ type: "projection", index: store.get().projection + 1 }),
    l: () => (labels = !labels),
    f: () => (follow = !follow),
    m: () => (mentor = !mentor),
    n: toggleSound,
    arrowleft: () => viewport?.adjust(-5, 0),
    arrowright: () => viewport?.adjust(5, 0),
    arrowup: () => viewport?.adjust(0, 5),
    arrowdown: () => viewport?.adjust(0, -5),
  };
  actions[key]?.();
});
const mentors = [
  "Advance the guide along the right radial pathway to the aortic root.",
  "At the root, use fine advancement and rotation near +20° to engage the left main.",
  "Select the coronary wire. Align near +20° and cross the mid-LAD lesion without forcing.",
  "Measure using QCA. Position a 2.5 × 15 mm balloon at 38 mm; inflate to 10 atm for about 12 seconds.",
  "Deflate fully. Use a 3.0 × 18 mm stent at 38 mm. Deploy at 12 atm, then deflate.",
  "Obtain selective contrast injections in two distinct projections, with exposure enabled.",
  "All six stages completed. Review your debrief.",
];
let lastMessage = "";
function update() {
  const s = store.get();
  if (s.message) lastMessage = s.message;
  el("hud").innerHTML =
    `<span>ACT <b class="${s.heparin ? "good" : "caution"}">${s.act} s</b></span><span>TIMI <b>${timi(s.flow)}</b></span><span>CONTRAST <b>${s.contrast} mL</b></span><span>FLUORO <b>${s.fluoroTime.toFixed(1)} s</b></span>`;
  el("steps").innerHTML = STAGES.map(
    (t, i) =>
      `<li class="${s.completed[i] ? "done" : i === s.stage ? "active" : ""}"><span>${s.completed[i] ? "✓" : i + 1}</span>${t}</li>`,
  ).join("");
  el("pause").textContent = paused ? "Resume" : "Pause";
  el("device-title").textContent = s.active.toUpperCase();
  el("instrument").innerHTML =
    `<div class="pressure">${s.pressure}<small> atm</small></div><div>Guide ${s.guide.toFixed(1)}% · ${s.engaged ? "ENGAGED" : "UNSEATED"}</div><div>Rotation ${s.rotation.toFixed(1)}° · wire ${s.wire.toFixed(1)} mm</div><div>Device center ${s.position.toFixed(1)} mm</div><div>${s.active === "balloon" || s.active === "stent" ? `${s[s.active].diameter} × ${s[s.active].length} mm · RBP ${s[s.active].rbp} atm` : ""}</div><div>Inflation ${s.inflation.toFixed(1)} s</div><div>Resistance ${(s.resistance * 100).toFixed(0)}% · flow ${(s.flow * 100).toFixed(0)}%</div><div class="${s.dissection || s.rupture ? "danger" : ""}">${s.rupture ? "RUPTURE" : s.dissection ? "DISSECTION" : s.pressure > 0 ? "MOVEMENT LOCKED" : "SYSTEM READY"}</div>`;
  el("mentor").hidden = !mentor;
  el("mentor").innerHTML =
    `<small>MENTOR / ${Math.min(6, s.stage + 1)} OF 6 ${demo ? "· DEMONSTRATION" : ""}</small><p>${mentors[s.stage]}</p><span>${lastMessage}</span>`;
  el("vitals").innerHTML =
    `<div class="good"><small>HR</small><b>${Math.round(s.hr)}</b></div><div><small>BP / mmHg</small><b>${Math.round(s.bp)}/${Math.round(s.bp * 0.6)}</b></div><div class="${s.st > 0.5 ? "danger" : "good"}"><small>ST / mV</small><b>${s.st.toFixed(2)}</b></div><div><small>RHYTHM</small><b>${s.unstable ? "UNSTABLE" : s.pvc ? "PVC" : "SINUS"}</b></div>`;
  el("exposure").textContent = fluoroView
    ? s.fluoro
      ? "EXPOSING · 15 PPS"
      : "LAST IMAGE HOLD"
    : "LIVE 3D";
  el("projection-label").textContent = PROJECTIONS[s.projection];
  el<HTMLSelectElement>("projection").value = String(s.projection);
  el<HTMLSelectElement>("device").value = s.active;
  el<HTMLSelectElement>("branch").value = s.branch;
  document
    .querySelectorAll<HTMLButtonElement>("[data-device]")
    .forEach((b) =>
      b.classList.toggle("selected", b.dataset.device === s.active),
    );
  el("fluoro").classList.toggle("selected", s.fluoro);
  el("paused").hidden =
    !paused || Boolean(document.querySelector("dialog[open]"));
}
const canvas = el<HTMLCanvasElement>("ecg"),
  ctx = canvas.getContext("2d")!;
function drawEcg() {
  const s = store.get();
  canvas.width = Math.max(100, canvas.clientWidth * devicePixelRatio);
  canvas.height = 75 * devicePixelRatio;
  ctx.scale(devicePixelRatio, devicePixelRatio);
  const w = canvas.clientWidth;
  ctx.strokeStyle = "#183029";
  ctx.lineWidth = 0.5;
  for (let x = 0; x < w; x += 20) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 75);
    ctx.stroke();
  }
  ctx.strokeStyle = "#60e2a2";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let x = 0; x < w; x++) {
    const t = ((((x / w) * 4 + s.time) * s.hr) / 60) % 1;
    const gauss = (c: number, v: number) => Math.exp(-(((t - c) / v) ** 2));
    const y =
      40 -
      (gauss(0.16, 0.035) * 4 -
        gauss(0.28, 0.012) * 8 +
        gauss(0.3, 0.012) * 28 -
        gauss(0.325, 0.014) * 12 +
        gauss(0.58, 0.08) * 8 +
        (t > 0.35 && t < 0.5 ? s.st * 3 : 0)) *
        (s.pvc ? 1.3 : 1);
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
}
let previous = performance.now(),
  uiTimer = 0;
function frame(now: number) {
  const dt = Math.min((now - previous) / 1000, 0.1);
  previous = now;
  if (!paused) {
    if (demo) {
      demoAccumulator += dt;
      while (demo && demoIndex < demo.length) {
        const a = demo[demoIndex];
        if (a.type === "tick") {
          if (demoAccumulator < a.dt) break;
          demoAccumulator -= a.dt;
        }
        playingAction = true;
        dispatch(a);
        playingAction = false;
        demoIndex++;
        if (demoIndex === demo.length) {
          demo = null;
          showReport();
        }
      }
    } else dispatch({ type: "tick", dt });
    const s = store.get();
    if (sound && s.time >= nextBeat) {
      tone(
        s.unstable ? 320 : 850,
        s.unstable ? 0.2 : 0.07,
        s.unstable ? 0.06 : 0.025,
      );
      nextBeat = s.time + 60 / s.hr;
    }
  }
  viewport?.render(store.get(), fluoroView, labels, follow);
  uiTimer += dt;
  if (uiTimer > 0.1) {
    uiTimer = 0;
    update();
    drawEcg();
  }
  requestAnimationFrame(frame);
}
update();
el<HTMLDialogElement>("start").showModal();
requestAnimationFrame(frame);
