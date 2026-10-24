import {
  CIRCULATION_STAGES,
  CONNECTIONS,
  PHASES,
  STRUCTURE_BY_ID,
  type CirculationPhase,
  type Oxygenation,
} from "../config/cardiovascular";

export function circulationNames(): readonly string[] {
  return CIRCULATION_STAGES.map((stage) => stage.label);
}

export function hasDirectedConnection(from: string, to: string): boolean {
  return CONNECTIONS.some(
    (connection) => connection.from === from && connection.to === to,
  );
}

export function oxygenationAfter(structureId: string): Oxygenation {
  if (structureId === "lungs" || structureId === "pulmonary-veins") {
    return "oxygenated";
  }
  if (
    structureId === "systemic-capillaries" ||
    structureId === "systemic-veins" ||
    structureId === "superior-vena-cava" ||
    structureId === "inferior-vena-cava"
  ) {
    return "deoxygenated";
  }
  return STRUCTURE_BY_ID.get(structureId)?.oxygenation ?? "transition";
}

export function phaseAtTime(timeSeconds: number): CirculationPhase {
  const safeTime = Number.isFinite(timeSeconds) ? Math.max(0, timeSeconds) : 0;
  const index = Math.floor((safeTime % 16) / 4);
  return PHASES[index];
}

export function valveAllowsFlow(
  direction: "forward" | "reverse",
  pressureBefore: number,
  pressureAfter: number,
): boolean {
  return direction === "forward" && pressureBefore > pressureAfter;
}
