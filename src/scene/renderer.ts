import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { ANGLES, CENTERLINES, GUIDE_PATH } from "../config/anatomy";
import { createAnatomy, curve, lumenGeometry } from "./anatomy";
import type { State } from "../physics/model";
export function createViewport(host: HTMLElement) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b1014);
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 1, 13);
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  host.append(renderer.domElement);
  const held = document.createElement("canvas");
  held.className = "held-frame";
  host.append(held);
  const heldContext = held.getContext("2d")!;

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 0.4, 0);
  controls.enableDamping = true;
  scene.add(new THREE.AmbientLight(0xffffff, 1.6));
  const light = new THREE.DirectionalLight(0xd5f6ff, 3);
  light.position.set(4, 6, 8);
  scene.add(light);
  const anatomy = createAnatomy();
  scene.add(anatomy.group);
  const bones = new THREE.Group();
  const boneMat = new THREE.MeshBasicMaterial({
    color: 0x777777,
    transparent: true,
    opacity: 0.22,
  });
  for (let i = 0; i < 9; i++) {
    const y = 3.7 - i * 0.7;
    for (const sign of [-1, 1]) {
      const path = curve([
        [sign * 0.3, y, -1.5],
        [sign * 2, y - 0.1, -0.5],
        [sign * 3, y - 0.6, 0],
        [sign * 2.1, y - 1, 0.4],
      ]);
      bones.add(
        new THREE.Mesh(
          new THREE.TubeGeometry(path, 40, 0.065, 6, false),
          boneMat,
        ),
      );
    }
    const vertebra = new THREE.Mesh(
      new THREE.BoxGeometry(0.35, 0.45, 0.25),
      boneMat,
    );
    vertebra.position.set(0, y, -1.6);
    bones.add(vertebra);
  }
  bones.add(
    new THREE.Mesh(
      new THREE.TubeGeometry(
        curve([
          [-3, -3, -1],
          [-1.5, -2.5, -1],
          [0, -2.8, -1],
          [1.5, -2.4, -1],
          [3, -3, -1],
        ]),
        50,
        0.08,
        6,
        false,
      ),
      boneMat,
    ),
  );
  scene.add(bones);
  const labelLayer = document.createElement("div");
  labelLayer.className = "labels";
  host.append(labelLayer);
  const labels = Object.entries(CENTERLINES).map(([name, points]) => {
    const el = document.createElement("span");
    el.textContent = name;
    labelLayer.append(el);
    return {
      el,
      p: new THREE.Vector3(...points[Math.floor(points.length / 2)]),
    };
  });
  const ray = new THREE.Raycaster();
  let lastPulse = -1;
  let projection = -1;
  let angleOffset = [0, 0];
  let lastResidual = 90;
  let lastBranch = "LAD";
  let lastEngaged = false;
  let previousTime = 0;
  const resize = new ResizeObserver(() => {
    const { width, height } = host.getBoundingClientRect();
    renderer.setSize(width, height);
    camera.aspect = width / Math.max(1, height);
    camera.updateProjectionMatrix();
  });
  resize.observe(host);
  return {
    adjust: (x: number, y: number) => {
      angleOffset = [angleOffset[0] + x, angleOffset[1] + y];
      projection = -1;
    },
    render: (
      s: State,
      fluoro: boolean,
      showLabels: boolean,
      follow: boolean,
    ) => {
      if (s.time < previousTime) {
        heldContext.clearRect(0, 0, held.width, held.height);
        lastPulse = -1;
        projection = -1;
      }
      previousTime = s.time;
      host.classList.toggle("fluoro", fluoro);
      renderer.domElement.hidden = fluoro;
      held.hidden = !fluoro;
      bones.visible = fluoro;
      labelLayer.hidden = !showLabels || fluoro;
      if (fluoro && !s.fluoro) return; // Preserve the last exposed frame, including camera and anatomy.
      if (fluoro && Math.floor(s.time * 15) === lastPulse) return;
      lastPulse = Math.floor(s.time * 15);
      if (fluoro && projection !== s.projection) {
        projection = s.projection;
        const a = ANGLES[s.projection];
        const yaw = THREE.MathUtils.degToRad(a[0] + angleOffset[0]),
          pitch = THREE.MathUtils.degToRad(a[1] + angleOffset[1]);
        camera.position.set(
          Math.sin(yaw) * 12,
          Math.sin(pitch) * 10,
          Math.cos(yaw) * 12,
        );
        controls.target.set(0, 0, 0);
      }
      if (s.residual !== lastResidual) {
        const lad = anatomy.vessels.get("LAD")!;
        lad.geometry.dispose();
        lad.geometry = lumenGeometry(s.residual);
        lastResidual = s.residual;
      }
      const beat = 1 + Math.sin(((s.time * s.hr) / 60) * Math.PI * 2) * 0.016;
      anatomy.heart.scale.set(1.85 * beat, 2.25 * beat, 1.2 * beat);
      anatomy.heart.visible = !fluoro;
      if (lastEngaged !== s.engaged) {
        anatomy.guide.geometry.dispose();
        anatomy.guide.geometry = new THREE.TubeGeometry(
          curve(
            s.engaged
              ? [...GUIDE_PATH, ...CENTERLINES.LM.slice(1)]
              : GUIDE_PATH,
          ),
          100,
          0.035,
          8,
          false,
        );
        lastEngaged = s.engaged;
      }
      anatomy.guide.geometry.setDrawRange(
        0,
        Math.floor((anatomy.guide.geometry.index!.count * s.guide) / 100 / 6) *
          6,
      );
      const wireCurve = curve(CENTERLINES[s.branch]);
      if (lastBranch !== s.branch) {
        anatomy.wire.geometry.dispose();
        anatomy.wire.geometry = new THREE.TubeGeometry(
          wireCurve,
          80,
          0.018,
          6,
          false,
        );
        lastBranch = s.branch;
      }
      anatomy.wire.geometry.setDrawRange(
        0,
        Math.floor((anatomy.wire.geometry.index!.count * s.wire) / 100 / 6) * 6,
      );
      anatomy.wire.visible = s.wire > 0;
      const point = curve(CENTERLINES.LAD).getPointAt(
        Math.min(1, s.position / 100),
      );
      const tangent = curve(CENTERLINES.LAD).getTangentAt(
        Math.min(1, s.position / 100),
      );
      anatomy.balloon.position.copy(point);
      anatomy.balloon.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        tangent,
      );
      anatomy.balloon.scale.set(
        s.pressure > 0 ? 0.12 : 0.04,
        0.32,
        s.pressure > 0 ? 0.12 : 0.04,
      );
      anatomy.balloon.visible =
        s.position > 0 && (s.active === "balloon" || s.active === "stent");
      anatomy.stent.visible = s.deployed;
      anatomy.stent.position.copy(
        curve(CENTERLINES.LAD).getPointAt(s.deployedPosition / 100),
      );
      anatomy.stent.quaternion.copy(anatomy.balloon.quaternion);
      anatomy.injury.visible = s.dissection > 0;
      for (const [name, mesh] of anatomy.vessels) {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        const contrast = s.opacification * (name === "D2" ? s.d2 : 1);
        mat.color.set(
          fluoro
            ? new THREE.Color().setScalar(0.55 - contrast * 0.5)
            : contrast > 0.1
              ? 0x67dbe3
              : name === "Aorta"
                ? 0x9a555b
                : 0xd9867f,
        );
      }
      if (follow && !fluoro) {
        const tip =
          s.active === "guide"
            ? curve(GUIDE_PATH).getPointAt(s.guide / 100)
            : wireCurve.getPointAt(s.wire / 100);
        controls.target.lerp(tip, 0.06);
      }
      controls.update();
      for (const label of labels) {
        const projected = label.p.clone().project(camera);
        label.el.style.left = `${(projected.x * 0.5 + 0.5) * host.clientWidth}px`;
        label.el.style.top = `${(-projected.y * 0.5 + 0.5) * host.clientHeight}px`;
        ray.set(
          camera.position,
          label.p.clone().sub(camera.position).normalize(),
        );
        const hit = ray.intersectObject(anatomy.heart)[0];
        label.el.style.opacity =
          hit && hit.distance < camera.position.distanceTo(label.p)
            ? "0.24"
            : "0.85";
        label.el.hidden = projected.z > 1;
      }
      renderer.render(scene, camera);
      if (fluoro) {
        (host.querySelector(".noise") as HTMLElement).style.backgroundPosition =
          `${Math.floor(s.time * 15) * 17}px ${Math.floor(s.time * 15) * 31}px`;
        held.width = renderer.domElement.width;
        held.height = renderer.domElement.height;
        heldContext.drawImage(renderer.domElement, 0, 0);
      }
    },
    dispose: () => {
      resize.disconnect();
      controls.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          const materials = Array.isArray(obj.material)
            ? obj.material
            : [obj.material];
          materials.forEach((m) => m.dispose());
        }
      });
      renderer.dispose();
    },
  };
}
