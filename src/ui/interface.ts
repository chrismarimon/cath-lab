import {
  CIRCULATION_STAGES,
  PHASES,
  STRUCTURE_BY_ID,
  type CirculationPhase,
} from "../config/cardiovascular";

export interface InterfaceElements {
  readonly viewport: HTMLElement;
  readonly labels: HTMLElement;
  readonly resetButton: HTMLButtonElement;
  readonly fallback: HTMLElement;
  readonly phaseTitle: HTMLElement;
  readonly phaseSummary: HTMLElement;
  readonly phaseMarker: HTMLElement;
  updatePhase(phase: CirculationPhase): void;
}

const DISCLAIMER =
  "For education and demonstration only. Not for clinical training or medical advice.";

function pathwayMarkup(): string {
  const compactIds = [
    "systemic-veins",
    "right-atrium",
    "tricuspid-valve",
    "right-ventricle",
    "pulmonary-artery",
    "lungs",
    "pulmonary-veins",
    "left-atrium",
    "mitral-valve",
    "left-ventricle",
    "aorta",
    "systemic-arteries",
    "systemic-capillaries",
  ];
  return compactIds
    .map((id, index) => {
      const name = STRUCTURE_BY_ID.get(id)?.shortName ?? id;
      const arrow =
        index < compactIds.length - 1
          ? '<span aria-hidden="true">›</span>'
          : "";
      return `<li>${name}${arrow}</li>`;
    })
    .join("");
}

export function createInterface(root: HTMLElement): InterfaceElements {
  root.innerHTML = `
    <div class="app-shell">
      <header class="topbar">
        <div class="identity">
          <span class="identity-mark" aria-hidden="true"></span>
          <div>
            <div class="eyebrow">ANATOMY VIEWER · CARDIOVASCULAR</div>
            <h1>Cardiovascular Flow <span>— 3D Anatomy Viewer</span></h1>
          </div>
        </div>
        <div class="model-status"><span></span>EDUCATIONAL MODEL</div>
        <p class="top-disclaimer">${DISCLAIMER}</p>
      </header>

      <main class="workspace">
        <section class="viewport-panel" aria-labelledby="viewer-heading">
          <div class="viewport-header">
            <div>
              <div class="eyebrow">VOLUME RENDER · SIMPLIFIED ANATOMY</div>
              <h2 id="viewer-heading">Heart and circulation</h2>
            </div>
            <div class="orientation" aria-hidden="true"><b>A</b><span>R</span><span>L</span></div>
          </div>

          <div id="viewport" class="viewport">
            <div class="viewport-grid" aria-hidden="true"></div>
            <div id="anatomy-labels" class="anatomy-labels" aria-hidden="true"></div>
            <div class="viewport-readout" aria-hidden="true">
              <span>3D · ANTERIOR OBLIQUE</span>
              <span>SCHEMATIC / NOT TO SCALE</span>
            </div>
            <div class="scale-reference" aria-hidden="true"><i></i><span>ORIENTATION ONLY</span></div>
            <div id="webgl-fallback" class="webgl-fallback" hidden>
              <strong>3D view unavailable</strong>
              <p>This browser could not initialize WebGL. The circulation reference remains available.</p>
            </div>
            <button id="reset-view" class="reset-view" type="button" aria-label="Reset three-dimensional heart view">
              <svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4.6 8.2A8 8 0 1 1 4 15M4.6 8.2V3.8m0 4.4H9"/></svg>
              Reset view
            </button>
          </div>

          <div class="viewport-footer">
            <div><span class="mouse-icon" aria-hidden="true"></span><b>Drag</b> rotate</div>
            <div><span class="scroll-icon" aria-hidden="true"></span><b>Scroll / pinch</b> zoom</div>
            <div class="render-state"><span></span>LIVE FLOW</div>
          </div>
        </section>

        <aside class="information" aria-label="Circulation reference">
          <section class="phase-card" aria-live="polite">
            <div class="section-heading">
              <div>
                <div class="eyebrow">ACTIVE FLOW PHASE</div>
                <h2 id="phase-title">${PHASES[0].title}</h2>
              </div>
              <span id="phase-marker" class="phase-marker phase-deoxygenated">01</span>
            </div>
            <p id="phase-summary">${PHASES[0].summary}</p>
            <div class="phase-track" aria-hidden="true">
              ${PHASES.map((phase, index) => `<i data-phase="${phase.id}" class="${index === 0 ? "active" : ""}"></i>`).join("")}
            </div>
          </section>

          <section class="legend-card">
            <div class="eyebrow">FLOW LEGEND</div>
            <div class="legend-row"><span class="swatch venous"></span><div><b>Deoxygenated</b><small>Systemic return → lungs</small></div></div>
            <div class="legend-row"><span class="swatch arterial"></span><div><b>Oxygenated</b><small>Lungs → systemic tissues</small></div></div>
            <div class="legend-row"><span class="swatch exchange"></span><div><b>Exchange</b><small>Pulmonary and tissue transition</small></div></div>
          </section>

          <section class="pathway-card">
            <div class="section-heading compact">
              <div>
                <div class="eyebrow">CIRCULATION PATHWAY</div>
                <h2>One continuous circuit</h2>
              </div>
              <span class="loop-icon" aria-hidden="true">∞</span>
            </div>
            <ol class="pathway">${pathwayMarkup()}</ol>
          </section>

          <section class="clinical-notes">
            <div class="eyebrow">ORIENTATION NOTES</div>
            <dl>
              <div><dt>Right heart</dt><dd>Receives deoxygenated blood and sends it to the lungs.</dd></div>
              <div><dt>Pulmonary</dt><dd>Carries blood between the heart and lungs.</dd></div>
              <div><dt>Left heart</dt><dd>Receives oxygenated blood and sends it to the body.</dd></div>
              <div><dt>Systemic</dt><dd>Carries blood between the heart and body tissues.</dd></div>
              <div><dt>Valves</dt><dd>Maintain one-way flow through the chambers.</dd></div>
            </dl>
          </section>
        </aside>
      </main>

      <footer class="statusbar">
        <span><b>MODEL</b> CV-FLOW / 01</span>
        <span><b>RENDER</b> PROCEDURAL THREE.JS</span>
        <span><b>DATA</b> NO PATIENT DATA</span>
        <p>${DISCLAIMER}</p>
      </footer>
    </div>
  `;

  const viewport = root.querySelector<HTMLElement>("#viewport");
  const labels = root.querySelector<HTMLElement>("#anatomy-labels");
  const resetButton = root.querySelector<HTMLButtonElement>("#reset-view");
  const fallback = root.querySelector<HTMLElement>("#webgl-fallback");
  const phaseTitle = root.querySelector<HTMLElement>("#phase-title");
  const phaseSummary = root.querySelector<HTMLElement>("#phase-summary");
  const phaseMarker = root.querySelector<HTMLElement>("#phase-marker");

  if (
    !viewport ||
    !labels ||
    !resetButton ||
    !fallback ||
    !phaseTitle ||
    !phaseSummary ||
    !phaseMarker
  ) {
    throw new Error("Failed to initialize the cardiovascular interface.");
  }

  return {
    viewport,
    labels,
    resetButton,
    fallback,
    phaseTitle,
    phaseSummary,
    phaseMarker,
    updatePhase(phase: CirculationPhase) {
      const index = PHASES.findIndex((item) => item.id === phase.id);
      phaseTitle.textContent = phase.title;
      phaseSummary.textContent = phase.summary;
      phaseMarker.textContent = String(index + 1).padStart(2, "0");
      phaseMarker.className = `phase-marker phase-${phase.oxygenation}`;
      root.querySelectorAll<HTMLElement>(".phase-track i").forEach((marker) => {
        marker.classList.toggle("active", marker.dataset.phase === phase.id);
      });
    },
  };
}

export const PATHWAY_STEP_COUNT = CIRCULATION_STAGES.length;
