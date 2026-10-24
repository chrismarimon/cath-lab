import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { FLOW_SEGMENTS } from "../src/config/cardiovascular";
import { endpointsMatch } from "../src/model/flow";
import { createHeartModel } from "../src/scene/heart";
import { createVesselGeometry, curveFromPoints } from "../src/scene/vessels";

function expectFiniteGeometry(geometry: THREE.BufferGeometry): void {
  const position = geometry.getAttribute("position");
  expect(position.count).toBeGreaterThan(0);
  for (let index = 0; index < position.count; index += 1) {
    expect(Number.isFinite(position.getX(index))).toBe(true);
    expect(Number.isFinite(position.getY(index))).toBe(true);
    expect(Number.isFinite(position.getZ(index))).toBe(true);
  }
  geometry.computeBoundingSphere();
  expect(Number.isFinite(geometry.boundingSphere?.radius)).toBe(true);
}

describe("procedural vessel geometry", () => {
  it.each(FLOW_SEGMENTS.map((segment) => [segment.id, segment] as const))(
    "%s produces finite tube geometry with outward normals",
    (_id, segment) => {
      const geometry = createVesselGeometry(segment.points, segment.radius, 30);
      expectFiniteGeometry(geometry);
      const position = geometry.getAttribute("position");
      const normal = geometry.getAttribute("normal");
      const curve = curveFromPoints(segment.points);
      const radialSegments = 12;
      for (let ring = 0; ring <= 30; ring += 5) {
        const center = curve.getPointAt(ring / 30);
        for (let radial = 0; radial <= radialSegments; radial += 3) {
          const index = ring * (radialSegments + 1) + radial;
          const vertex = new THREE.Vector3().fromBufferAttribute(
            position,
            index,
          );
          const outward = vertex.sub(center);
          const vertexNormal = new THREE.Vector3().fromBufferAttribute(
            normal,
            index,
          );
          expect(outward.dot(vertexNormal)).toBeGreaterThan(0);
        }
      }
      geometry.dispose();
    },
  );

  it.each(FLOW_SEGMENTS.map((segment) => [segment.id, segment] as const))(
    "%s has a continuously sampled centerline",
    (_id, segment) => {
      const curve = curveFromPoints(segment.points);
      const maximumStep = curve.getLength() / 120;
      let previous = curve.getPointAt(0);
      for (let index = 1; index <= 240; index += 1) {
        const next = curve.getPointAt(index / 240);
        expect(next.distanceTo(previous)).toBeLessThan(maximumStep);
        previous = next;
      }
    },
  );

  it("joins the central heart and systemic segments without positional gaps", () => {
    const byId = new Map(FLOW_SEGMENTS.map((segment) => [segment.id, segment]));
    const joins = [
      ["right-heart", "pulmonary-trunk"],
      ["pulmonary-trunk", "left-pulmonary-artery"],
      ["pulmonary-trunk", "right-pulmonary-artery"],
      ["left-pulmonary-veins", "left-heart"],
      ["right-pulmonary-veins", "left-heart"],
      ["left-heart", "aorta"],
      ["aorta", "systemic-arteries"],
      ["systemic-arteries", "systemic-capillaries"],
      ["systemic-capillaries", "systemic-veins"],
    ] as const;
    joins.forEach(([from, to]) => {
      expect(endpointsMatch(byId.get(from)!.points, byId.get(to)!.points)).toBe(
        true,
      );
    });
  });
});

describe("heart geometry", () => {
  it("creates finite chambers, myocardium, septum, and coronary surface vessels", () => {
    const model = createHeartModel();
    let meshCount = 0;
    model.group.traverse((object) => {
      if (!(object instanceof THREE.Mesh)) return;
      meshCount += 1;
      expectFiniteGeometry(object.geometry);
      expect(object.position.toArray().every(Number.isFinite)).toBe(true);
      expect(object.scale.toArray().every(Number.isFinite)).toBe(true);
    });
    expect(meshCount).toBeGreaterThanOrEqual(9);
    expect(model.chambers).toHaveLength(4);
    expect(model.group.getObjectByName("coronary-artery")).toBeDefined();
    expect(model.group.getObjectByName("cardiac-vein")).toBeDefined();
    model.dispose();
  });
});
