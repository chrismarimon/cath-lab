import * as THREE from "three";
import { CENTERLINES, GUIDE_PATH, type Point } from "../config/anatomy";
export function curve(points: readonly Point[]): THREE.CatmullRomCurve3 {
  return new THREE.CatmullRomCurve3(
    points.map((p) => new THREE.Vector3(...p)),
    false,
    "centripetal",
  );
}
export function vesselGeometry(points: readonly Point[], radius: number) {
  return new THREE.TubeGeometry(curve(points), 80, radius, 12, false);
}
export function lumenGeometry(residual: number) {
  const geometry = vesselGeometry(CENTERLINES.LAD, 0.075);
  const positions = geometry.getAttribute("position");
  const path = curve(CENTERLINES.LAD);
  for (let ring = 0; ring <= 80; ring++) {
    const t = ring / 80;
    const center = path.getPointAt(t);
    const stenosis = Math.exp(-Math.pow((t - 0.38) / 0.06, 4));
    const scale = 1 - (residual / 100) * stenosis;
    for (let j = 0; j <= 12; j++) {
      const index = ring * 13 + j;
      const v = new THREE.Vector3()
        .fromBufferAttribute(positions, index)
        .sub(center)
        .multiplyScalar(scale)
        .add(center);
      positions.setXYZ(index, v.x, v.y, v.z);
    }
  }
  geometry.computeVertexNormals();
  return geometry;
}
export function createAnatomy() {
  const group = new THREE.Group();
  const vessels = new Map<string, THREE.Mesh>();
  const heart = new THREE.Mesh(
    new THREE.SphereGeometry(1, 48, 32),
    new THREE.MeshStandardMaterial({
      color: 0x622c35,
      roughness: 0.85,
      transparent: true,
      opacity: 0.68,
    }),
  );
  heart.scale.set(1.85, 2.25, 1.2);
  heart.rotation.z = -0.22;
  heart.position.set(0, -0.25, -0.3);
  group.add(heart);
  for (const [name, points] of Object.entries(CENTERLINES)) {
    const radius =
      name === "Aorta" ? 0.29 : name === "Right radial" ? 0.09 : 0.075;
    const mesh = new THREE.Mesh(
      name === "LAD" ? lumenGeometry(90) : vesselGeometry(points, radius),
      new THREE.MeshStandardMaterial({
        color: name === "Aorta" ? 0x9a555b : 0xd9867f,
        roughness: 0.6,
      }),
    );
    group.add(mesh);
    vessels.set(name, mesh);
  }
  const guide = new THREE.Mesh(
    vesselGeometry(GUIDE_PATH, 0.035),
    new THREE.MeshBasicMaterial({ color: 0x69ddec }),
  );
  group.add(guide);
  const wire = new THREE.Mesh(
    vesselGeometry(CENTERLINES.LAD, 0.018),
    new THREE.MeshBasicMaterial({ color: 0xe4ecb0 }),
  );
  group.add(wire);
  const balloon = new THREE.Mesh(
    new THREE.SphereGeometry(1, 24, 16),
    new THREE.MeshStandardMaterial({
      color: 0x66ddec,
      transparent: true,
      opacity: 0.7,
    }),
  );
  group.add(balloon);
  const stent = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.12, 0.65, 12, 8, true),
    new THREE.MeshBasicMaterial({ color: 0xc7e2e4, wireframe: true }),
  );
  group.add(stent);
  const injury = new THREE.Mesh(
    vesselGeometry(CENTERLINES.LAD.slice(1, 3), 0.13),
    new THREE.MeshBasicMaterial({ color: 0xff433f, wireframe: true }),
  );
  group.add(injury);
  return { group, heart, vessels, guide, wire, balloon, stent, injury };
}
