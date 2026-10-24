import "./style.css";
import { validateAnatomy } from "./model/anatomy";
import { phaseAtTime } from "./model/circulation";
import { createSceneController, type SceneController } from "./scene/renderer";
import { createInterface } from "./ui/interface";

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("Application root not found.");

const anatomy = validateAnatomy();
if (!anatomy.valid) {
  throw new Error(
    `Invalid cardiovascular model: ${anatomy.missingStructures.join(", ")}`,
  );
}

const ui = createInterface(root);
let sceneController: SceneController | null = null;
let animationFrame = 0;
let startTime = performance.now();
let lastPhaseId = "";

try {
  sceneController = createSceneController(ui.viewport, ui.labels);
} catch (error) {
  ui.fallback.hidden = false;
  ui.resetButton.hidden = true;
  console.error("Unable to initialize the 3D cardiovascular scene.", error);
}

ui.resetButton.addEventListener("click", () => sceneController?.resetView());

function animate(now: number): void {
  const elapsed = (now - startTime) / 1000;
  const phase = phaseAtTime(elapsed);
  if (phase.id !== lastPhaseId) {
    lastPhaseId = phase.id;
    ui.updatePhase(phase);
  }
  sceneController?.render(elapsed);
  animationFrame = requestAnimationFrame(animate);
}

animationFrame = requestAnimationFrame(animate);

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    cancelAnimationFrame(animationFrame);
    sceneController?.dispose();
    startTime = performance.now();
  });
}
