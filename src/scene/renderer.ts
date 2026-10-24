import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { STRUCTURES, type AnatomyStructure } from "../config/cardiovascular";
import { createHeartModel } from "./heart";
import { createParticleModel } from "./particles";
import { createValveModel } from "./valves";
import { createVesselModel } from "./vessels";

export interface SceneController {
  render(timeSeconds: number): void;
  resetView(): void;
  dispose(): void;
}

interface LabelHandle {
  readonly structure: AnatomyStructure;
  readonly element: HTMLElement;
  readonly position: THREE.Vector3;
}

const LABEL_IDS = new Set([
  "superior-vena-cava",
  "inferior-vena-cava",
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
  "systemic-capillaries",
]);

const INITIAL_CAMERA = new THREE.Vector3(8.2, 3.4, 13.4);
const INITIAL_TARGET = new THREE.Vector3(0, -0.35, 0);

function createLabelHandles(layer: HTMLElement): readonly LabelHandle[] {
  return STRUCTURES.filter((structure) => LABEL_IDS.has(structure.id)).map(
    (structure) => {
      const element = document.createElement("span");
      element.className = `anatomy-label label-${structure.kind}`;
      element.innerHTML = `<i></i><b>${structure.shortName}</b>`;
      layer.append(element);
      return {
        structure,
        element,
        position: new THREE.Vector3(...structure.labelPosition),
      };
    },
  );
}

export function createSceneController(
  host: HTMLElement,
  labelLayer: HTMLElement,
): SceneController {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x080b0e);
  scene.fog = new THREE.FogExp2(0x080b0e, 0.025);

  const camera = new THREE.PerspectiveCamera(39, 1, 0.1, 80);
  camera.position.copy(INITIAL_CAMERA);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    powerPreference: "high-performance",
    alpha: false,
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.setAttribute("role", "img");
  renderer.domElement.setAttribute(
    "aria-label",
    "Rotatable three-dimensional educational model of the heart, pulmonary circulation, and systemic circulation with animated blood-flow particles.",
  );
  host.prepend(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(INITIAL_TARGET);
  controls.enableDamping = true;
  controls.dampingFactor = 0.065;
  controls.enablePan = false;
  controls.minDistance = 7.5;
  controls.maxDistance = 22;
  controls.minPolarAngle = 0.2;
  controls.maxPolarAngle = Math.PI - 0.25;
  controls.rotateSpeed = 0.58;
  controls.zoomSpeed = 0.68;
  controls.update();

  scene.add(new THREE.HemisphereLight(0xbfcbd2, 0x101418, 1.45));
  const key = new THREE.DirectionalLight(0xdde7eb, 3.2);
  key.position.set(6, 8, 10);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x7292a2, 2.1);
  rim.position.set(-8, 2, -7);
  scene.add(rim);
  const fill = new THREE.PointLight(0x8b6267, 1.6, 24);
  fill.position.set(-3, -1, 5);
  scene.add(fill);

  const world = new THREE.Group();
  world.name = "cardiovascular-world";
  scene.add(world);
  const vessels = createVesselModel();
  const heart = createHeartModel();
  const valves = createValveModel();
  const particles = createParticleModel(vessels.curves);
  world.add(vessels.group, heart.group, valves.group, particles.group);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(7.8, 96),
    new THREE.MeshStandardMaterial({
      color: 0x0b0f12,
      roughness: 1,
      metalness: 0,
      transparent: true,
      opacity: 0.75,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -5.75;
  floor.receiveShadow = true;
  scene.add(floor);

  const grid = new THREE.GridHelper(15, 30, 0x2c3438, 0x171d20);
  grid.position.y = -5.72;
  (grid.material as THREE.Material).transparent = true;
  (grid.material as THREE.Material).opacity = 0.22;
  scene.add(grid);

  const labels = createLabelHandles(labelLayer);
  const raycaster = new THREE.Raycaster();
  const rayDirection = new THREE.Vector3();
  const occluders = [...heart.chambers];

  function positionLabels(): void {
    const width = host.clientWidth;
    const height = host.clientHeight;
    for (const label of labels) {
      const projected = label.position.clone().project(camera);
      const withinView =
        projected.z > -1 &&
        projected.z < 1 &&
        Math.abs(projected.x) < 1.08 &&
        Math.abs(projected.y) < 1.08;
      label.element.hidden = !withinView;
      if (!withinView) continue;
      label.element.style.transform = `translate3d(${(projected.x * 0.5 + 0.5) * width}px, ${(-projected.y * 0.5 + 0.5) * height}px, 0)`;

      rayDirection.copy(label.position).sub(camera.position).normalize();
      raycaster.set(camera.position, rayDirection);
      const labelDistance = camera.position.distanceTo(label.position);
      const hit = raycaster
        .intersectObjects(occluders, false)
        .some((intersection) => intersection.distance < labelDistance - 0.12);
      label.element.classList.toggle("occluded", hit);
    }
  }

  const resizeObserver = new ResizeObserver(() => {
    const width = Math.max(1, host.clientWidth);
    const height = Math.max(1, host.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  });
  resizeObserver.observe(host);

  return {
    render(timeSeconds: number) {
      heart.update(timeSeconds);
      vessels.update(timeSeconds);
      valves.update(timeSeconds);
      particles.update(timeSeconds);
      controls.update();
      positionLabels();
      renderer.render(scene, camera);
    },
    resetView() {
      camera.position.copy(INITIAL_CAMERA);
      controls.target.copy(INITIAL_TARGET);
      controls.update();
    },
    dispose() {
      resizeObserver.disconnect();
      controls.dispose();
      particles.dispose();
      valves.dispose();
      heart.dispose();
      vessels.dispose();
      floor.geometry.dispose();
      (floor.material as THREE.Material).dispose();
      grid.geometry.dispose();
      (grid.material as THREE.Material).dispose();
      labels.forEach((label) => label.element.remove());
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
