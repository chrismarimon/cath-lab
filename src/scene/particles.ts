import * as THREE from "three";
import {
  COLORS,
  FLOW_SEGMENTS,
  type FlowSegment,
  type Oxygenation,
} from "../config/cardiovascular";
import { oxygenationAlongSegment, particleProgress } from "../model/flow";

export interface ParticleModel {
  readonly group: THREE.Group;
  update(timeSeconds: number): void;
  dispose(): void;
}

interface ParticleRun {
  readonly segment: FlowSegment;
  readonly curve: THREE.CatmullRomCurve3;
  readonly mesh: THREE.InstancedMesh;
  readonly offsets: readonly number[];
}

function baseColor(oxygenation: Oxygenation): THREE.Color {
  if (oxygenation === "oxygenated") return new THREE.Color(COLORS.oxygenated);
  if (oxygenation === "deoxygenated")
    return new THREE.Color(COLORS.deoxygenated);
  return new THREE.Color(COLORS.transition);
}

function colorAt(segment: FlowSegment, progress: number): THREE.Color {
  const sample = oxygenationAlongSegment(
    progress,
    segment.oxygenationStart,
    segment.oxygenationEnd,
  );
  if (segment.oxygenationStart === segment.oxygenationEnd) {
    return baseColor(sample.oxygenation);
  }
  return baseColor(segment.oxygenationStart).lerp(
    baseColor(segment.oxygenationEnd),
    sample.blend,
  );
}

export function createParticleModel(
  curves: ReadonlyMap<string, THREE.CatmullRomCurve3>,
): ParticleModel {
  const group = new THREE.Group();
  group.name = "blood-flow-particles";
  const runs: ParticleRun[] = [];
  const matrix = new THREE.Matrix4();
  const position = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const scale = new THREE.Vector3();

  for (const segment of FLOW_SEGMENTS) {
    const curve = curves.get(segment.id);
    if (!curve) continue;
    const geometry = new THREE.SphereGeometry(
      Math.max(0.026, segment.radius * 0.26),
      10,
      8,
    );
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      toneMapped: false,
      transparent: true,
      opacity: 0.92,
    });
    const mesh = new THREE.InstancedMesh(
      geometry,
      material,
      segment.particleCount,
    );
    mesh.name = `${segment.id}-flow`;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    mesh.frustumCulled = false;
    group.add(mesh);
    const offsets = Array.from(
      { length: segment.particleCount },
      (_, index) => index / segment.particleCount,
    );
    runs.push({ segment, curve, mesh, offsets });
  }

  return {
    group,
    update(timeSeconds: number) {
      for (const run of runs) {
        for (let index = 0; index < run.offsets.length; index += 1) {
          const progress = particleProgress(
            timeSeconds,
            run.segment.speed,
            run.offsets[index],
          );
          run.curve.getPointAt(progress, position);
          const breathing =
            0.78 + Math.sin(timeSeconds * 3 + index * 1.7) * 0.16;
          scale.setScalar(breathing);
          matrix.compose(position, quaternion, scale);
          run.mesh.setMatrixAt(index, matrix);
          run.mesh.setColorAt(index, colorAt(run.segment, progress));
        }
        run.mesh.instanceMatrix.needsUpdate = true;
        if (run.mesh.instanceColor) run.mesh.instanceColor.needsUpdate = true;
      }
    },
    dispose() {
      for (const run of runs) {
        run.mesh.geometry.dispose();
        const materials = Array.isArray(run.mesh.material)
          ? run.mesh.material
          : [run.mesh.material];
        materials.forEach((material) => material.dispose());
      }
    },
  };
}
