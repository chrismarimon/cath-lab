import { describe, expect, it } from "vitest";
import {
  CIRCULATION_PATHWAY,
  CIRCULATION_STAGES,
  CONNECTIONS,
  FLOW_SEGMENTS,
  NETWORK_ENDPOINTS,
  STRUCTURES,
} from "../src/config/cardiovascular";
import {
  incomingConnections,
  outgoingConnections,
  validateAnatomy,
} from "../src/model/anatomy";
import {
  circulationNames,
  hasDirectedConnection,
  oxygenationAfter,
  phaseAtTime,
  valveAllowsFlow,
} from "../src/model/circulation";
import {
  oxygenationAlongSegment,
  particleProgress,
  pointsAreFinite,
} from "../src/model/flow";

describe("cardiovascular anatomy graph", () => {
  it("contains every requested structure and valid directed connection", () => {
    const result = validateAnatomy();
    expect(result).toEqual({
      valid: true,
      missingStructures: [],
      invalidConnections: [],
    });
    expect(STRUCTURES).toHaveLength(17);
  });

  it("orders the complete circulation pathway without placing the vena cavae in series", () => {
    expect(circulationNames()).toEqual([
      "Systemic veins",
      "Superior and inferior vena cava",
      "Right atrium",
      "Tricuspid valve",
      "Right ventricle",
      "Pulmonary valve",
      "Pulmonary artery",
      "Lungs",
      "Pulmonary veins",
      "Left atrium",
      "Mitral valve",
      "Left ventricle",
      "Aortic valve",
      "Aorta",
      "Systemic arteries",
      "Systemic capillaries",
      "Systemic veins",
    ]);
    expect(CIRCULATION_STAGES[1].structureIds).toEqual([
      "superior-vena-cava",
      "inferior-vena-cava",
    ]);
    expect(CIRCULATION_PATHWAY).toContain("superior-vena-cava");
    expect(CIRCULATION_PATHWAY).toContain("inferior-vena-cava");
  });

  it("connects both systemic venous returns into the right atrium", () => {
    expect(hasDirectedConnection("systemic-veins", "superior-vena-cava")).toBe(
      true,
    );
    expect(hasDirectedConnection("systemic-veins", "inferior-vena-cava")).toBe(
      true,
    );
    expect(hasDirectedConnection("superior-vena-cava", "right-atrium")).toBe(
      true,
    );
    expect(hasDirectedConnection("inferior-vena-cava", "right-atrium")).toBe(
      true,
    );
    expect(incomingConnections("right-atrium")).toHaveLength(2);
  });

  it("connects the pulmonary and systemic loops into one closed circuit", () => {
    const requiredEdges = [
      ["right-atrium", "right-ventricle"],
      ["right-ventricle", "pulmonary-artery"],
      ["pulmonary-artery", "lungs"],
      ["lungs", "pulmonary-veins"],
      ["pulmonary-veins", "left-atrium"],
      ["left-atrium", "left-ventricle"],
      ["left-ventricle", "aorta"],
      ["aorta", "systemic-arteries"],
      ["systemic-arteries", "systemic-capillaries"],
      ["systemic-capillaries", "systemic-veins"],
    ] as const;
    requiredEdges.forEach(([from, to]) =>
      expect(hasDirectedConnection(from, to)).toBe(true),
    );
    expect(outgoingConnections("lungs")[0]?.to).toBe("pulmonary-veins");
  });

  it("places a named valve at each chamber outflow transition", () => {
    const valveConnections = CONNECTIONS.filter(
      (connection) => connection.valve,
    );
    expect(valveConnections.map((connection) => connection.valve)).toEqual([
      "tricuspid-valve",
      "pulmonary-valve",
      "mitral-valve",
      "aortic-valve",
    ]);
  });
});

describe("oxygenation and forward flow", () => {
  it("changes deoxygenated blood to oxygenated blood after pulmonary exchange", () => {
    expect(oxygenationAfter("pulmonary-artery")).toBe("deoxygenated");
    expect(oxygenationAfter("lungs")).toBe("oxygenated");
    expect(oxygenationAfter("pulmonary-veins")).toBe("oxygenated");
  });

  it("returns blood to a deoxygenated state after systemic exchange", () => {
    expect(oxygenationAfter("aorta")).toBe("oxygenated");
    expect(oxygenationAfter("systemic-capillaries")).toBe("deoxygenated");
    expect(oxygenationAfter("systemic-veins")).toBe("deoxygenated");
  });

  it("interpolates oxygenation only through exchange segments", () => {
    expect(
      oxygenationAlongSegment(0.05, "deoxygenated", "oxygenated").oxygenation,
    ).toBe("deoxygenated");
    expect(
      oxygenationAlongSegment(0.5, "deoxygenated", "oxygenated").oxygenation,
    ).toBe("transition");
    expect(
      oxygenationAlongSegment(0.95, "deoxygenated", "oxygenated").oxygenation,
    ).toBe("oxygenated");
    expect(
      oxygenationAlongSegment(0.5, "oxygenated", "oxygenated").oxygenation,
    ).toBe("oxygenated");
  });

  it("allows valves to open only for a forward pressure gradient", () => {
    expect(valveAllowsFlow("forward", 18, 9)).toBe(true);
    expect(valveAllowsFlow("forward", 9, 18)).toBe(false);
    expect(valveAllowsFlow("reverse", 18, 9)).toBe(false);
    expect(valveAllowsFlow("reverse", 9, 18)).toBe(false);
  });

  it("wraps particle movement continuously in the forward direction", () => {
    const samples = [0, 1, 2, 3, 4].map((time) =>
      particleProgress(time, 0.1, 0.2),
    );
    samples.forEach((sample, index) =>
      expect(sample).toBeCloseTo([0.2, 0.3, 0.4, 0.5, 0.6][index]),
    );
    expect(particleProgress(12, 0.1, 0)).toBeCloseTo(0.2);
  });

  it("cycles through four automatic educational phases", () => {
    expect(phaseAtTime(0).id).toBe("right-heart");
    expect(phaseAtTime(4).id).toBe("pulmonary");
    expect(phaseAtTime(8).id).toBe("left-heart");
    expect(phaseAtTime(12).id).toBe("systemic");
    expect(phaseAtTime(16).id).toBe("right-heart");
  });
});

describe("flow data integrity", () => {
  it.each(
    FLOW_SEGMENTS.map((segment) => [segment.id, segment.points] as const),
  )("%s contains a finite directed centerline", (_id, points) =>
    expect(pointsAreFinite(points)).toBe(true),
  );

  it("has no runtime backend endpoints", () => {
    expect(NETWORK_ENDPOINTS).toEqual([]);
  });
});
