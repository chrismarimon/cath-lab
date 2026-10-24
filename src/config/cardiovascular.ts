export type Point3 = readonly [number, number, number];

export type Oxygenation = "deoxygenated" | "transition" | "oxygenated";

export type StructureKind =
  "chamber" | "valve" | "vessel" | "organ" | "capillary";

export interface AnatomyStructure {
  readonly id: string;
  readonly name: string;
  readonly shortName: string;
  readonly kind: StructureKind;
  readonly oxygenation: Oxygenation;
  readonly labelPosition: Point3;
  readonly description: string;
}

export interface DirectedConnection {
  readonly from: string;
  readonly to: string;
  readonly valve?: string;
}

export interface FlowSegment {
  readonly id: string;
  readonly label: string;
  readonly points: readonly Point3[];
  readonly oxygenationStart: Oxygenation;
  readonly oxygenationEnd: Oxygenation;
  readonly radius: number;
  readonly particleCount: number;
  readonly speed: number;
  readonly pulse: number;
}

export interface CirculationPhase {
  readonly id: "right-heart" | "pulmonary" | "left-heart" | "systemic";
  readonly title: string;
  readonly summary: string;
  readonly oxygenation: Oxygenation;
}

export interface CirculationStage {
  readonly label: string;
  readonly structureIds: readonly string[];
}

export const COLORS = {
  background: 0x080b0e,
  chamberRight: 0x3b4650,
  chamberLeft: 0x50464a,
  myocardium: 0x514b4d,
  tissue: 0x72777a,
  vessel: 0x889095,
  deoxygenated: 0x4f7f9b,
  oxygenated: 0xa15f63,
  transition: 0x81707b,
  valve: 0xaeb5b8,
  label: 0xc6cdd1,
} as const;

export const STRUCTURES: readonly AnatomyStructure[] = [
  {
    id: "systemic-veins",
    name: "Systemic veins",
    shortName: "Systemic veins",
    kind: "vessel",
    oxygenation: "deoxygenated",
    labelPosition: [2.35, -3.7, -0.8],
    description: "Return deoxygenated blood from body tissues.",
  },
  {
    id: "superior-vena-cava",
    name: "Superior vena cava",
    shortName: "SVC",
    kind: "vessel",
    oxygenation: "deoxygenated",
    labelPosition: [1.2, 2.4, 0.15],
    description: "Returns blood from the upper body to the right atrium.",
  },
  {
    id: "inferior-vena-cava",
    name: "Inferior vena cava",
    shortName: "IVC",
    kind: "vessel",
    oxygenation: "deoxygenated",
    labelPosition: [1.25, -2.3, 0.1],
    description: "Returns blood from the lower body to the right atrium.",
  },
  {
    id: "right-atrium",
    name: "Right atrium",
    shortName: "Right atrium",
    kind: "chamber",
    oxygenation: "deoxygenated",
    labelPosition: [1.1, 0.72, 0.6],
    description: "Receives systemic venous blood.",
  },
  {
    id: "tricuspid-valve",
    name: "Tricuspid valve",
    shortName: "Tricuspid",
    kind: "valve",
    oxygenation: "deoxygenated",
    labelPosition: [0.84, -0.05, 0.85],
    description: "Maintains one-way flow into the right ventricle.",
  },
  {
    id: "right-ventricle",
    name: "Right ventricle",
    shortName: "Right ventricle",
    kind: "chamber",
    oxygenation: "deoxygenated",
    labelPosition: [0.55, -1.05, 0.9],
    description: "Pumps blood toward the lungs.",
  },
  {
    id: "pulmonary-valve",
    name: "Pulmonary valve",
    shortName: "Pulmonary valve",
    kind: "valve",
    oxygenation: "deoxygenated",
    labelPosition: [0.35, 0.25, 1.05],
    description: "Maintains one-way flow into the pulmonary artery.",
  },
  {
    id: "pulmonary-artery",
    name: "Pulmonary artery",
    shortName: "Pulmonary artery",
    kind: "vessel",
    oxygenation: "deoxygenated",
    labelPosition: [0.05, 1.6, 0.8],
    description: "Carries deoxygenated blood to both lungs.",
  },
  {
    id: "lungs",
    name: "Pulmonary capillaries",
    shortName: "Lungs",
    kind: "organ",
    oxygenation: "transition",
    labelPosition: [-3.0, 0.45, -0.3],
    description: "Represent gas exchange and oxygenation.",
  },
  {
    id: "pulmonary-veins",
    name: "Pulmonary veins",
    shortName: "Pulmonary veins",
    kind: "vessel",
    oxygenation: "oxygenated",
    labelPosition: [-2.1, 0.25, -0.25],
    description: "Return oxygenated blood to the left atrium.",
  },
  {
    id: "left-atrium",
    name: "Left atrium",
    shortName: "Left atrium",
    kind: "chamber",
    oxygenation: "oxygenated",
    labelPosition: [-0.9, 0.65, -0.25],
    description: "Receives oxygenated pulmonary venous blood.",
  },
  {
    id: "mitral-valve",
    name: "Mitral valve",
    shortName: "Mitral",
    kind: "valve",
    oxygenation: "oxygenated",
    labelPosition: [-0.7, -0.05, 0.5],
    description: "Maintains one-way flow into the left ventricle.",
  },
  {
    id: "left-ventricle",
    name: "Left ventricle",
    shortName: "Left ventricle",
    kind: "chamber",
    oxygenation: "oxygenated",
    labelPosition: [-0.65, -1.15, 0.65],
    description: "Pumps oxygenated blood into the aorta.",
  },
  {
    id: "aortic-valve",
    name: "Aortic valve",
    shortName: "Aortic valve",
    kind: "valve",
    oxygenation: "oxygenated",
    labelPosition: [-0.4, 0.1, -0.15],
    description: "Maintains one-way flow into the aorta.",
  },
  {
    id: "aorta",
    name: "Aorta",
    shortName: "Aorta",
    kind: "vessel",
    oxygenation: "oxygenated",
    labelPosition: [-0.25, 2.25, -0.35],
    description: "Distributes oxygenated blood to the systemic circulation.",
  },
  {
    id: "systemic-arteries",
    name: "Systemic arteries",
    shortName: "Systemic arteries",
    kind: "vessel",
    oxygenation: "oxygenated",
    labelPosition: [-2.15, -3.75, -0.85],
    description: "Carry oxygenated blood toward body tissues.",
  },
  {
    id: "systemic-capillaries",
    name: "Systemic capillaries",
    shortName: "Body tissues",
    kind: "capillary",
    oxygenation: "transition",
    labelPosition: [0, -5.15, -0.9],
    description: "Represent oxygen delivery to body tissues.",
  },
] as const;

export const STRUCTURE_BY_ID = new Map(
  STRUCTURES.map((item) => [item.id, item]),
);

export const CIRCULATION_STAGES: readonly CirculationStage[] = [
  { label: "Systemic veins", structureIds: ["systemic-veins"] },
  {
    label: "Superior and inferior vena cava",
    structureIds: ["superior-vena-cava", "inferior-vena-cava"],
  },
  { label: "Right atrium", structureIds: ["right-atrium"] },
  { label: "Tricuspid valve", structureIds: ["tricuspid-valve"] },
  { label: "Right ventricle", structureIds: ["right-ventricle"] },
  { label: "Pulmonary valve", structureIds: ["pulmonary-valve"] },
  { label: "Pulmonary artery", structureIds: ["pulmonary-artery"] },
  { label: "Lungs", structureIds: ["lungs"] },
  { label: "Pulmonary veins", structureIds: ["pulmonary-veins"] },
  { label: "Left atrium", structureIds: ["left-atrium"] },
  { label: "Mitral valve", structureIds: ["mitral-valve"] },
  { label: "Left ventricle", structureIds: ["left-ventricle"] },
  { label: "Aortic valve", structureIds: ["aortic-valve"] },
  { label: "Aorta", structureIds: ["aorta"] },
  { label: "Systemic arteries", structureIds: ["systemic-arteries"] },
  { label: "Systemic capillaries", structureIds: ["systemic-capillaries"] },
  { label: "Systemic veins", structureIds: ["systemic-veins"] },
] as const;

export const CIRCULATION_PATHWAY = CIRCULATION_STAGES.flatMap(
  (stage) => stage.structureIds,
);

export const CONNECTIONS: readonly DirectedConnection[] = [
  { from: "systemic-veins", to: "superior-vena-cava" },
  { from: "systemic-veins", to: "inferior-vena-cava" },
  { from: "superior-vena-cava", to: "right-atrium" },
  { from: "inferior-vena-cava", to: "right-atrium" },
  { from: "right-atrium", to: "right-ventricle", valve: "tricuspid-valve" },
  { from: "right-ventricle", to: "pulmonary-artery", valve: "pulmonary-valve" },
  { from: "pulmonary-artery", to: "lungs" },
  { from: "lungs", to: "pulmonary-veins" },
  { from: "pulmonary-veins", to: "left-atrium" },
  { from: "left-atrium", to: "left-ventricle", valve: "mitral-valve" },
  { from: "left-ventricle", to: "aorta", valve: "aortic-valve" },
  { from: "aorta", to: "systemic-arteries" },
  { from: "systemic-arteries", to: "systemic-capillaries" },
  { from: "systemic-capillaries", to: "systemic-veins" },
] as const;

const SVC: readonly Point3[] = [
  [1.3, 4.85, -0.25],
  [1.25, 3.5, -0.08],
  [1.15, 2.1, 0.12],
  [1.05, 1.05, 0.25],
];
const IVC: readonly Point3[] = [
  [1.4, -4.8, -0.4],
  [1.35, -3.3, -0.1],
  [1.2, -1.8, 0.15],
  [1.0, 0.45, 0.3],
];
const RIGHT_HEART: readonly Point3[] = [
  [1.05, 0.85, 0.3],
  [0.9, 0.3, 0.45],
  [0.74, -0.12, 0.56],
  [0.68, -0.85, 0.52],
  [0.48, -1.25, 0.38],
];
const PULMONARY_OUT: readonly Point3[] = [
  [0.48, -1.25, 0.38],
  [0.25, -0.2, 0.8],
  [0.08, 0.8, 0.95],
  [0, 1.55, 0.75],
];
const LEFT_PULMONARY: readonly Point3[] = [
  [0, 1.55, 0.75],
  [-1.25, 1.65, 0.5],
  [-2.2, 1.2, 0.15],
  [-3.05, 0.5, -0.25],
];
const RIGHT_PULMONARY: readonly Point3[] = [
  [0, 1.55, 0.75],
  [1.45, 1.7, 0.25],
  [2.35, 1.2, -0.15],
  [3.1, 0.45, -0.35],
];
const LEFT_RETURN: readonly Point3[] = [
  [-3.05, 0.25, -0.4],
  [-2.15, 0.2, -0.32],
  [-1.45, 0.45, -0.2],
  [-0.85, 0.65, -0.08],
];
const RIGHT_RETURN: readonly Point3[] = [
  [3.1, 0.2, -0.45],
  [2.05, 0.05, -0.42],
  [0.7, 0.28, -0.32],
  [-0.85, 0.65, -0.08],
];
const LEFT_HEART: readonly Point3[] = [
  [-0.85, 0.65, -0.08],
  [-0.7, 0.1, 0.08],
  [-0.68, -0.25, 0.2],
  [-0.65, -0.95, 0.18],
  [-0.55, -1.55, -0.02],
];
const AORTA: readonly Point3[] = [
  [-0.55, -1.55, -0.02],
  [-0.4, -0.15, -0.24],
  [-0.58, 1.35, -0.4],
  [-0.15, 2.55, -0.58],
  [0.75, 2.85, -0.65],
  [1.55, 2.2, -0.7],
  [1.65, 0.25, -0.72],
  [1.62, -2.75, -0.72],
];
const SYSTEMIC_ARTERY: readonly Point3[] = [
  [1.62, -2.75, -0.72],
  [0.55, -3.65, -0.82],
  [-1.15, -4.2, -0.9],
  [-2.25, -4.65, -0.92],
];
const SYSTEMIC_EXCHANGE: readonly Point3[] = [
  [-2.25, -4.65, -0.92],
  [-1.2, -5.25, -0.95],
  [0, -5.45, -0.96],
  [1.2, -5.25, -0.94],
  [2.25, -4.65, -0.88],
];
const SYSTEMIC_VEIN: readonly Point3[] = [
  [2.25, -4.65, -0.88],
  [1.85, -3.55, -0.7],
  [1.55, -2.75, -0.45],
];

export const FLOW_SEGMENTS: readonly FlowSegment[] = [
  {
    id: "svc",
    label: "Superior vena cava",
    points: SVC,
    oxygenationStart: "deoxygenated",
    oxygenationEnd: "deoxygenated",
    radius: 0.16,
    particleCount: 18,
    speed: 0.055,
    pulse: 0.025,
  },
  {
    id: "ivc",
    label: "Inferior vena cava",
    points: IVC,
    oxygenationStart: "deoxygenated",
    oxygenationEnd: "deoxygenated",
    radius: 0.17,
    particleCount: 21,
    speed: 0.05,
    pulse: 0.025,
  },
  {
    id: "right-heart",
    label: "Right heart",
    points: RIGHT_HEART,
    oxygenationStart: "deoxygenated",
    oxygenationEnd: "deoxygenated",
    radius: 0.1,
    particleCount: 18,
    speed: 0.05,
    pulse: 0.045,
  },
  {
    id: "pulmonary-trunk",
    label: "Pulmonary trunk",
    points: PULMONARY_OUT,
    oxygenationStart: "deoxygenated",
    oxygenationEnd: "deoxygenated",
    radius: 0.15,
    particleCount: 18,
    speed: 0.06,
    pulse: 0.05,
  },
  {
    id: "left-pulmonary-artery",
    label: "Left pulmonary artery",
    points: LEFT_PULMONARY,
    oxygenationStart: "deoxygenated",
    oxygenationEnd: "transition",
    radius: 0.11,
    particleCount: 20,
    speed: 0.052,
    pulse: 0.035,
  },
  {
    id: "right-pulmonary-artery",
    label: "Right pulmonary artery",
    points: RIGHT_PULMONARY,
    oxygenationStart: "deoxygenated",
    oxygenationEnd: "transition",
    radius: 0.11,
    particleCount: 20,
    speed: 0.052,
    pulse: 0.035,
  },
  {
    id: "left-pulmonary-veins",
    label: "Left pulmonary veins",
    points: LEFT_RETURN,
    oxygenationStart: "transition",
    oxygenationEnd: "oxygenated",
    radius: 0.105,
    particleCount: 18,
    speed: 0.048,
    pulse: 0.02,
  },
  {
    id: "right-pulmonary-veins",
    label: "Right pulmonary veins",
    points: RIGHT_RETURN,
    oxygenationStart: "transition",
    oxygenationEnd: "oxygenated",
    radius: 0.105,
    particleCount: 18,
    speed: 0.048,
    pulse: 0.02,
  },
  {
    id: "left-heart",
    label: "Left heart",
    points: LEFT_HEART,
    oxygenationStart: "oxygenated",
    oxygenationEnd: "oxygenated",
    radius: 0.1,
    particleCount: 20,
    speed: 0.052,
    pulse: 0.05,
  },
  {
    id: "aorta",
    label: "Aorta",
    points: AORTA,
    oxygenationStart: "oxygenated",
    oxygenationEnd: "oxygenated",
    radius: 0.18,
    particleCount: 30,
    speed: 0.06,
    pulse: 0.06,
  },
  {
    id: "systemic-arteries",
    label: "Systemic arteries",
    points: SYSTEMIC_ARTERY,
    oxygenationStart: "oxygenated",
    oxygenationEnd: "oxygenated",
    radius: 0.115,
    particleCount: 20,
    speed: 0.052,
    pulse: 0.035,
  },
  {
    id: "systemic-capillaries",
    label: "Systemic capillaries",
    points: SYSTEMIC_EXCHANGE,
    oxygenationStart: "oxygenated",
    oxygenationEnd: "deoxygenated",
    radius: 0.065,
    particleCount: 26,
    speed: 0.035,
    pulse: 0.012,
  },
  {
    id: "systemic-veins",
    label: "Systemic veins",
    points: SYSTEMIC_VEIN,
    oxygenationStart: "deoxygenated",
    oxygenationEnd: "deoxygenated",
    radius: 0.115,
    particleCount: 16,
    speed: 0.045,
    pulse: 0.018,
  },
] as const;

export const PHASES: readonly CirculationPhase[] = [
  {
    id: "right-heart",
    title: "Right heart",
    summary: "Receives deoxygenated blood and directs it toward the lungs.",
    oxygenation: "deoxygenated",
  },
  {
    id: "pulmonary",
    title: "Pulmonary circulation",
    summary: "Carries blood between the heart and lungs for oxygenation.",
    oxygenation: "transition",
  },
  {
    id: "left-heart",
    title: "Left heart",
    summary: "Receives oxygenated blood and directs it into the aorta.",
    oxygenation: "oxygenated",
  },
  {
    id: "systemic",
    title: "Systemic circulation",
    summary: "Carries blood between the heart and body tissues.",
    oxygenation: "oxygenated",
  },
] as const;

export const NETWORK_ENDPOINTS: readonly string[] = [];
