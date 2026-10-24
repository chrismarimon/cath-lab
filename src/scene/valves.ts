import * as THREE from "three";
import { COLORS } from "../config/cardiovascular";

export interface ValveModel {
  readonly group: THREE.Group;
  update(timeSeconds: number): void;
  dispose(): void;
}

interface ValveDefinition {
  readonly name: string;
  readonly position: readonly [number, number, number];
  readonly rotation: readonly [number, number, number];
  readonly leaflets: number;
  readonly phase: number;
}

const DEFINITIONS: readonly ValveDefinition[] = [
  {
    name: "tricuspid-valve",
    position: [0.78, -0.04, 0.56],
    rotation: [Math.PI / 2, 0.15, 0.08],
    leaflets: 3,
    phase: 0,
  },
  {
    name: "pulmonary-valve",
    position: [0.29, 0.1, 0.76],
    rotation: [Math.PI / 2, -0.25, -0.12],
    leaflets: 3,
    phase: Math.PI * 0.55,
  },
  {
    name: "mitral-valve",
    position: [-0.68, -0.05, 0.17],
    rotation: [Math.PI / 2, -0.08, -0.12],
    leaflets: 2,
    phase: 0,
  },
  {
    name: "aortic-valve",
    position: [-0.43, -0.08, -0.22],
    rotation: [Math.PI / 2, 0.24, 0.12],
    leaflets: 3,
    phase: Math.PI * 0.55,
  },
] as const;

interface AnimatedValve {
  readonly definition: ValveDefinition;
  readonly leaflets: readonly THREE.Mesh[];
}

function createValve(definition: ValveDefinition): {
  group: THREE.Group;
  animated: AnimatedValve;
} {
  const group = new THREE.Group();
  group.name = definition.name;
  group.position.set(...definition.position);
  group.rotation.set(...definition.rotation);

  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(0.19, 0.023, 8, 28),
    new THREE.MeshStandardMaterial({
      color: COLORS.valve,
      roughness: 0.45,
      metalness: 0.16,
    }),
  );
  group.add(ring);

  const leaflets: THREE.Mesh[] = [];
  const leafletMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xb2b8b9,
    roughness: 0.68,
    transparent: true,
    opacity: 0.72,
    side: THREE.DoubleSide,
  });
  for (let index = 0; index < definition.leaflets; index += 1) {
    const angle = (index / definition.leaflets) * Math.PI * 2;
    const geometry = new THREE.CircleGeometry(
      0.145,
      Math.max(3, definition.leaflets),
      angle,
      Math.PI * 1.25,
    );
    geometry.translate(0.04, 0, 0);
    const leaflet = new THREE.Mesh(geometry, leafletMaterial);
    leaflet.rotation.z = angle;
    leaflet.userData.baseAngle = angle;
    group.add(leaflet);
    leaflets.push(leaflet);
  }
  return { group, animated: { definition, leaflets } };
}

export function createValveModel(): ValveModel {
  const group = new THREE.Group();
  group.name = "valves";
  const animatedValves: AnimatedValve[] = [];
  for (const definition of DEFINITIONS) {
    const valve = createValve(definition);
    group.add(valve.group);
    animatedValves.push(valve.animated);
  }
  return {
    group,
    update(timeSeconds: number) {
      for (const valve of animatedValves) {
        const cycle = Math.sin(
          timeSeconds * Math.PI * 1.25 + valve.definition.phase,
        );
        const opening = THREE.MathUtils.smoothstep(cycle, -0.15, 0.55);
        valve.leaflets.forEach((leaflet, index) => {
          leaflet.rotation.x = opening * (0.48 + index * 0.025);
          leaflet.rotation.z = leaflet.userData.baseAngle as number;
        });
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
