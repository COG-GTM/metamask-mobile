import { createRemainingTimeStore } from './remainingTimeStore';

describe('createRemainingTimeStore', () => {
  it('returns the initial value', () => {
    expect(createRemainingTimeStore(10000).get()).toBe(10000);
  });

  it('notifies subscribers only when the value changes', () => {
    const store = createRemainingTimeStore(10000);
    const listener = jest.fn();
    store.subscribe(listener);

    store.set(9000);
    store.set(9000);

    expect(store.get()).toBe(9000);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('stops notifying after unsubscribe', () => {
    const store = createRemainingTimeStore(10000);
    const listener = jest.fn();
    const unsubscribe = store.subscribe(listener);

    unsubscribe();
    store.set(9000);

    expect(listener).not.toHaveBeenCalled();
  });
});
