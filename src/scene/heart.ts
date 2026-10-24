import * as THREE from "three";
import { COLORS } from "../config/cardiovascular";

export interface HeartModel {
  readonly group: THREE.Group;
  readonly myocardium: THREE.Mesh;
  readonly chambers: readonly THREE.Mesh[];
  update(timeSeconds: number): void;
  dispose(): void;
}

interface ChamberDefinition {
  readonly position: readonly [number, number, number];
  readonly scale: readonly [number, number, number];
  readonly rotation: readonly [number, number, number];
  readonly color: number;
}

const CHAMBERS: readonly ChamberDefinition[] = [
  {
    position: [0.93, 0.68, 0.13],
    scale: [0.63, 0.72, 0.5],
    rotation: [0.05, -0.2, -0.14],
    color: COLORS.chamberRight,
  },
  {
    position: [0.54, -0.76, 0.15],
    scale: [0.83, 1.2, 0.62],
    rotation: [0.08, 0.08, 0.15],
    color: COLORS.chamberRight,
  },
  {
    position: [-0.77, 0.62, -0.12],
    scale: [0.58, 0.62, 0.45],
    rotation: [-0.05, 0.2, 0.12],
    color: COLORS.chamberLeft,
  },
  {
    position: [-0.59, -0.86, -0.05],
    scale: [0.88, 1.35, 0.72],
    rotation: [-0.06, -0.06, -0.17],
    color: COLORS.chamberLeft,
  },
] as const;

function makeChamber(definition: ChamberDefinition): THREE.Mesh {
  const geometry = new THREE.SphereGeometry(1, 48, 36);
  const material = new THREE.MeshPhysicalMaterial({
    color: definition.color,
    roughness: 0.54,
    metalness: 0.04,
    clearcoat: 0.22,
    clearcoatRoughness: 0.7,
    transparent: true,
    opacity: 0.88,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...definition.position);
  mesh.scale.set(...definition.scale);
  mesh.rotation.set(...definition.rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function makeCoronaryCurve(
  points: readonly (readonly [number, number, number])[],
  color: number,
  radius: number,
): THREE.Mesh {
  const path = new THREE.CatmullRomCurve3(
    points.map((point) => new THREE.Vector3(...point)),
    false,
    "centripetal",
  );
  const geometry = new THREE.TubeGeometry(path, 48, radius, 7, false);
  const material = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.48,
    metalness: 0.06,
  });
  return new THREE.Mesh(geometry, material);
}

export function createHeartModel(): HeartModel {
  const group = new THREE.Group();
  group.name = "heart-model";

  const myocardiumGeometry = new THREE.SphereGeometry(1, 64, 48);
  const myocardiumMaterial = new THREE.MeshPhysicalMaterial({
    color: COLORS.myocardium,
    roughness: 0.66,
    metalness: 0.02,
    clearcoat: 0.08,
    transparent: true,
    opacity: 0.27,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const myocardium = new THREE.Mesh(myocardiumGeometry, myocardiumMaterial);
  myocardium.position.set(0, -0.3, -0.08);
  myocardium.scale.set(1.55, 2.05, 1.15);
  myocardium.rotation.set(0.05, -0.04, 0.03);
  myocardium.renderOrder = 3;
  group.add(myocardium);

  const apexGeometry = new THREE.SphereGeometry(1, 48, 32);
  const apex = new THREE.Mesh(apexGeometry, myocardiumMaterial.clone());
  apex.position.set(-0.18, -1.72, -0.04);
  apex.scale.set(0.88, 0.78, 0.78);
  apex.rotation.z = -0.12;
  apex.renderOrder = 3;
  group.add(apex);

  const chambers = CHAMBERS.map(makeChamber);
  chambers.forEach((chamber) => group.add(chamber));

  const septum = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.12, 1.45, 8, 20),
    new THREE.MeshStandardMaterial({
      color: 0x777174,
      roughness: 0.72,
      transparent: true,
      opacity: 0.56,
    }),
  );
  septum.position.set(-0.05, -0.65, 0.08);
  septum.rotation.z = -0.08;
  group.add(septum);

  const coronaryArtery = makeCoronaryCurve(
    [
      [-0.38, 0.3, 1.0],
      [-0.2, -0.2, 1.12],
      [-0.18, -0.9, 1.02],
      [-0.24, -1.58, 0.72],
    ],
    COLORS.oxygenated,
    0.025,
  );
  coronaryArtery.name = "coronary-artery";
  group.add(coronaryArtery);

  const coronaryBranch = makeCoronaryCurve(
    [
      [-0.3, 0.15, 1.02],
      [-0.85, -0.05, 0.88],
      [-1.12, -0.65, 0.45],
      [-0.88, -1.25, 0.25],
    ],
    COLORS.oxygenated,
    0.018,
  );
  group.add(coronaryBranch);

  const cardiacVein = makeCoronaryCurve(
    [
      [0.35, 0.25, 1.08],
      [0.68, -0.18, 1.0],
      [0.75, -0.85, 0.73],
      [0.5, -1.42, 0.44],
    ],
    COLORS.deoxygenated,
    0.022,
  );
  cardiacVein.name = "cardiac-vein";
  group.add(cardiacVein);

  return {
    group,
    myocardium,
    chambers,
    update(timeSeconds: number) {
      const beat = Math.sin(timeSeconds * Math.PI * 1.25);
      const pulse = 1 + Math.max(0, beat) * 0.014;
      group.scale.set(pulse, pulse, pulse);
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
