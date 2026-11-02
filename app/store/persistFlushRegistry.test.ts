import {
  flushRegisteredPersistedState,
  registerPersistFlush,
} from './persistFlushRegistry';

describe('persistFlushRegistry', () => {
  afterEach(() => registerPersistFlush(undefined));

  it('resolves when no flush is registered', async () => {
    await expect(flushRegisteredPersistedState()).resolves.toBeUndefined();
  });

  it('waits for the registered flush to complete', async () => {
    let completed = false;
    registerPersistFlush(
      () =>
        new Promise<void>((resolve) =>
          setTimeout(() => {
            completed = true;
            resolve();
          }, 10),
        ),
    );

    await flushRegisteredPersistedState();

    expect(completed).toBe(true);
  });
});
