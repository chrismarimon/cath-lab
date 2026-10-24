import { type Action, type State, initialState, step } from "../physics/model";
// Demonstration dispatches exactly the public manual actions; no state overrides.
export function demoActions(): Action[] {
  const a: Action[] = [];
  const add = (action: Action) => a.push(action);
  const wait = (seconds: number) => {
    for (let i = 0; i < seconds * 10; i++) add({ type: "tick", dt: 0.1 });
  };
  add({ type: "heparin" });
  add({ type: "qca" });
  add({ type: "fluoro", on: true });
  for (let i = 0; i < 10; i++) add({ type: "move", delta: 10 });
  add({ type: "rotate", delta: 20 });
  add({ type: "move", delta: 1 });
  add({ type: "contrast" });
  wait(3);
  add({ type: "select", device: "wire" });
  for (let i = 0; i < 6; i++) add({ type: "move", delta: 10 });
  add({ type: "select", device: "balloon" });
  add({ type: "size", device: "balloon", diameter: 2.5, length: 15 });
  add({ type: "move", delta: 38 });
  add({ type: "pressure", delta: 10 });
  wait(12);
  add({ type: "pressure", delta: -26 });
  wait(8);
  add({ type: "select", device: "stent" });
  add({ type: "size", device: "stent", diameter: 3, length: 18 });
  add({ type: "pressure", delta: 12 });
  wait(5);
  add({ type: "pressure", delta: -26 });
  wait(8);
  add({ type: "projection", index: 0 });
  add({ type: "contrast" });
  wait(4);
  add({ type: "projection", index: 2 });
  add({ type: "contrast" });
  wait(4);
  add({ type: "fluoro", on: false });
  return a;
}
export function runDemo(): State {
  return demoActions().reduce(step, initialState());
}
