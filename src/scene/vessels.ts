import * as THREE from "three";
import {
  COLORS,
  FLOW_SEGMENTS,
  type FlowSegment,
  type Oxygenation,
  type Point3,
} from "../config/cardiovascular";

export interface VesselModel {
  readonly group: THREE.Group;
  readonly curves: ReadonlyMap<string, THREE.CatmullRomCurve3>;
  update(timeSeconds: number): void;
  dispose(): void;
}

export function curveFromPoints(
  points: readonly Point3[],
): THREE.CatmullRomCurve3 {
  return new THREE.CatmullRomCurve3(
    points.map((point) => new THREE.Vector3(...point)),
    false,
    "centripetal",
  );
}

export function createVesselGeometry(
  points: readonly Point3[],
  radius: number,
  tubularSegments = 72,
): THREE.TubeGeometry {
  return new THREE.TubeGeometry(
    curveFromPoints(points),
    tubularSegments,
    radius,
    12,
    false,
  );
}

function oxygenColor(oxygenation: Oxygenation): number {
  if (oxygenation === "oxygenated") return COLORS.oxygenated;
  if (oxygenation === "deoxygenated") return COLORS.deoxygenated;
  return COLORS.transition;
}

function applyLongitudinalColors(
  geometry: THREE.TubeGeometry,
  segment: FlowSegment,
): void {
  const position = geometry.getAttribute("position");
  const colors = new Float32Array(position.count * 3);
  const start = new THREE.Color(oxygenColor(segment.oxygenationStart));
  const end = new THREE.Color(oxygenColor(segment.oxygenationEnd));
  const ringSize = 13;
  const ringCount = Math.max(1, Math.floor(position.count / ringSize) - 1);
  for (let index = 0; index < position.count; index += 1) {
    const progress = Math.min(1, Math.floor(index / ringSize) / ringCount);
    const color = start.clone().lerp(end, progress);
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
}

function createLung(x: number, rotation: number, name: string): THREE.Group {
  const group = new THREE.Group();
  group.name = name;
  const material = new THREE.MeshPhysicalMaterial({
    color: COLORS.tissue,
    roughness: 0.82,
    transparent: true,
    opacity: 0.15,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const upper = new THREE.Mesh(new THREE.SphereGeometry(1, 42, 30), material);
  upper.scale.set(1.12, 1.52, 0.58);
  upper.position.set(x, 0.75, -0.72);
  upper.rotation.z = rotation;
  const lower = new THREE.Mesh(
    new THREE.SphereGeometry(1, 42, 30),
    material.clone(),
  );
  lower.scale.set(1.22, 1.35, 0.62);
  lower.position.set(x + Math.sign(x) * 0.12, -0.72, -0.67);
  lower.rotation.z = rotation * 0.7;
  group.add(upper, lower);

  const bronchiMaterial = new THREE.MeshStandardMaterial({
    color: 0x676e72,
    roughness: 0.84,
  });
  const bronchi = new THREE.Mesh(
    createVesselGeometry(
      [
        [0, 1.65, -0.95],
        [x * 0.5, 1.0, -0.85],
        [x, 0.35, -0.7],
      ],
      0.055,
      40,
    ),
    bronchiMaterial,
  );
  group.add(bronchi);
  return group;
}

function createExchangeBed(
  points: readonly Point3[],
  color: number,
): THREE.Group {
  const group = new THREE.Group();
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.42,
  });
  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.085, 12, 8),
      material,
    );
    sphere.position.set(...point);
    sphere.scale.setScalar(0.75 + (index % 3) * 0.15);
    group.add(sphere);
  }
  return group;
}

export function createVesselModel(): VesselModel {
  const group = new THREE.Group();
  group.name = "vessels-and-organs";
  const curves = new Map<string, THREE.CatmullRomCurve3>();
  const pulsatileMeshes: { mesh: THREE.Mesh; segment: FlowSegment }[] = [];

  for (const segment of FLOW_SEGMENTS) {
    const curve = curveFromPoints(segment.points);
    curves.set(segment.id, curve);
    if (segment.id === "right-heart" || segment.id === "left-heart") continue;

    const material = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      vertexColors: true,
      roughness: 0.54,
      metalness: 0.02,
      transparent: true,
      opacity: segment.id.includes("capillaries") ? 0.28 : 0.42,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    const geometry = createVesselGeometry(segment.points, segment.radius);
    applyLongitudinalColors(geometry, segment);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = segment.id;
    mesh.renderOrder = 2;
    group.add(mesh);
    pulsatileMeshes.push({ mesh, segment });
  }

  const leftLung = createLung(-3.0, 0.08, "left-lung");
  const rightLung = createLung(3.0, -0.08, "right-lung");
  group.add(leftLung, rightLung);

  const leftExchange = createExchangeBed(
    [
      [-3.45, 1.2, -0.3],
      [-3.65, 0.55, -0.22],
      [-3.5, -0.15, -0.28],
      [-3.25, -0.85, -0.32],
      [-2.75, -1.0, -0.24],
    ],
    COLORS.transition,
  );
  const rightExchange = leftExchange.clone(true);
  rightExchange.scale.x = -1;
  group.add(leftExchange, rightExchange);

  return {
    group,
    curves,
    update(timeSeconds: number) {
      for (let index = 0; index < pulsatileMeshes.length; index += 1) {
        const { mesh, segment } = pulsatileMeshes[index];
        const pulse =
          1 + Math.sin(timeSeconds * 2.5 + index * 0.37) * segment.pulse;
        mesh.scale.set(pulse, pulse, pulse);
      }
    },
    dispose() {
      group.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material)
          ? object.material
          : [object.material];
        materials.forEach((material) => material.dispose());
      });
    },
  };
}
