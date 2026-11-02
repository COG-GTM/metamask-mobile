/**
 * In-memory (never persisted) suppression of auto-lock.
 *
 * Flows that temporarily leave the app (e.g. ramp provider checkout in the
 * system browser, Apple Pay) must not write a temporary value into the
 * persisted `settings.lockTime`, because a process kill before the restore
 * would leave auto-lock disabled. This state resets on every app launch.
 */
let activeSuppressions = 0;

/** Returns whether any flow currently suppresses auto-lock. */
export const isAutoLockSuppressed = (): boolean => activeSuppressions > 0;

/**
 * Suppresses auto-lock until the returned release function is called.
 * Release is idempotent and suppressions are reference counted.
 */
export const suppressAutoLock = (): (() => void) => {
  activeSuppressions += 1;
  let released = false;
  return () => {
    if (released) {
      return;
    }
    released = true;
    activeSuppressions = Math.max(0, activeSuppressions - 1);
  };
};
