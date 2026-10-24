import { CASE } from "../config/anatomy";
import { coverage, timi, type State } from "../physics/model";
export function debrief(s: State) {
  const ratio = (s.deployedSpec?.diameter ?? 0) / CASE.reference;
  const covered = s.deployedSpec
    ? coverage(s.deployedPosition, s.deployedSpec.length)
    : 0;
  const score = Math.max(
    0,
    Math.round(
      100 -
        (s.deployed ? 0 : 35) -
        (1 - covered) * 20 -
        s.dissection * 40 -
        (s.rupture ? 15 : 0) -
        Math.min(15, s.force / 2) -
        (s.heparin ? 0 : 8) -
        (s.predilated ? 0 : 7) -
        (s.qca ? 0 : 3) -
        (s.finalViews.length >= 2 ? 0 : 7) -
        (s.longestInflation > 30 ? 10 : 0) -
        (timi(s.flow) < 3 ? 15 : 0),
    ),
  );
  return {
    score,
    grade:
      score >= 90 ? "Excellent" : score >= 70 ? "Satisfactory" : "Needs work",
    residualStenosis: s.residual,
    timi: timi(s.flow),
    stentReferenceRatio: ratio,
    lesionCoverage: covered,
    heparin: s.heparin,
    act: s.act,
    predilation: s.predilated,
    qca: s.qca,
    dissection: s.dissection,
    wireForcing: s.force,
    balloonRupture: s.rupture,
    longestInflation: s.longestInflation,
    contrastVolume: s.contrast,
    fluoroscopyTime: s.fluoroTime,
    finalViewCount: s.finalViews.length,
    completedStages: s.completed.filter(Boolean).length,
    explanations: [
      covered < 1
        ? "Geographic miss leaves part of the lesion untreated."
        : "Stent covers the modeled lesion.",
      s.dissection > 0
        ? "Vessel injury reduces flow; excessive sizing or force caused modeled dissection."
        : "No modeled dissection.",
      ratio > 1.15
        ? "Oversizing increases vessel injury."
        : "Compare stent diameter against the reference vessel.",
      s.longestInflation > 30
        ? "Prolonged occlusion increases simulated ischemia."
        : "Short inflations allow flow recovery.",
      "All thresholds are simplified teaching rules, not treatment guidance.",
    ],
  };
}
