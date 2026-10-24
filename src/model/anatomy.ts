import {
  CONNECTIONS,
  STRUCTURE_BY_ID,
  STRUCTURES,
  type DirectedConnection,
} from "../config/cardiovascular";

export interface AnatomyValidation {
  readonly valid: boolean;
  readonly missingStructures: readonly string[];
  readonly invalidConnections: readonly DirectedConnection[];
}

export function validateAnatomy(): AnatomyValidation {
  const ids = new Set(STRUCTURES.map((structure) => structure.id));
  const invalidConnections = CONNECTIONS.filter(
    (connection) =>
      !ids.has(connection.from) ||
      !ids.has(connection.to) ||
      (connection.valve !== undefined && !ids.has(connection.valve)),
  );
  const required = [
    "right-atrium",
    "tricuspid-valve",
    "right-ventricle",
    "pulmonary-valve",
    "pulmonary-artery",
    "lungs",
    "pulmonary-veins",
    "left-atrium",
    "mitral-valve",
    "left-ventricle",
    "aortic-valve",
    "aorta",
    "superior-vena-cava",
    "inferior-vena-cava",
    "systemic-arteries",
    "systemic-capillaries",
    "systemic-veins",
  ];
  const missingStructures = required.filter((id) => !STRUCTURE_BY_ID.has(id));
  return {
    valid: missingStructures.length === 0 && invalidConnections.length === 0,
    missingStructures,
    invalidConnections,
  };
}

export function outgoingConnections(id: string): readonly DirectedConnection[] {
  return CONNECTIONS.filter((connection) => connection.from === id);
}

export function incomingConnections(id: string): readonly DirectedConnection[] {
  return CONNECTIONS.filter((connection) => connection.to === id);
}
