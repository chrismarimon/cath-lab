import { initialState, step, type Action, type State } from "../physics/model";
export function createStore() {
  let state = initialState();
  const listeners = new Set<(s: State) => void>();
  return {
    get: () => state,
    dispatch: (a: Action) => {
      state = step(state, a);
      listeners.forEach((fn) => fn(state));
    },
    reset: () => {
      state = initialState();
      listeners.forEach((fn) => fn(state));
    },
    subscribe: (fn: (s: State) => void) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}
