import { describe, it, expect } from "vitest";
import { Vector3 } from "three";
import { CENTERLINES } from "../src/config/anatomy";
import { curve, vesselGeometry } from "../src/scene/anatomy";
describe("procedural anatomy geometry", () => {
  it.each(Object.keys(CENTERLINES))(
    "%s has outward-facing triangle winding and normals",
    (name) => {
      const geometry = vesselGeometry(CENTERLINES[name], 0.05),
        positions = geometry.getAttribute("position"),
        normals = geometry.getAttribute("normal"),
        index = geometry.index!;
      for (let i = 0; i < index.count; i += 3) {
        const a = index.getX(i),
          b = index.getX(i + 1),
          c = index.getX(i + 2);
        const va = new Vector3().fromBufferAttribute(positions, a),
          vb = new Vector3().fromBufferAttribute(positions, b),
          vc = new Vector3().fromBufferAttribute(positions, c);
        const face = vb.sub(va).cross(vc.sub(va));
        const normal = new Vector3().fromBufferAttribute(normals, a);
        expect(face.dot(normal)).toBeGreaterThan(0);
      }
      for (let ring = 0; ring <= 80; ring++) {
        const center = curve(CENTERLINES[name]).getPointAt(ring / 80);
        for (let j = 0; j <= 12; j++) {
          const v = ring * 13 + j,
            radial = new Vector3()
              .fromBufferAttribute(positions, v)
              .sub(center),
            normal = new Vector3().fromBufferAttribute(normals, v);
          expect(radial.dot(normal)).toBeGreaterThan(0.045);
        }
      }
      geometry.dispose();
    },
  );
  it("all branches start at parent junctions", () => {
    expect(CENTERLINES.LM[0]).toEqual(CENTERLINES.Aorta[0]);
    expect(CENTERLINES.LAD[0]).toEqual(CENTERLINES.LM.at(-1));
    expect(CENTERLINES.LCx[0]).toEqual(CENTERLINES.LM.at(-1));
    expect(CENTERLINES.D1[0]).toEqual(CENTERLINES.LAD[1]);
    expect(CENTERLINES.D2[0]).toEqual(CENTERLINES.LAD[2]);
    expect(CENTERLINES.RCA[0]).toEqual(CENTERLINES.Aorta[0]);
    expect(CENTERLINES["Right radial"].at(-1)).toEqual(CENTERLINES.Aorta[2]);
  });
  it.each(Object.keys(CENTERLINES))(
    "%s centerline is continuous without abrupt jumps",
    (name) => {
      const c = curve(CENTERLINES[name]);
      let last = c.getPointAt(0);
      for (let i = 1; i <= 1000; i++) {
        const p = c.getPointAt(i / 1000);
        expect(p.distanceTo(last)).toBeLessThan(c.getLength() / 500);
        last = p;
      }
    },
  );
});
