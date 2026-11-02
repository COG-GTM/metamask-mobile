export interface RemainingTimeStore {
  get: () => number;
  set: (value: number) => void;
  subscribe: (listener: () => void) => () => void;
}

export function createRemainingTimeStore(
  initialValue: number,
): RemainingTimeStore {
  let value = initialValue;
  const listeners = new Set<() => void>();

  return {
    get: () => value,
    set: (nextValue) => {
      if (nextValue === value) return;
      value = nextValue;
      listeners.forEach((listener) => listener());
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
