type FlushFn = () => Promise<void>;

let registeredFlush: FlushFn | undefined;

/**
 * Registers the function that writes the persisted redux state to disk
 * immediately. Called once by the store when it is created.
 */
export const registerPersistFlush = (flush: FlushFn | undefined) => {
  registeredFlush = flush;
};

/**
 * Writes any persisted redux state still held by the persist throttle or the
 * storage debounce to disk. Resolves once the write has completed, or
 * immediately when no store has been registered.
 */
export const flushRegisteredPersistedState = async (): Promise<void> => {
  if (registeredFlush) {
    await registeredFlush();
  }
};
