import type { Oxygenation, Point3 } from "../config/cardiovascular";

export interface FlowSample {
  readonly oxygenation: Oxygenation;
  readonly blend: number;
}

export function wrapProgress(progress: number): number {
  if (!Number.isFinite(progress)) return 0;
  return ((progress % 1) + 1) % 1;
}

export function particleProgress(
  timeSeconds: number,
  speed: number,
  offset: number,
): number {
  return wrapProgress(timeSeconds * speed + offset);
}

export function oxygenationAlongSegment(
  progress: number,
  start: Oxygenation,
  end: Oxygenation,
): FlowSample {
  const blend = Math.max(0, Math.min(1, progress));
  if (start === end) return { oxygenation: start, blend: 0 };
  if (blend < 0.15) return { oxygenation: start, blend };
  if (blend > 0.85) return { oxygenation: end, blend };
  return { oxygenation: "transition", blend };
}

export function pointsAreFinite(points: readonly Point3[]): boolean {
  return (
    points.length >= 2 &&
    points.every((point) =>
      point.every((coordinate) => Number.isFinite(coordinate)),
    )
  );
}

export function endpointsMatch(
  first: readonly Point3[],
  second: readonly Point3[],
  tolerance = 0.001,
): boolean {
  const a = first.at(-1);
  const b = second[0];
  if (!a || !b) return false;
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) <= tolerance;
}
